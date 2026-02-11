"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, HelpCircle, Coins, Users, Clock, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CreatePoolDrawer from "@/components/create-pool-drawer";
import { ClaimModal } from "@/components/claim-modal";
import { AnimatePresence } from "framer-motion";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { useAuth } from "@/context/auth";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { enokiFlow } from "@/lib/enoki";
import { fromBase64 } from "@mysten/sui/utils";

const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "";
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL || 'https://graphql.testnet.sui.io/graphql';

const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });
const graphqlClient = new SuiGraphQLClient({ url: GRAPHQL_URL, network: 'testnet' });

interface PoolFields {
  name?: string | { bytes: string };
  created_at?: string;
  duration_secs?: string;
  strd_treasury?: string;
  finalized?: boolean;
  participants?: Array<{
    user_id?: string;
    steps?: string;
    fields?: {
      user_id?: string;
      steps?: string;
    };
  }>;
}

interface PoolNode {
  address: string;
  asMoveObject: {
    contents: {
      type: {
        repr: string;
      };
      json: PoolFields;
    };
  };
}

interface PoolData {
  id: string;
  title: string;
  pool: string;
  participants: number;
  timeLeft: string;
  image: string;
  coinType: string;
  isEnded: boolean;
  isJoined: boolean;
  isFinalized: boolean;
  createdAtRaw: number;
  jsonFields: PoolFields;
}

export default function PoolsPage() {
  const router = useRouter();
  const { user, isConnected, userDataId } = useAuth();
  const dAppKit = useDAppKit();

  const [activeTab, setActiveTab] = useState("Global");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaking, setIsStaking] = useState<string | null>(null);
  const [selectedClaimPool, setSelectedClaimPool] = useState<PoolData | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await graphqlClient.query({
        query: `
          query QueryPools($suiPoolType: String!, $strdPoolType: String!) {
            suiPools: objects(filter: { type: $suiPoolType }) {
              nodes {
                address
                asMoveObject {
                  contents {
                    type {
                      repr
                    }
                    json
                  }
                }
              }
            }
            strdPools: objects(filter: { type: $strdPoolType }) {
              nodes {
                address
                asMoveObject {
                  contents {
                    type {
                      repr
                    }
                    json
                  }
                }
              }
            }
          }
        `,
        variables: {
          suiPoolType: `${PACKAGE_ID}::core::StakingPool<0x2::sui::SUI>`,
          strdPoolType: `${PACKAGE_ID}::core::StakingPool<${PACKAGE_ID}::strd::STRD>`
        }
      });

      if (result.errors) {
        console.error("GraphQL Query Error:", result.errors[0]?.message || "Unknown error");
        setPools([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;
      const allNodes: PoolNode[] = [
        ...(data?.suiPools?.nodes || []),
        ...(data?.strdPools?.nodes || [])
      ];

      const mappedPools = allNodes.map((node) => {
        const moveObj = node.asMoveObject;
        const fields = moveObj?.contents?.json;
        const fullType = moveObj?.contents?.type?.repr;
        if (!fields || !fullType) return null;

        // Helper to extract string from Move String struct if needed
        const extractStr = (val: string | { bytes: string } | undefined) => {
          if (typeof val === 'string') return val;
          if (val && typeof val === 'object' && val.bytes) return val.bytes;
          return String(val || "");
        };

        const poolName = extractStr(fields.name) || ("SuiStride Challenge");

        // Extract coin type from StakingPool<T>
        const coinType = fullType.match(/<(.+)>$/)?.[1] || "";
        const isSuiPool = coinType === "0x2::sui::SUI";
        const symbol = isSuiPool ? "SUI" : "STRD";

        const createdAt = Number(fields.created_at || 0);
        const durationSecs = Number(fields.duration_secs || 0);

        let timeLeftStr = "Active";
        let isEnded = false;
        if (createdAt > 0 && durationSecs > 0) {
          const durationMs = durationSecs * 1000;
          const endTime = createdAt + durationMs;
          const now = Date.now();
          const diff = endTime - now;

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            timeLeftStr = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
          } else {
            timeLeftStr = "Ended";
            isEnded = true;
          }
        }

        const participants = fields.participants || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isJoined = Array.isArray(participants) && participants.some((p: any) => {
          const pAddr = p.user_id || p.fields?.user_id || p;
          return pAddr === user?.address;
        });

        return {
          id: node.address,
          title: poolName,
          pool: (Number(fields.strd_treasury || 0) / 1e9).toFixed(0) + " " + symbol,
          participants: participants.length,
          timeLeft: timeLeftStr,
          isEnded,
          isJoined,
          isFinalized: !!fields.finalized,
          coinType: coinType,
          createdAtRaw: createdAt,
          image: "",
          jsonFields: fields,
        } as PoolData;
      }).filter((p): p is PoolData => p !== null);

      // Sort by newest first
      mappedPools.sort((a, b) => b.createdAtRaw - a.createdAtRaw);

      setPools(mappedPools);
    } catch (e) {
      console.error("Error fetching pools:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.address]);

  useEffect(() => {
    if (PACKAGE_ID) fetchPools();
  }, [fetchPools]);

  const handleJoin = async (poolId: string) => {
    if (!isConnected || !user) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!userDataId) {
      alert("Please register your profile on the dashboard first.");
      return;
    }

    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;

    setIsStaking(poolId);
    try {
      const tx = new Transaction();
      // Join with 1.0 tokens by default instead of 10.0 to ensure new users with 10 tokens can join multiple pools
      const amount = 1 * 1e9;

      let payment;
      if (pool.coinType === "0x2::sui::SUI") {
        payment = tx.splitCoins(tx.gas, [amount]);
      } else {
        // Find STRD coins and merge if necessary
        const coins = await suiClient.listCoins({
          owner: user.address,
          coinType: pool.coinType
        });

        if (coins.objects.length === 0) {
          throw new Error(`You don't have any coins of type ${pool.coinType} to stake.`);
        }

        // Check total balance
        const total = coins.objects.reduce((acc, c) => acc + Number(c.balance), 0);
        if (total < amount) {
          throw new Error(`Insufficient ${pool.title} balance. You have ${(total / 1e9).toFixed(2)} tokens.`);
        }

        if (coins.objects.length > 1) {
          const [primary, ...rest] = coins.objects;
          tx.mergeCoins(tx.object(primary.objectId), rest.map(c => tx.object(c.objectId)));
          payment = tx.splitCoins(tx.object(primary.objectId), [amount]);
        } else {
          payment = tx.splitCoins(tx.object(coins.objects[0].objectId), [amount]);
        }
      }

      tx.moveCall({
        target: `${PACKAGE_ID}::core::stake`,
        typeArguments: [pool.coinType],
        arguments: [
          tx.object(poolId),
          tx.object(userDataId),
          payment,
          tx.object('0x6'), // Clock
        ],
      });

      let result;
      if (user.label === 'Google User') {
        const session = await enokiFlow.getSession();
        if (!session) throw new Error("No Enoki session found");
        
        const keypair = await enokiFlow.getKeypair({ network: 'testnet' });
        tx.setSender(user.address);

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

      console.log("Staked successfully:", result);
      alert("Successfully joined the pool!");
      // Force refresh as requested by user
      window.location.reload();
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
            {["Global", "Joined"].map((tab) => (
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
                {tab === "Joined" ? "My Pools" : tab}
              </button>
            ))}
          </div>

          {/* Challenge Cards */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary mb-4" size={40} />
              <p className="text-muted-foreground text-sm">Loading on-chain pools...</p>
            </div>
          ) : (
            (activeTab === "Global" ? pools : pools.filter((p) => p.isJoined)).length > 0 ? (
              (activeTab === "Global" ? pools : pools.filter((p) => p.isJoined)).map((pool) => (
                <Card key={pool.id} className="bg-card border-none mb-6 overflow-hidden shadow-lg shadow-black/20">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                        pool.isEnded ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"
                      )}>
                        {pool.timeLeft}
                      </span>
                    </div>
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
                            <span className="text-muted-foreground text-xs">{pool.coinType.includes("SUI") ? "SUI" : "STRD"}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          if (pool.isEnded && pool.isJoined) {
                            setSelectedClaimPool(pool);
                            setIsClaimModalOpen(true);
                          } else {
                            handleJoin(pool.id);
                          }
                        }}
                        disabled={isStaking === pool.id || (pool.isEnded && !pool.isJoined) || (pool.isJoined && !pool.isEnded)}
                        className={cn(
                          "h-10 px-6 rounded-xl font-bold transition-all shadow-lg",
                          pool.isEnded && !pool.isJoined
                            ? "bg-muted text-muted-foreground border-none cursor-not-allowed"
                            : pool.isJoined && !pool.isEnded
                              ? "bg-secondary text-secondary-foreground cursor-default"
                              : pool.isEnded && pool.isJoined
                                ? "bg-yellow-400 text-black shadow-yellow-400/20 hover:shadow-yellow-400/40 hover:scale-105 active:scale-95"
                                : "bg-primary text-[#0A0E12] shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
                        )}
                      >
                        {isStaking === pool.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : pool.isEnded ? (
                          pool.isJoined ? (pool.isFinalized ? "Claimed" : "Claim") : "Ended"
                        ) : pool.isJoined ? (
                          "Joined"
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                {activeTab === "Global" ? "No active pools found." : "You haven't joined any pools yet."}
              </div>
            )
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

      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        pool={selectedClaimPool}
        userAddress={user?.address || ""}
        onSuccess={() => {
          fetchPools();
          window.location.reload();
        }}
      />
    </div>
  );
}