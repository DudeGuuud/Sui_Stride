# Sui_Stride 开发计划 - Linus Edition

> "Talk is cheap. Show me the code." - Linus Torvalds

这份计划不是给 PPT 工程师看的，是给干活的人看的。我们需要构建一个基于真实地理位置、利用 Enoki 降低门槛、通过 Nautilus 保证公平的 Move-to-Earn 应用。

核心哲学：**数据结构优先，拒绝过度设计，用户体验至上。**

## 0. 核心架构与数据流 ( The "Good Taste" Part )

我们不需要一个庞大的后端来管理一切。后端只做两件事：
1. **索引与缓存**：为了 App 跑得快。
2. **连接 Web2 与 Web3**：为了用户进得来。

**真理（Truth）在链上，计算（Compute）在 TEE（Nautilus），体验（UX）在客户端。**

### 数据结构设计

#### A. 客户端/Supabase (Web2 映射层)
不要把私钥存服务器。永远不要。
```sql
TABLE users (
    id UUID PRIMARY KEY, -- App 内部 ID
    google_sub_id VARCHAR UNIQUE, -- Google 的唯一标识
    sui_address VARCHAR(66) UNIQUE, -- 派生出的 Sui 地址 (Enoki)
    -- 不需要存 salt，Enoki 会处理，或者存储加密后的 salt (视 Enoki 具体实现而定)
    created_at TIMESTAMP
);
```

#### B. 链上 (Move Objects)
一切皆对象。
```move
module sui_stride::core {
    /// 用户的核心资产。灵魂绑定(SBT)或可转移，取决于产品定义。
    /// 建议：Avatar 是 SBT，装备是 NFT。
    struct StrideAvatar has KEY, STORE {
        id: UID,
        level: u64,
        exp: u64,
        energy: u64,
        // 装备槽位...
    }

    /// 经过 Nautilus 验证的运动证明
    struct WorkoutProof has DROP {
        user: address,
        distance: u64,
        timestamp: u64,
        // Nautilus 的签名，用于验证这确实是 AI 算出来的
    }
}
```

---

## 1. 开发阶段分解

### 阶段一：地基与身份 (Foundation & Identity)
**目标**：用户能用 Google 登录，并且我们在 Supabase 和链上都有了对应的"人"。

1.  **Enoki 集成 (React Native)**:
    *   集成 `Enoki` SDK。
    *   实现 Google OAuth 流程。
    *   **关键点**：获取 zkLogin 签名，派生 Sui 地址。不要自己造轮子，用官方/社区的 React Native 适配方案。
2.  **Supabase 映射**:
    *   用户登录成功后，在 `users` 表确保存储了 `google_sub_id` <-> `sui_address` 的映射。
3.  **Hello World 交易**:
    *   App 发起一笔简单的交易（例如给自己转 0.001 SUI 或 Mint 一个测试 NFT），通过 zkLogin 签名上链。
    *   *验证标准*：App 内点击按钮，Sui Explorer 上能看到交易。

### 阶段二：核心机制 - 运动追踪 (The "Legs")
**目标**：准确、省电地记录轨迹，别把用户手机跑烫了。

1.  **位置服务**:
    *   使用 `expo-location` (前台) 和配置后台定位能力。
    *   **难点**：Android/iOS 的后台保活。需要配置正确的 Permissions。
2.  **本地存储 (SQLite)**:
    *   运动时断网怎么办？数据先存本地 SQLite。
    *   `WorkoutSession`: `{ id, start_time, end_time, path_points: BLOB }`
3.  **防作弊预处理**:
    *   不要把所有 GPS 点都发给后端，太大了。
    *   客户端做初步过滤（速度异常、距离跳变）。

### 阶段三：信任层 - Nautilus AI (The "Brain")
**目标**：用 AI 告诉链，这个用户真的跑了 5 公里，不是坐在法拉利里兜风。

*注意：在 Nautilus 完全成熟前，可用"中心化预言机"模式作为过渡，但架构要预留 TEE 接口。*

1.  **推理服务**:
    *   接收：一组 GPS 坐标 + 时间戳 + 传感器数据（加速度计）。
    *   处理：AI 模型判断运动模式（跑步 vs 骑车 vs 开车）。
    *   输出：`{ valid: true, distance: 5000, type: "run", signature: "0x..." }`
2.  **上链**:
    *   前端拿到“签名结果”，构建交易 `submit_workout(proof, signature)`。
    *   Move 合约验证签名（验证这是 Nautilus/预言机 签发的），然后发放奖励。

### 阶段四：经济系统与市场 (The "Economy")
**目标**：让 NFT 流动起来。

1.  **Avatar 系统**:
    *   编写 Move 合约：`upgrade_avatar`, `mint_item`。
    *   属性设计：简单的数值模型。不要搞复杂了，这不是魔兽世界。
2.  **市场 (Kiosk)**:
    *   使用 Sui 官方的 `Kiosk` 标准。
    *   用户可以在 App 内挂单卖出的装备 NFT。
    *   **UI**：简单的列表页 + 购买按钮。

---

## 2. 技术栈清单 (The Right Tools)

*   **Mobile**: Expo (React Native) + NativeWind (Tailwind)
    *   *Why*: 也就是你现在的栈。开发快，跨平台。
*   **Auth**: Enoki (zkLogin)
    *   *Why*: 消除助记词门槛。
*   **Backend**: Supabase
    *   *Why*: PostgreSQL + Auth + Edge Functions，够用了。
*   **Smart Contract**: Sui Move
    *   *Why*: 面向对象，适合游戏资产建模。
*   **Verification**: Nautilus (TEE) / Node.js Oracle (MVP)
    *   *Why*: 解决"垃圾进，垃圾出"的问题。

## 3. 下一步行动 (Action Items)

1.  **配置 Enoki**: 去 Mysten Labs 开发者后台申请 Key。
2.  **清理代码**: `proposal.md` 里的废话删掉，保留架构图。
3.  **原型**: 跑通 `Login -> Get Address -> Show Address` 流程。

> "Good code is its own best documentation." - 去写代码吧。
