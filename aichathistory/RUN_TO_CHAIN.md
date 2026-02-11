# SuiStride: Run-to-Chain Closed Loop Technical Architecture

This document details the complete data flow from physical movement to blockchain verification for SuiStride, emphasizing the "Good Taste" engineering principles: **Privacy-First**, **Anti-Cheat**, and **Gas Efficiency**.

## 1. Data Collection & Real-time Persistence (The "Truth")

**Goal:** Capture high-fidelity motion data while ensuring it survives app crashes or network failures.

*   **Source:** GPS (Coordinates, Speed) + Pedometer (Steps) via React Native Bridge.
*   **Processing:** Raw data is fed into a **Kalman Filter** to smooth GPS noise.
*   **Privacy:** Absolute GPS coordinates (Lat/Lon) are immediately converted to **Relative Coordinates (ENU)** relative to the start point. **We never store absolute paths on-chain.**
*   **Persistence:** Every processed point is written to **IndexedDB** (`stride-db`) in real-time.

```typescript
// src/lib/stride-logic.ts
// Relative Coordinate Calculation (simplified)
const dLat = fLat - origin.lat;
const dLon = fLon - origin.lon;
const y = dLat * LAT_METERS; // North
const x = dLon * LON_METERS * Math.cos(origin.lat); // East
```

## 2. Segmentation & Feature Extraction (The "Proof")

**Goal:** Compress raw data into verifiable "Segments" to enable efficient on-chain proof.

*   **Mechanism:** Data is aggregated into **1-minute segments**.
*   **Feature Vector:** Each segment $S_i$ is a vector containing 8 dimensions:
    $$S_i = \{ seq, \Delta\vec{p}, \bar{v}, v_{max}, \sigma^2_{acc}, steps, nonce \}$$
    *   $seq$: Sequence number (prevent reordering).
    *   $\Delta\vec{p}$: Displacement vector $(\Delta x, \Delta y)$.
    *   $\bar{v}$: Average speed.
    *   $v_{max}$: Maximum speed (anti-vehicle cheat).
    *   $\sigma^2_{acc}$: **Acceleration Variance** (The "Human Signature").
    *   $steps$: Pedometer count.
    *   $nonce$: **Session Nonce** (anti-replay).

```typescript
// src/lib/stride-logic.ts
// A segment is finalized every 60 seconds
const segment: RunSegment = {
  seq: this.segments.length + 1,
  start_xy: [start.x, start.y],
  end_xy: [end.x, end.y],
  avg_speed,
  max_speed,
  acc_variance: avg_acc_var, // Critical for identifying "human" motion
  steps: this.stepAccumulator,
  session_nonce: this.nonce // Binds data to this specific run
};
```

## 3. Merkle Tree Construction (The "Fingerprint")

**Goal:** Generate a single, tamper-proof **Root Hash** that represents the entire run.

*   **Leaf Hashing:** Each segment $S_i$ is serialized and hashed:
    $$H_i = 	ext{SHA256}(	ext{Serialize}(S_i))$$
*   **Tree Building:** Leaf hashes are paired and hashed recursively until a single Root is formed.
    $$Root = 	ext{Merkle}(\{H_1, H_2, ..., H_n\})$$

This ensures that **changing a single step or millisecond of data changes the Root entirely.**

```typescript
// src/lib/stride-logic.ts
export async function computeMerkleRoot(segments: RunSegment[]): Promise<string> {
  // 1. Hash Leaves
  const leafHashes = await Promise.all(segments.map(s => 
    crypto.subtle.digest('SHA-256', serializeSegment(s))
  ));

  // 2. Build Tree (simplified)
  let level = leafHashes;
  while (level.length > 1) {
    level = pairAndHash(level);
  }

  return "0x" + toHex(level[0]); // The Merkle Root
}
```

## 4. On-Chain Submission (The "Verdict")

**Goal:** Submit the minimal proof to the Sui Blockchain for verification and reward distribution.

*   **Transaction:** A **Programmable Transaction Block (PTB)** is constructed.
*   **Payload:** We submit **ONLY**:
    1.  `Merkle Root` (The fingerprint).
    2.  `Total Distance` (The claim).
    3.  `Total Steps` (The claim).
*   **Contract Logic:** The smart contract (`sui_stride::core`) receives this submission.
    *   It verifies the `Session` is active.
    *   It stores the `Root` as the **Truth** for this run.
    *   (Future) It can challenge specific segments by asking for Merkle Proofs if the data looks suspicious.

```move
// sui_contract/sui_stride/sources/core.move
public entry fun submit_run_with_proof(
    store: &mut ParticipantStore,
    merkle_root: String,
    distance_meters: u64,
    steps: u64,
    ctx: &mut TxContext
) {
    // 1. Verify Session matches (Anti-Replay)
    // 2. Store the Root
    // 3. Emit Event / Update Leaderboard
}
```

## Summary of Anti-Cheat Mechanisms

| Attack Vector | Defense Mechanism |
| :--- | :--- |
| **GPS Spoofing** | Kalman Filter + Speed Limits ($v_{max}$) check. |
| **Phone Shaker** | Acceleration Variance ($\sigma^2_{acc}$) check (must match human gait). |
| **Replay Attack** | **Session Nonce** binding in every segment hash. |
| **Data Tampering** | **Merkle Root** integrity check (changing 1 bit invalidates root). |
| **Privacy Leak** | Only **Relative Coordinates** and **Hashes** leave the device. |


按新 dApp Kit / gRPC 这一套来做，后面接 Enoki 的 zkLogin 和赞助交易是完全兼容的。

从官方资料看：

Enoki 本身就是专门为 zkLogin + Sponsored Transactions 做的服务层，不依赖你前端用的是哪种客户端封装（dApp Kit、裸 @mysten/sui SDK 都可以）。[Enoki sponsorship; Awesome Sui dApp tools]
官方 Plinko 示例就是：前端用 TypeScript SDK 构建 PTB，后端用 Enoki 提供 /sponsor 和 /execute 两个接口，实现赞助交易；前端只需要把 TransactionKind bytes 发给后端、拿回赞助后的 bytes 再让用户签名即可。[Plinko Enoki flow; Plinko implementation]
关键点是：

前端构建交易的方式
你现在用 @mysten/sui 的 Transaction 来构建 PTB，这和 Plinko 示例完全一致，只要在构建 sponsored 交易时：

用 onlyTransactionKind: true 构建 bytes：
const txBytes = await tx.build({
  client,
  onlyTransactionKind: true,
});
[Sponsored tx builder]
创建 SUI coin 时记得 useGasCoin: false，避免用用户的 gas：[Plinko Enoki flow]
后端接 Enoki 的赞助交易
可以直接照 Plinko 的 /api/sponsor 和 /api/execute 模板来接：[Plinko implementation]

/sponsor：用 enokiClient.createSponsoredTransaction 接收前端的 transactionKindBytes，返回赞助后的 bytes + digest。
/execute：用 enokiClient.executeSponsoredTransaction，把 digest + 用户签名发给 Enoki 执行。
zkLogin 也是独立层
Enoki 也提供 zkLogin 能力，它主要影响的是“用户身份/签名来源”，而不是你怎么构建交易或用什么前端框架。Awesome Sui 里也把 Enoki 单独列为 zkLogin + Sponsored Transactions 工具。[Awesome Sui dApp tools]

总结：
你现在按新 dApp Kit + @mysten/sui 的标准方式搭好网络和客户端，后面要接 Enoki 的 zkLogin 和赞助交易，只需要：

在前端用 Transaction + onlyTransactionKind: true 输出 bytes；
在后端按 Plinko 示例接入 Enoki 的 /sponsor + /execute；
在需要赞助的地方创建 coin 时 useGasCoin: false。
这些都和你当前的网络配置方式不冲突，可以平滑叠加。