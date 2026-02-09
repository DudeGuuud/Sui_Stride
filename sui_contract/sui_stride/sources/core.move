module sui_stride::core {
    use sui::coin::{Self, Coin};
    use sui::balance::Balance;
    use sui::clock::Clock;
    use sui::event;
    use std::string::String;
    use sui_stride::strd::STRD;

    // --- Constants ---
    const E_POOL_ENDED: u64 = 1;
    const E_POOL_ACTIVE: u64 = 2;
    const E_ALREADY_VOTED: u64 = 5;
    const E_ALREADY_CLAIMED: u64 = 6;
    const E_MAX_PARTICIPANTS: u64 = 7;
    const E_INVALID_SESSION: u64 = 8;

    const PLATFORM_FEE_BPS: u64 = 400; // 4% (Basis Points)
    const MAX_PARTICIPANTS: u64 = 100; // Prevent gas limit issues

    // --- Structs ---

    /// User Profile Object - Owned by User
    public struct UserData has key, store {
        id: UID,
        device_pubkey: vector<u8>, // Device-specific public key for attestation
        total_steps: u64,
        active_stakes: vector<StakeInfo>
    }

    /// Helper struct for active stakes
    public struct StakeInfo has store, copy, drop {
        pool_id: ID,
        amount: u64,
        staked_at: u64
    }

    /// Staking Pool - Shared Object
    public struct StakingPool has key, store {
        id: UID,
        creator: address,
        strd_treasury: Balance<STRD>,
        duration_secs: u64,
        created_at: u64,
        participants: vector<Participant>,
        finalized: bool
    }

    /// Participant info inside the Pool
    public struct Participant has store, copy, drop {
        user_id: address,
        amount: u64, // Amount staked
        steps: u64,  // Steps recorded for this pool event
        merkle_root: vector<u8>, // Root hash of the trajectory segments
        claimed: bool,
        challenged: bool
    }

    /// Workout Session - Short-lived object to prevent replay
    public struct Session has key, store {
        id: UID,
        user: address,
        pool_id: ID,
        nonce: u64,
        expires_at: u64
    }

    /// Governance Proposal - Shared Object
    public struct Proposal has key, store {
        id: UID,
        description: String,
        executor: address,
        yes_votes: u64,
        no_votes: u64,
        voters: vector<address>,
        executed: bool
    }

    /// Capability to collect fees
    public struct AdminCap has key, store { id: UID }

    // --- Events ---
    public struct PoolCreated has copy, drop { pool_id: ID, creator: address }
    public struct Staked has copy, drop { pool_id: ID, user: address, amount: u64 }
    public struct StepsSubmitted has copy, drop { user: address, steps: u64, root: vector<u8> }
    public struct RewardsDistributed has copy, drop { pool_id: ID, winner_count: u64 }
    public struct ChallengeInitiated has copy, drop { pool_id: ID, user: address, segment_index: u64 }

    // --- Functions ---

    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    }

    // --- User Management ---

    #[allow(lint(self_transfer))]
    public fun create_user(pubkey: vector<u8>, ctx: &mut TxContext) {
        let user = UserData {
            id: object::new(ctx),
            device_pubkey: pubkey,
            total_steps: 0,
            active_stakes: vector::empty()
        };
        transfer::transfer(user, ctx.sender());
    }

    // --- Session Management ---

    #[allow(lint(self_transfer))]
    public fun start_run(
        pool: &StakingPool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let session = Session {
            id: object::new(ctx),
            user: ctx.sender(),
            pool_id: object::id(pool),
            nonce: tx_context::epoch(ctx), // Use epoch as simple nonce
            expires_at: clock.timestamp_ms() + (pool.duration_secs * 1000)
        };
        transfer::transfer(session, ctx.sender());
    }

    // --- Pool Management ---

    public fun create_pool(
        payment: Coin<STRD>,
        duration: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let sender = ctx.sender();
        let created_at = clock.timestamp_ms();

        let mut pool = StakingPool {
            id: object::new(ctx),
            creator: sender,
            strd_treasury: coin::into_balance(payment),
            duration_secs: duration,
            created_at,
            participants: vector::empty(),
            finalized: false
        };

        // Creator is the first participant
        let participant = Participant {
            user_id: sender,
            amount,
            steps: 0,
            merkle_root: vector::empty(),
            claimed: false,
            challenged: false
        };
        pool.participants.push_back(participant);

        event::emit(PoolCreated { pool_id: object::id(&pool), creator: sender });
        
        // Share the object so others can join
        transfer::share_object(pool);
    }

    public fun stake(
        pool: &mut StakingPool,
        user_data: &mut UserData,
        payment: Coin<STRD>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock.timestamp_ms();
        // Ensure pool is active
        assert!(current_time < pool.created_at + (pool.duration_secs * 1000), E_POOL_ENDED);
        assert!(pool.participants.length() < MAX_PARTICIPANTS, E_MAX_PARTICIPANTS);

        let amount = coin::value(&payment);
        let sender = ctx.sender();

        // Add to treasury
        pool.strd_treasury.join(coin::into_balance(payment));

        // Add to participants
        let participant = Participant {
            user_id: sender,
            amount,
            steps: 0, // Steps start at 0 for this pool
            merkle_root: vector::empty(),
            claimed: false,
            challenged: false
        };
        pool.participants.push_back(participant);

        // Update User Profile
        let stake_info = StakeInfo {
            pool_id: object::id(pool),
            amount,
            staked_at: current_time
        };
        user_data.active_stakes.push_back(stake_info);

        event::emit(Staked { pool_id: object::id(pool), user: sender, amount });
    }

    // --- Steps & Ranking ---

    /// Submit steps with Merkle Proof commitment
    public fun submit_run_with_proof(
        pool: &mut StakingPool,
        user_data: &mut UserData,
        session: Session,
        steps: u64,
        merkle_root: vector<u8>,
        _signature: vector<u8>, // In production, verify this against user_data.device_pubkey
        clock: &Clock, 
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let Session { id, user, pool_id, nonce: _, expires_at } = session;
        object::delete(id);

        assert!(user == sender, E_INVALID_SESSION);
        assert!(pool_id == object::id(pool), E_INVALID_SESSION);
        assert!(clock.timestamp_ms() <= expires_at, E_POOL_ENDED);
        assert!(!pool.finalized, E_POOL_ENDED); 

        // Update global user stats
        user_data.total_steps = user_data.total_steps + steps;

        // Update pool participant steps and root
        let len = pool.participants.length();
        let mut i = 0;
        while (i < len) {
            let p = &mut pool.participants[i];
            if (p.user_id == sender) {
                p.steps = p.steps + steps;
                p.merkle_root = merkle_root;
                break
            };
            i = i + 1;
        };
        
        event::emit(StepsSubmitted { user: sender, steps, root: merkle_root });
    }

    // --- Challenges ---

    /// Optimistic Challenge: Anyone can challenge a run if they suspect foul play
    public fun challenge_run(
        pool: &mut StakingPool,
        target_user: address,
        segment_index: u64,
        _ctx: &mut TxContext
    ) {
        // Mark participant as challenged
        let len = pool.participants.length();
        let mut i = 0;
        while (i < len) {
            let p = &mut pool.participants[i];
            if (p.user_id == target_user) {
                p.challenged = true;
                break
            };
            i = i + 1;
        };

        event::emit(ChallengeInitiated { 
            pool_id: object::id(pool), 
            user: target_user, 
            segment_index 
        });
    }

    // --- Rewards & Governance ---

    /// Distribute rewards based on ranking
    #[allow(lint(self_transfer))]
    public fun distribute_rewards(
        pool: &mut StakingPool,
        _admin_cap: &mut AdminCap, 
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock.timestamp_ms();
        assert!(current_time >= pool.created_at + (pool.duration_secs * 1000), E_POOL_ACTIVE);
        assert!(!pool.finalized, E_ALREADY_CLAIMED);

        pool.finalized = true;

        let total_balance = pool.strd_treasury.value();
        if (total_balance == 0) return;

        // 1. Take Platform Fee
        let fee_amount = (total_balance * PLATFORM_FEE_BPS) / 10000;
        let fee_balance = pool.strd_treasury.split(fee_amount);
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, ctx.sender()); 

        // 2. Rank Users (Simple Bubble Sort)
        let len = pool.participants.length();
        let mut i = 0;
        while (i < len) {
            let mut j = 0;
            while (j < len - i - 1) {
                let p1_steps = pool.participants[j].steps;
                let p2_steps = pool.participants[j + 1].steps;
                if (p1_steps < p2_steps) {
                    pool.participants.swap(j, j + 1);
                };
                j = j + 1;
            };
            i = i + 1;
        };

        // 3. Distribute to Top 50%
        let winners_count = if (len > 1) { len / 2 } else { 1 };
        let reward_pot = pool.strd_treasury.value();
        let reward_per_winner = reward_pot / winners_count;

        let mut k = 0;
        while (k < winners_count) {
            let p = &mut pool.participants[k];
            let reward = pool.strd_treasury.split(reward_per_winner);
            let reward_coin = coin::from_balance(reward, ctx);
            transfer::public_transfer(reward_coin, p.user_id);
            p.claimed = true;
            k = k + 1;
        };

        event::emit(RewardsDistributed { pool_id: object::id(pool), winner_count: winners_count });
    }

    // --- Proposals ---

    public fun create_proposal(description: String, ctx: &mut TxContext) {
        let proposal = Proposal {
            id: object::new(ctx),
            description,
            executor: ctx.sender(),
            yes_votes: 0,
            no_votes: 0,
            voters: vector::empty(),
            executed: false
        };
        transfer::share_object(proposal);
    }

    public fun vote_on_proposal(proposal: &mut Proposal, vote: bool, ctx: &mut TxContext) {
        let sender = ctx.sender();
        assert!(!proposal.voters.contains(&sender), E_ALREADY_VOTED);
        
        proposal.voters.push_back(sender);
        if (vote) {
            proposal.yes_votes = proposal.yes_votes + 1;
        } else {
            proposal.no_votes = proposal.no_votes + 1;
        };
    }
}
