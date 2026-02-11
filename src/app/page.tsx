"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Footprints, MapPin, Play, Trophy, UserPlus, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
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

interface ActivePool {
  id: string;
  title: string;
  coinType: string;
  mySteps: number;
  myCalories: number;
  myDistanceKm: string;
  createdAt: number;
}

export default function HomeDashboard() {
  const { user, isConnected, userDataId, refreshUserData } = useAuth();
  const dAppKit = useDAppKit();
  const [isRegistering, setIsRegistering] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [strdBalance, setStrdBalance] = useState("0.00");
  const [isCopied, setIsCopied] = useState(false);

  // Active Pool State
  const [activePool, setActivePool] = useState<ActivePool | null>(null);

  // Fallback if no pool is active
  const DEFAULT_TARGET_STEPS = 10000;

  const handleCopyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const fetchActivePool = useCallback(async () => {
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
        console.error("GraphQL Query Error:", result.errors);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;
      const allNodes: PoolNode[] = [
        ...(data?.suiPools?.nodes || []),
        ...(data?.strdPools?.nodes || [])
      ];

      // Filter for joined & active pools
      const joinedActivePools = allNodes.map((node) => {
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
        const coinType = fullType.match(/<(.+)>$/)?.[1] || "";

        const createdAt = Number(fields.created_at || 0);
        const durationSecs = Number(fields.duration_secs || 0);

        // Check if active
        let isEnded = false;
        if (createdAt > 0 && durationSecs > 0) {
          const durationMs = durationSecs * 1000;
          const endTime = createdAt + durationMs;
          if (Date.now() > endTime) isEnded = true;
        }
        if (fields.finalized) isEnded = true;

        // Check if joined
        const participants = fields.participants || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userParticipant = Array.isArray(participants) ? participants.find((p: any) => {
          const pAddr = p.user_id || p.fields?.user_id || p;
          return pAddr === user?.address;
        }) : null;

        if (!userParticipant || isEnded) return null;

        const steps = Number(userParticipant.steps || userParticipant.fields?.steps || 0);

        return {
          id: node.address,
          title: poolName,
          coinType,
          mySteps: steps,
          // Approximate calories: 0.045 kcal per step (very rough avg)
          myCalories: Math.floor(steps * 0.045),
          myDistanceKm: (steps * 0.000762).toFixed(2), // ~0.762m per step
          createdAt
        } as ActivePool;
      }).filter((pool): pool is ActivePool => pool !== null);

      // Pick the most recent one
      joinedActivePools.sort((a, b) => b.createdAt - a.createdAt);

      if (joinedActivePools.length > 0) {
        setActivePool(joinedActivePools[0]);
      } else {
        setActivePool(null);
      }
    } catch (e) {
      console.error("Error fetching active pool:", e);
    }
  }, [user?.address]);

  useEffect(() => {
    if (user?.address) {
      suiClient.getBalance({ owner: user.address }).then((b) => {
        setBalance((Number(b.balance.balance) / 1e9).toFixed(2));
      });
      // Fetch STRD balance
      suiClient.listCoins({
        owner: user.address,
        coinType: `${PACKAGE_ID}::strd::STRD`
      }).then((coins) => {
        const total = coins.objects.reduce((acc, coin) => acc + Number(coin.balance), 0);
        setStrdBalance((total / 1e9).toFixed(2));
      });

      if (PACKAGE_ID) fetchActivePool();
    }
  }, [user?.address, fetchActivePool]);

  const FAUCET_ID = process.env.NEXT_PUBLIC_SUI_FAUCET_ID || "";

  const handleRegister = async () => {
    if (!isConnected || !user) return;
    setIsRegistering(true);
    try {
      const tx = new Transaction();

      // 1. Create User
      tx.moveCall({
        target: `${PACKAGE_ID}::core::create_user`,
        arguments: [
          tx.pure.vector('u8', []),
        ],
      });

      // 2. Claim Welcome Bonus
      if (FAUCET_ID) {
        tx.moveCall({
          target: `${PACKAGE_ID}::strd::claim_bonus`,
          arguments: [
            tx.object(FAUCET_ID),
          ],
        });
      }

      let result;

      if (user.label === 'Google User') {
        console.log("Processing zkLogin transaction...");
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

      console.log("Registration successful:", result);
      await refreshUserData();
      // Force refresh to update balances as requested
      window.location.reload();
    } catch (e) {
      console.error("Registration failed:", e);
      alert("Registration failed. See console for details.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center overflow-hidden border border-border">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg leading-tight">SuiStride</h1>
            <span className="text-secondary text-xs font-medium uppercase">Testnet</span>
          </div>
        </div>
        <div 
          className="bg-card px-3 py-1.5 border border-border rounded-full flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          onClick={handleCopyAddress}
        >
          <span className="text-foreground text-xs font-mono">
            {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "Disconnected"}
          </span>
          {isCopied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} className="text-muted-foreground" />
          )}
          <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
            <div className="w-full h-full bg-gradient-to-tr from-primary to-secondary" />
          </div>
        </div>
      </div>

      {/* Registration Check */}
      {isConnected && !userDataId && (
        <Card className="bg-primary/10 border-2 border-primary/20 mb-6 overflow-hidden shadow-lg shadow-primary/5">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <UserPlus size={32} className="text-primary" />
            </div>
            <h2 className="text-foreground text-xl font-bold mb-2">Create Your Profile</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-[280px]">
              You haven&apos;t registered your SuiStride profile yet. Create it now to start tracking your runs on-chain.
            </p>
            <Button
              className="w-full h-12 rounded-xl bg-primary text-[#0A0E12] font-black uppercase tracking-tight"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? "Registering..." : "Register Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-none overflow-hidden shadow-xl shadow-primary/5 relative">
          <CardContent className="p-4 relative z-10">
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1 block">
              SUI Balance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-foreground text-3xl font-bold tracking-tighter">
                {balance}
              </span>
              <span className="text-primary text-xs font-medium uppercase tracking-tight">
                SUI
              </span>
            </div>
          </CardContent>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        </Card>

        <Card className="bg-card border-none overflow-hidden shadow-xl shadow-secondary/5 relative">
          <CardContent className="p-4 relative z-10">
            <span className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-1 block">
              STRD Balance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-foreground text-3xl font-bold tracking-tighter">
                {strdBalance}
              </span>
              <span className="text-secondary text-xs font-medium uppercase tracking-tight">
                STRD
              </span>
            </div>
          </CardContent>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl" />
        </Card>
      </div>

      {/* Active Challenge / Today's Activity */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-foreground text-2xl font-bold tracking-tight">
            My Active Challenge
          </h2>
          {activePool && (
            <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-md">
              LIVE
            </span>
          )}
        </div>

        {userDataId ? (
          activePool ? (
            <>
              <Card className="bg-card border-none mb-5 shadow-sm border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{activePool.title}</h3>
                      <p className="text-muted-foreground text-xs">Target: 10,000 Steps</p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Trophy size={20} className="text-primary" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg">
                        <Footprints size={20} className="text-foreground" />
                      </div>
                      <div>
                        <div className="text-foreground font-bold text-xl">
                          {activePool.mySteps.toLocaleString()}
                          <span className="text-muted-foreground font-medium text-sm ml-1">
                            steps
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-primary font-black text-lg">
                      {Math.min(Math.floor((activePool.mySteps / DEFAULT_TARGET_STEPS) * 100), 100)}%
                    </span>
                  </div>
                  <Progress value={(activePool.mySteps / DEFAULT_TARGET_STEPS) * 100} className="h-2.5 bg-muted/50" />
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Card className="flex-1 bg-card border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                      <MapPin size={22} color="#7986CB" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-foreground text-3xl font-bold">{activePool.myDistanceKm}</span>
                      <span className="text-muted-foreground text-sm font-medium">
                        km
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[10px] uppercase font-black tracking-[1.5px] opacity-70">
                      Distance
                    </span>
                  </CardContent>
                </Card>
                <Card className="flex-1 bg-card border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                      <Flame size={22} color="#FF8A65" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-foreground text-3xl font-bold">{activePool.myCalories}</span>
                      <span className="text-muted-foreground text-sm font-medium">
                        kcal
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[10px] uppercase font-black tracking-[1.5px] opacity-70">
                      Calories
                    </span>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="bg-card border-none mb-5 shadow-sm border-dashed border-2 border-muted">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Footprints size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No Active Challenges</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Join a pool to start tracking your progress and earning rewards!
                </p>
                <Link href="/pools" className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    Browse Pools <ArrowRight size={16} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>Register profile to see activity.</p>
          </div>
        )}
      </div>

      {/* Start Running Button */}
      {userDataId && activePool ? (
        <Link href={`/workout?pool=${activePool.id}&type=${activePool.coinType}`} className="w-full block mb-10">
          <Button className="w-full h-20 rounded-[28px] bg-primary flex items-center justify-center gap-4 shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-[0.98]">
            <Play size={28} className="text-[#0A0E12] fill-[#0A0E12]" />
            <span className="text-[#0A0E12] text-2xl font-black uppercase tracking-tight">
              Run for {activePool.title.length > 15 ? activePool.title.slice(0, 15) + "..." : activePool.title}
            </span>
          </Button>
        </Link>
      ) : activePool === null && userDataId ? (
        <Link href="/pools" className="w-full block mb-10">
          <Button className="w-full h-20 rounded-[28px] bg-secondary flex items-center justify-center gap-4 shadow-2xl shadow-secondary/40 hover:bg-secondary/90 transition-all active:scale-[0.98]">
            <Trophy size={28} className="text-[#0A0E12]" />
            <span className="text-[#0A0E12] text-2xl font-black uppercase tracking-tight">
              Join a Challenge
            </span>
          </Button>
        </Link>
      ) : (
        <Button disabled className="w-full h-20 rounded-[28px] bg-muted mb-10 flex items-center justify-center gap-4">
          <span className="text-muted-foreground text-xl font-bold">Register to Run</span>
        </Button>
      )}

    </div>
  );
}