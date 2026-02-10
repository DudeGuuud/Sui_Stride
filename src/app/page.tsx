"use client";


import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Footprints, MapPin, Play, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { enokiFlow } from "@/lib/enoki";
import { getZkLoginSignature } from "@mysten/sui/zklogin";
import { fromBase64 } from "@mysten/sui/utils";

const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "";
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });

export default function HomeDashboard() {
  const { user, isConnected, userDataId, refreshUserData } = useAuth();
  const dAppKit = useDAppKit();
  const [isRegistering, setIsRegistering] = useState(false);
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    if (user?.address) {
      suiClient.getBalance({ owner: user.address }).then((b) => {
        setBalance((Number(b.balance.balance) / 1e9).toFixed(2));
      });
    }
  }, [user?.address]);

  const handleRegister = async () => {
    if (!isConnected || !user) return;
    setIsRegistering(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::core::create_user`,
        arguments: [
          tx.pure.vector('u8', []), // Empty pubkey for now
        ],
      });

      let result;
      
      if (user.label === 'Google User') {
        console.log("Processing zkLogin transaction...");
        const session = await enokiFlow.getSession();
        if (!session) throw new Error("No Enoki session found");
        
        const keypair = await enokiFlow.getKeypair({ network: 'testnet' });
        tx.setSender(user.address);
        
        const { bytes, signature: userSignature } = await tx.sign({ 
          client: suiClient, 
          signer: keypair 
        });
        
        const proof = await enokiFlow.getProof({ network: 'testnet' });
        if (!proof) throw new Error("Failed to get zkLogin proof");

        const zkSignature = getZkLoginSignature({
          inputs: {
            ...proof,
            addressSeed: proof.addressSeed 
          },
          maxEpoch: session.maxEpoch,
          userSignature,
        });
        
        result = await suiClient.executeTransaction({
          transaction: fromBase64(bytes),
          signatures: [zkSignature],
          include: { effects: true }
        });
      } else {
        result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      }

      console.log("Registration successful:", result);
      await refreshUserData();
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
        <div className="bg-card px-3 py-1.5 border border-border rounded-full flex items-center gap-2">
          <span className="text-foreground text-xs font-mono">
            {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "Disconnected"}
          </span>
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

      {/* Balance Card */}
      <Card className="bg-card border-none mb-6 overflow-hidden shadow-2xl shadow-primary/5 relative">
        <CardContent className="p-6 relative z-10">
          <span className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2 block">
            SUI Balance
          </span>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-foreground text-5xl font-bold tracking-tighter">
              {balance}
            </span>
            <span className="text-primary text-xl font-medium tracking-tight">
              SUI
            </span>
          </div>
          <div className="flex gap-2">
            {user?.label === 'Google User' && (
              <div className="bg-background/80 border border-border/50 px-2.5 py-1 rounded-lg">
                <span className="text-muted-foreground text-[10px] font-medium">
                  zkLogin active
                </span>
              </div>
            )}
            <div className="bg-background/80 border border-border/50 px-2.5 py-1 rounded-lg">
              <span className="text-muted-foreground text-[10px] font-medium">
                Sui Stride v1.0
              </span>
            </div>
          </div>
        </CardContent>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </Card>

      {/* Today's Activity */}
      <div className="mb-8">
        <h2 className="text-foreground text-2xl font-bold mb-5 tracking-tight">
          Today&apos;s Activity
        </h2>
        <Card className="bg-card border-none mb-5 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Footprints size={24} color="#00E5FF" />
                </div>
                <div>
                  <div className="text-foreground font-bold text-lg">
                    7,500{" "}
                    <span className="text-muted-foreground font-normal text-sm">
                      / 10,000 steps
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-primary font-black text-lg">75%</span>
            </div>
            <Progress value={75} className="h-2.5 bg-muted/30" />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Card className="flex-1 bg-card border-none shadow-sm">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <MapPin size={22} color="#7986CB" />
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-foreground text-3xl font-bold">5.2</span>
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
                <span className="text-foreground text-3xl font-bold">450</span>
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
      </div>

      {/* Start Running Button */}
      <Link href="/workout" className="w-full block mb-10">
        <Button className="w-full h-20 rounded-[28px] bg-primary flex items-center justify-center gap-4 shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Play size={28} className="text-[#0A0E12] fill-[#0A0E12]" />
          <span className="text-[#0A0E12] text-2xl font-black uppercase tracking-tight">
            Start Running
          </span>
        </Button>
      </Link>

      {/* Live Challenges */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-foreground text-xl font-bold">Live Challenges</h3>
          <Link href="/pools" className="text-primary text-sm font-medium hover:underline">
            View all
          </Link>
        </div>

        <Card className="bg-card border-none mb-4 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/20 shrink-0">
              <Trophy size={28} className="text-[#0A0E12]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-foreground font-bold text-base mb-0.5 truncate">
                Summer Sizzle 10k
              </h4>
              <p className="text-muted-foreground text-xs mb-2 truncate">
                Stake 50 SUI to win from pot
              </p>
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-card bg-muted overflow-hidden flex items-center justify-center text-[8px] font-bold text-muted-foreground"
                    >
                      ?
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground text-[10px]">
                  +420 others
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-secondary font-bold text-sm">2,500 SUI</span>
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
                Prize Pot
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none mb-4 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Flame size={28} color="#3B82F6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-foreground font-bold text-base mb-0.5 truncate">
                Morning Dash 2km
              </h4>
              <p className="text-muted-foreground text-xs mb-2 truncate">
                Daily stake-to-win
              </p>
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-2">
                  {[4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-card bg-muted overflow-hidden flex items-center justify-center text-[8px] font-bold text-muted-foreground"
                    >
                      ?
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground text-[10px]">
                  +128 others
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-blue-500 font-bold text-sm">800 SUI</span>
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
                Prize Pot
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}