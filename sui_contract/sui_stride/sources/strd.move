module sui_stride::strd;

use sui::coin::{Self, Coin, TreasuryCap};
use sui::url;

/// The type identifier of STRD coin
public struct STRD has drop {}

/// Register the STRD currency to acquire its `TreasuryCap`.
/// Because this is a module initializer, it ensures the currency only gets
/// registered once.
#[allow(lint(share_owned), deprecated_usage)]
fun init(witness: STRD, ctx: &mut TxContext) {
    // Get a treasury cap for the coin and give it to the transaction sender
    let (treasury_cap, metadata) = coin::create_currency<STRD>(
        witness,
        9, // decimals
        b"STRD", // symbol
        b"Sui Stride Token", // name
        b"The utility token for SuiStride", // description
        option::some(
            url::new_unsafe_from_bytes(
                b"https://github.com/DudeGuuud/Sui_Stride/blob/web-view/public/images/logo.png",
            ),
        ), // icon url
        ctx,
    );

    // Make the metadata immutable (frozen)
    transfer::public_freeze_object(metadata);

    // Transfer the treasury cap to the sender so they can mint and burn
    transfer::public_transfer(treasury_cap, ctx.sender())
}

/// Manager can mint new coins
public fun mint(
    treasury_cap: &mut TreasuryCap<STRD>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    coin::mint_and_transfer(treasury_cap, amount, recipient, ctx)
}

/// Manager can burn coins
public fun burn(treasury_cap: &mut TreasuryCap<STRD>, coin: Coin<STRD>) {
    coin::burn(treasury_cap, coin);
}

/// Faucet shared object
public struct Faucet has key {
    id: UID,
    treasury_cap: TreasuryCap<STRD>,
    amount: u64,
}

/// Create and share a faucet
public fun share_faucet(treasury_cap: TreasuryCap<STRD>, amount: u64, ctx: &mut TxContext) {
    let faucet = Faucet {
        id: object::new(ctx),
        treasury_cap,
        amount,
    };
    transfer::share_object(faucet);
}

/// Anyone can claim tokens from the faucet
public fun claim_bonus(faucet: &mut Faucet, ctx: &mut TxContext) {
    let amount = faucet.amount;
    coin::mint_and_transfer(&mut faucet.treasury_cap, amount, ctx.sender(), ctx);
}
