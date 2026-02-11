"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Coins } from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { enokiFlow } from "@/lib/enoki";
import { fromBase64 } from "@mysten/sui/utils";
import { SuiGrpcClient } from "@mysten/sui/grpc";

const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID!;
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });

interface Participant {
    user_id: string;
    steps: string;
    amount: string;
}

interface ClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    pool: any;
    userAddress: string;
    onSuccess: () => void;
}

export function ClaimModal({ isOpen, onClose, pool, userAddress, onSuccess }: ClaimModalProps) {
    const dAppKit = useDAppKit();
    // enokiFlow is imported as singleton

    const [isClaiming, setIsClaiming] = useState(false);
    const [winners, setWinners] = useState<Participant[]>([]);
    const [myReward, setMyReward] = useState<string>("0");
    const [isWinner, setIsWinner] = useState(false);

    useEffect(() => {
        if (pool) {
            calculateRewards();
        }
    }, [pool]);

    const calculateRewards = () => {
        // Determine participants source
        const rawParticipants = pool?.jsonFields?.participants || pool?.participants || [];

        // If rawParticipants is a number (length), we can't do anything 
        if (typeof rawParticipants === 'number') return;

        const participantsData = Array.isArray(rawParticipants) ? rawParticipants : [];

        const participants: Participant[] = participantsData.map((p: any) => ({
            user_id: p.user_id || p.fields?.user_id,
            steps: String(p.steps || p.fields?.steps || "0"),
            amount: String(p.amount || p.fields?.amount || "0")
        }));

        // Sort by steps descending
        participants.sort((a, b) => Number(b.steps) - Number(a.steps));

        const total = participants.length;
        const winnerCount = total > 1 ? Math.floor(total / 2) : 1;
        const winningSlice = participants.slice(0, winnerCount);

        setWinners(winningSlice);

        const isInWinners = winningSlice.some(p => p.user_id === userAddress);
        setIsWinner(isInWinners);

        const potStr = pool.pool || "0";
        const pot = Number(potStr.split(" ")[0]) * 1e9; // Convert back to MIST
        const netPot = pot * 0.96;
        const rewardPerWinner = winnerCount > 0 ? netPot / winnerCount : 0;

        if (isInWinners) {
            setMyReward((rewardPerWinner / 1e9).toFixed(2));
        } else {
            setMyReward("0");
        }
    };

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            const tx = new Transaction();
            tx.setGasBudget(10000000);

            tx.moveCall({
                target: `${PACKAGE_ID}::core::distribute_rewards`,
                typeArguments: [pool.coinType],
                arguments: [
                    tx.object(pool.id),
                    tx.object('0x6'), // Clock
                ],
            });

            let result;
            const enokiSession = await enokiFlow.getSession();

            if (enokiSession) {
                const keypair = await enokiFlow.getKeypair({ network: 'testnet' });
                tx.setSender(userAddress);
                const { bytes, signature: zkSignature } = await tx.sign({
                    client: suiClient,
                    signer: keypair
                });
                result = await suiClient.executeTransaction({
                    transaction: typeof bytes === 'string' ? fromBase64(bytes) : bytes,
                    signatures: [zkSignature],
                    include: { effects: true }
                });
            } else {
                result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
            }

            console.log("Claim success:", result);
            onSuccess();
            onClose();
        } catch (e) {
            console.error("Claim failed:", e);
            alert("Failed to distribute rewards. See console.");
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-none text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        Pool Results
                    </DialogTitle>
                    <DialogDescription>
                        {pool?.title} has ended. Check if you won!
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mb-6">
                        <div className="text-sm font-medium text-muted-foreground">My Reward</div>
                        <div className="text-2xl font-bold text-primary flex items-center gap-2">
                            <Coins size={20} />
                            {myReward} {pool?.coinType?.includes("SUI") ? "SUI" : "STRD"}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Winners</h4>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                            {winners.map((winner, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${winner.user_id === userAddress ? "bg-primary/20 border border-primary/50" : "bg-card hover:bg-muted"}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium truncate w-[120px]">
                                                {winner.user_id.slice(0, 6)}...{winner.user_id.slice(-4)}
                                                {winner.user_id === userAddress && " (You)"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{winner.steps} steps</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-400">
                                        +{(Number(myReward) > 0 && winner.user_id === userAddress ? myReward : (Number(pool?.pool?.split(" ")[0] || 0) * 0.96 / winners.length).toFixed(2))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    {isWinner && !pool?.isFinalized && (
                        <Button
                            onClick={handleClaim}
                            disabled={isClaiming}
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
                        >
                            {isClaiming ? <Loader2 className="animate-spin mr-2" /> : <Coins className="mr-2" size={18} />}
                            Distribute Rewards
                        </Button>
                    )}
                    {pool?.isFinalized && (
                        <Button disabled className="bg-muted text-muted-foreground">
                            Rewards Distributed
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
