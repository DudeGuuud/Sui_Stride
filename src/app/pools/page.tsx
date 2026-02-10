"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, HelpCircle, Coins, Users, Clock, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CreatePoolDrawer from "@/components/create-pool-drawer";
import { AnimatePresence } from "framer-motion";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { useAuth } from "@/context/auth";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "";
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const suiClient = new SuiJsonRpcClient({ url: RPC_URL, network: 'testnet' });

export default function PoolsPage() {
  const router = useRouter();
  const { user, isConnected, userDataId } = useAuth();
  const dAppKit = useDAppKit();

  const [activeTab, setActiveTab] = useState("Global");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [pools, setPools] = useState<{ id: string; title: string; pool: string; participants: number; timeLeft: string; image: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaking, setIsStaking] = useState<string | null>(null);

  const fetchPools = async () => {
    setIsLoading(true);
    try {
      // Use call as a fallback for missing queryObjects in this SDK version
      const sharedObjects = await suiClient.call('suix_queryObjects', [{
        filter: { StructType: `${PACKAGE_ID}::core::StakingPool` },
        options: { showContent: true, showOwner: true }
      }]) as { data: { objectId: string; content?: { dataType: string; fields: Record<string, unknown> } }[] };

      const mappedPools = sharedObjects.data.map((obj) => {
        if (obj.content?.dataType === 'moveObject') {
            const fields = obj.content.fields;
            return {
              id: obj.objectId,
              title: "SuiStride Sprint", 
              pool: (Number(fields.strd_treasury) / 1e9).toFixed(0) + " STRD",
              participants: (fields.participants as unknown[])?.length || 0,
              timeLeft: "Active",
              image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop",
            };
        }
        return null;
      }).filter((p): p is NonNullable<typeof p> => p !== null);
      
      setPools(mappedPools);
    } catch (e) {
      console.error("Error fetching pools:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (PACKAGE_ID) fetchPools();
  }, []);

  const handleJoin = async (poolId: string) => {
    if (!isConnected || !user) {
        alert("Please connect your wallet first.");
        return;
    }
    if (!userDataId) {
        alert("Please register your profile on the dashboard first.");
        return;
    }

    setIsStaking(poolId);
    try {
      // Find STRD coins
      const coins = await suiClient.getCoins({
        owner: user.address,
        coinType: `${PACKAGE_ID}::strd::STRD`
      });

      if (coins.data.length === 0) {
        throw new Error("You don't have any STRD coins to stake. Get some from the faucet first!");
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::core::stake`,
        arguments: [
          tx.object(poolId),
          tx.object(userDataId),
          tx.object(coins.data[0].coinObjectId),
          tx.object('0x6'), // Clock
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      console.log("Staked successfully:", result);
      alert("Successfully joined the pool!");
      fetchPools();
    } catch (e) {
      console.error("Staking failed:", e);
      alert(e instanceof Error ? e.message : "Staking failed.");
    } finally {
      setIsStaking(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24 relative">
      {/* Header */}
      <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-card hover:bg-card/80 transition-colors"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <span className="text-foreground text-lg font-bold">Stake-to-Win</span>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-card hover:bg-card/80 transition-colors">
          <HelpCircle size={24} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-4">
        <div className="mt-2 mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <h1 className="text-primary text-4xl font-bold">Active</h1>
            <span className="text-muted-foreground text-2xl font-medium">Pools</span>
          </div>

          {/* Segmented Control */}
          <div className="flex bg-card p-1 rounded-xl mb-6">
            {["Global", "Friends"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2.5 flex items-center justify-center rounded-lg transition-all text-sm font-semibold",
                  activeTab === tab
                    ? "bg-muted shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Challenge Cards */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-muted-foreground text-sm">Loading on-chain pools...</p>
            </div>
          ) : activeTab === "Global" ? (
            pools.length > 0 ? (
                pools.map((pool) => (
                    <Card key={pool.id} className="bg-card border-none mb-6 overflow-hidden shadow-lg shadow-black/20">
                      <div className="relative h-48 w-full">
                        <Image
                          src={pool.image}
                          alt={pool.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm bg-secondary text-secondary-foreground">
                            LIVE NOW
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
      
                      <CardContent className="p-5">
                        <div className="flex justify-between items-end gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-foreground text-xl font-bold mb-2 truncate">{pool.title}</h3>
                            <div className="flex items-center gap-1.5 mb-3">
                              <Coins size={16} color="#00E5FF" />
                              <span className="text-primary font-bold">Pot: {pool.pool}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Users size={14} className="text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">{pool.participants} Participants</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-muted-foreground" />
                                <span className="text-muted-foreground text-xs">{pool.timeLeft}</span>
                              </div>
                            </div>
                          </div>
      
                          <Button 
                            className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shrink-0"
                            onClick={() => handleJoin(pool.id)}
                            disabled={isStaking === pool.id}
                          >
                            <span className="text-[#0A0E12] font-bold">
                                {isStaking === pool.id ? "JOINING..." : "JOIN"}
                            </span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    No pools found on-chain. Create one!
                </div>
            )
          ) : (
            <div className="flex flex-col gap-6 items-center justify-center py-10 text-muted-foreground">
                <p>No active friend challenges.</p>
                <Button variant="outline">Invite Friends</Button>
            </div>
          )}
        </div>
      </div>

      {/* FAB - Create Pool */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={() => setIsCreateDrawerOpen(true)}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_8px_30px_rgb(0,229,255,0.4)] pointer-events-auto hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={32} className="text-[#0A0E12]" strokeWidth={3} />
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isCreateDrawerOpen && (
          <CreatePoolDrawer 
            isOpen={isCreateDrawerOpen} 
            onClose={() => setIsCreateDrawerOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}