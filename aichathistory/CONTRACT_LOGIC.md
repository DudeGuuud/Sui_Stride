# SuiStride Contract Logic

This document details the architecture and logic of the SuiStride smart contracts. The system is designed as a "Step-to-Earn" platform where users stake tokens, compete in step challenges, and the top performers share the pool's total stake.

## 1. Token: STRD (`strd.move`)

The `STRD` token is the native utility token for the platform.

- **Type:** Standard Sui Coin (implementation of `sui::coin`).
- **Initialization:**
  - Uses the **One-Time Witness (OTW)** pattern (`struct STRD has drop {}`) to ensure unique registration.
  - **Decimals:** 9
  - **Symbol:** "STRD"
  - **Name:** "Sui Stride Token"
  - **Icon:** Hosted at `https://github.com/DudeGuuud/Sui_Stride/blob/web-view/public/images/logo.png`.
- **Capabilities:**
  - **Minting/Burning:** Controlled by a `TreasuryCap` which is transferred to the deployer upon initialization.
  - **Metadata:** Frozen (immutable) after creation.

## 2. Core Logic (`core.move`)

The core module manages user profiles, staking pools, step tracking, and governance.

### A. Data Structures

1.  **UserData (User Profile)**
    - **Type:** Owned Object (`key`, `store`).
    - **Purpose:** Stores persistent user data across different pools.
    - **Fields:**
        - `total_steps`: Aggregate steps over all time.
        - `active_stakes`: A vector of `StakeInfo` tracking current pool participations.

2.  **StakingPool (The Challenge)**
    - **Type:** Shared Object (`key`, `store`).
    - **Purpose:** Represents a single competition event.
    - **Fields:**
        - `creator`: Address of the pool creator.
        - `strd_treasury`: A `Balance<STRD>` holding all staked tokens.
        - `duration_secs`: How long the pool lasts.
        - `participants`: List of users, their stakes, and their step counts for this specific pool.
        - `finalized`: Boolean flag to prevent double-claiming.

3.  **Proposal (Governance)**
    - **Type:** Shared Object.
    - **Purpose:** Simple on-chain voting mechanism.
    - **Fields:** Description, vote counts (yes/no), and a list of voters (to prevent double voting).

### B. Key Workflows

#### 1. Pool Creation
- **Function:** `create_pool`
- **Logic:**
    - User sends `Coin<STRD>` (initial stake).
    - Contract creates a `StakingPool` object.
    - Sets the `creator` as the first participant.
    - **Shares** the object so others can interact with it.

#### 2. Staking (Joining a Pool)
- **Function:** `stake`
- **Constraints:**
    - Pool must be active (current time < end time).
    - Participant count must be below `MAX_PARTICIPANTS` (100).
- **Logic:**
    - User sends `Coin<STRD>`.
    - Coin is merged into the pool's `strd_treasury`.
    - User is added to the `participants` list with 0 steps.
    - `UserData` is updated to reflect the active stake.

#### 3. Step Submission
- **Function:** `submit_steps`
- **Note:** Currently relies on the client to submit steps honestly (Oracle-less prototype).
- **Logic:**
    - Can be called while the pool is not finalized.
    - Updates the user's step count **in the specific pool**.
    - Updates the user's global `total_steps` in their `UserData`.

#### 4. Reward Distribution (The "End Game")
- **Function:** `distribute_rewards`
- **Trigger:** Callable by anyone (usually Admin or automation) after the pool duration expires.
- **Process:**
    1.  **Fee Collection:** 4% (`PLATFORM_FEE_BPS`) of the total pot is taken as a platform fee and sent to the caller (Admin).
    2.  **Ranking:**
        - Performs an on-chain **Bubble Sort** on the `participants` vector based on step counts.
        - *Constraint:* Due to gas costs of O(N²) sorting, `MAX_PARTICIPANTS` is capped at 100.
    3.  **Distribution:**
        - The top **50%** of participants are declared winners.
        - The remaining pot is divided equally among these winners.
        - The bottom 50% lose their stake.
    4.  **Finalization:** Sets `finalized = true` to lock the pool.

### C. Governance
- **Proposals:** Any user can create a text-based proposal.
- **Voting:** Users can vote "Yes" or "No". The contract tracks voter addresses to enforce one-vote-per-address.

## 3. Technical Constraints & Security

1.  **Scalability (Bubble Sort):**
    - The contract uses Bubble Sort for ranking. This is computationally expensive (O(N²)).
    - **Mitigation:** The pool size is strictly limited to 100 participants (`MAX_PARTICIPANTS`) to ensure the transaction stays within the Sui gas limit.

2.  **Trust Model (Step Data):**
    - The `submit_steps` function accepts step counts directly from the user's transaction.
    - **Risk:** Users can technically call this function directly with arbitrary numbers.
    - **Context:** For a prototype/hackathon, this demonstrates the logic. In production, this would require a signed message from a trusted backend or a dedicated Oracle.

3.  **Dust:**
    - Integer division during reward distribution may leave a tiny amount of "dust" (indivisible tokens) in the pool object. This is currently left in the object.

## 4. 安全与隐私架构 (Security & Architecture Spec)

针对用户提出的“脱敏轨迹”、“防作弊”与“数据源可信性”需求，我们设计了一套结合 **Session (会话)**、**Device Attestation (设备证明)** 与 **Merkle Challenge (默克尔挑战)** 的混合安全架构。

### A. 核心策略：Session-Nonce-Signature (会话-随机数-签名)

为了证明数据是“新鲜生成”的且来自“真实设备”，我们引入以下机制：

#### 1. 会话机制 (Session Mechanism) - 防止重放 (Anti-Replay)
每次跑步必须先申请一个唯一的 Session，其包含一个随机数 (Nonce)。这使得昨天的合法数据在今天提交时会因为 Nonce 不匹配而失效。

- **Start Run**: Client -> Contract/Backend: `request_session()`
- **Response**: `SessionID: 1001`, `Nonce: 0xRandom123`, `StartTime: Now`, `ExpiresAt: Now + 2h`.

#### 2. 设备证明 (Device Attestation) - 防止模拟器 (Anti-Spoofing)
利用移动端的硬件安全模块 (Secure Enclave / Keystore)。
- **注册**: 首次使用 App 时，设备生成一对密钥 `(Device_Pub, Device_Priv)`。`Device_Priv` 永不出硬件。我们将 `Device_Pub` 注册到合约的用户资料中。
- **签名**: 所有提交的数据（Merkle Root）必须由 `Device_Priv` 签名。智能合约会验证签名是否匹配该用户的注册设备。

### B. 数据结构与隐私

#### 1. 相对坐标系 (Privacy)
不记录绝对经纬度。只记录相对于起点 (0,0) 的 ENU (East-North-Up) 偏移量。

#### 2. 默克尔化轨迹 (Merkle-ized Data)
客户端将轨迹切片（如每分钟一段），混入 `Session_Nonce`，构建 Merkle Tree。

```rust
// 伪代码：叶子节点计算
Leaf_i = Hash(
    Segment_Data_i + // 包含 x, y, v, acc_var
    Session_Nonce    // 绑定当前会话
)
Root = MerkleRoot([Leaf_1, Leaf_2, ...])
```

### C. 完整交互流程 (Protocol)

#### Step 1: 申请开始 (Start)
- 用户点击 "Start Run"。
- 获得 `SessionID` 和 `Nonce`。

#### Step 2: 跑步与本地计算 (Run & Local Compute)
- 手机传感器采集数据 (GPS + IMU)。
- 本地进行卡尔曼滤波 (Kalman Filter) 降噪。
- 实时构建包含 `Nonce` 的 Merkle Tree。

#### Step 3: 提交与锁定 (Commit)
- 跑步结束，生成最终 `Root`。
- **硬件签名**: `Sig = Sign(Device_Priv, Root + SessionID)`.
- **上链**: `submit_run(session_id, root, signature, total_steps)`.
- **合约验证**:
    1. Session 是否有效且未过期？
    2. Signature 是否来自用户的 `Device_Pub`？
    3. 如果通过 -> 锁定奖励，进入挑战期。

#### Step 4: 挑战与裁决 (Challenge & Verdict)
- **挑战者** (Verifier) 下载数据，验证物理逻辑（速度、加速度方差）。
- 如果发现作弊 -> 发起链上挑战，要求用户披露特定 Merkle 叶子节点。
- 用户如果不响应或数据验证失败 -> 罚没。

### D. 总结
此架构通过 **Session** 解决了时间上的作弊（重放），通过 **Device Signature** 解决了空间上的作弊（模拟器），通过 **Merkle Tree** 解决了数据完整性和隐私问题。

## 5. 前端轨迹采集与防作弊规范 (Frontend Spec)

本节详细说明前端 App 在跑步过程中如何采集数据、计算特征以及执行防作弊检测。所有逻辑将在客户端（TypeScript）执行，最终生成上链所需的 Hash 和 Proof。

### A. 相对坐标计算 (Relative Positioning)

我们使用简单的 **平坦地球投影 (Equirectangular Projection)** 近似计算，因为跑步范围（<50km）内地球曲率影响可忽略。

**算法步骤:**
1.  **锁定原点**: 记录用户点击 Start 时的 `(Lat0, Lon0)`。
2.  **转换公式**:
    对于后续每个点 `(Lat_t, Lon_t)`:
    - `dLat = Lat_t - Lat0`
    - `dLon = Lon_t - Lon0`
    - `x (Meters) = dLon * 111320 * cos(Lat0)` (经度向东偏移)
    - `y (Meters) = dLat * 110574` (纬度向北偏移)
3.  **输出**: 轨迹是一个点集 `[(0,0), (x1,y1), (x2,y2)...]`。绝不上传 `Lat0/Lon0`。

### B. 信号处理与降噪 (Signal Processing)

移动端 GPS 存在漂移（尤其在高楼旁）。必须使用 **简化卡尔曼滤波 (Simple 1D Kalman Filter)** 分别处理 Lat 和 Lon。

```typescript
class KalmanFilter {
    private Q = 0.00001; // 过程噪声协方差 (Process Noise)
    private R = 0.01;    // 测量噪声协方差 (Measurement Noise)
    private x = 0;       // 估计值
    private p = 1;       // 估计误差协方差

    update(measurement: number) {
        // 预测
        const p_pred = this.p + this.Q;
        // 更新
        const K = p_pred / (p_pred + this.R); // 卡尔曼增益
        this.x = this.x + K * (measurement - this.x);
        this.p = (1 - K) * p_pred;
        return this.x;
    }
}
```

### C. 实时防作弊特征 (Real-time Anti-Cheat Metrics)

前端需实时计算以下指标，并在每一分钟的 `RunSegment` 中记录统计值。

#### 1. 瞬时配速 (Instant Pace)
- **计算**: `v = distance(p_t, p_t-1) / (time_t - time_t-1)`
- **阈值**:
    - 如果 `v > 12.5 m/s` (45km/h) 持续超过 5秒 -> **标记为 VEHICLE (车辆)**。
    - 正常人类冲刺极限约 12m/s (博尔特)。

#### 2. 加速度方差 (Acceleration Variance) - 防摇步机
摇步机产生的加速度是规律的正弦波，而真实跑步的加速度是复杂的冲击波。
- **采集**: 监听 `DeviceMotion` (50Hz)。
- **计算**: 每秒计算合成加速度 $a = \sqrt{ax^2 + ay^2 + az^2}$ 的方差。
- **判定**:
    - `Variance < 0.05` 且 `Speed > 2m/s` -> **平滑移动 (滑板车/车)**。
    - `Variance` 呈现极度规律的周期性 -> **机械摇步机**。

#### 3. 步频与速度的相关性 (Cadence-Speed Correlation)
- 人类跑步时，速度越快，步频越高。
- **判定**: 如果 `Speed` 增加但 `Cadence` 不变（或反之），大概率是模拟器伪造数据。

### D. 数据打包与哈希 (Packing & Hashing)

1.  **Segment 切分**: 每 60s 打包一个 JSON 对象。
2.  **字段**:
    ```json
    {
      "seq": 1,
      "start_xy": [10.5, 20.1],
      "end_xy": [105.2, 150.3],
      "avg_pace": 3.5, // min/km
      "avg_acc_var": 0.8,
      "steps": 150,
      "session_nonce": "0xABC..."
    }
    ```
3.  **Hash**: 使用 `Keccak256` 或 `Sha256` 计算该 JSON 的 Hash，作为 Merkle Leaf。
