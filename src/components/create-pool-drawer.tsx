"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Target, Calendar, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { useAuth } from "@/context/auth";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { enokiFlow } from "@/lib/enoki";
import { fromBase64 } from "@mysten/sui/utils";

const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "";
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });

interface CreatePoolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const drawerVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { y: "100%", opacity: 0, transition: { ease: "easeInOut", duration: 0.3 } },
} as const;

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export default function CreatePoolDrawer({ isOpen, onClose }: CreatePoolDrawerProps) {
  const { user, isConnected, refreshSession } = useAuth();
  const dAppKit = useDAppKit();

  const [title, setTitle] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [targetDistance, setTargetDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [coinType, setCoinType] = useState<"SUI" | "STRD">("STRD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STRD_TYPE = `${PACKAGE_ID}::strd::STRD`;
  const SUI_TYPE = `0x2::sui::SUI`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !user) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTitle = title.trim() || "SuiStride Challenge";
      const finalDuration = duration.trim() || "24";
      const finalStakeAmount = stakeAmount.trim() || "1";

      const tx = new Transaction();
      const mistAmount = Math.floor(Number(finalStakeAmount) * 1e9);
      if (mistAmount <= 0) throw new Error("Stake amount must be greater than 0");

      const durationSecs = Math.floor(Number(finalDuration) * 3600);
      if (durationSecs <= 0) throw new Error("Duration must be at least 1 hour");

      const selectedCoinType = coinType === "SUI" ? SUI_TYPE : STRD_TYPE;

      let payment;
      if (coinType === "SUI") {
        payment = tx.splitCoins(tx.gas, [mistAmount]);
      } else {
        const coins = await suiClient.listCoins({
          owner: user.address,
          coinType: STRD_TYPE
        });
        if (coins.objects.length === 0) {
          throw new Error("You don't have any STRD coins. Register to get some!");
        }
        payment = tx.splitCoins(tx.object(coins.objects[0].objectId), [mistAmount]);
      }

      tx.moveCall({
        target: `${PACKAGE_ID}::core::create_pool`,
        typeArguments: [selectedCoinType],
        arguments: [
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(finalTitle))),
          payment,
          tx.pure.u64(durationSecs),
          tx.object('0x6'), // Clock
        ],
      });

      let result;
      if (user.label === 'Google User') {
        await refreshSession();
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

      console.log("Pool launched successfully:", result);
      alert("Pool launched successfully!");
      onClose();
      // Force refresh as requested by user
      window.location.reload();
    } catch (err) {
      console.error("Failed to launch pool:", err);
      alert("Failed to launch pool. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onClick={onClose}
        />
      )}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[32px] z-[60] border-t border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        exit="exit"
        variants={drawerVariants}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.05}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 100 || velocity.y > 500) {
            onClose();
          }
        }}
      >
        {/* Handle Bar */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="px-6 pb-6 pt-2 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground">Create New Pool</h2>
            <button onClick={onClose} className="p-2 bg-muted/50 rounded-full">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                Challenge Title
              </label>
              <Input
                placeholder="e.g., Weekend 10k Run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-card border-none h-12 text-foreground rounded-2xl"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                Staking Asset
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setCoinType("SUI")}
                  className={`flex-1 h-12 rounded-2xl border-none font-bold transition-all ${coinType === "SUI" ? "bg-primary text-[#0A0E12]" : "bg-card text-muted-foreground hover:bg-card/80"}`}
                >
                  SUI
                </Button>
                <Button
                  type="button"
                  onClick={() => setCoinType("STRD")}
                  className={`flex-1 h-12 rounded-2xl border-none font-bold transition-all ${coinType === "STRD" ? "bg-secondary text-[#0A0E12]" : "bg-card text-muted-foreground hover:bg-card/80"}`}
                >
                  STRD
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                Stake Amount ({coinType})
              </label>
              <div className="relative">
                <Input
                  placeholder="0.00"
                  inputMode="numeric"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-card border-none h-12 text-foreground pl-10 rounded-2xl"
                />
                <Coins size={18} className={`absolute left-3 top-3 ${coinType === "SUI" ? "text-primary" : "text-secondary"}`} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Distance (km)
                </label>
                <div className="relative">
                  <Input
                    placeholder="5.0"
                    inputMode="numeric"
                    value={targetDistance}
                    onChange={(e) => setTargetDistance(e.target.value)}
                    className="bg-card border-none h-12 text-foreground pl-10 rounded-2xl"
                  />
                  <Target size={18} className="absolute left-3 top-3 text-secondary" />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Duration (hrs)
                </label>
                <div className="relative">
                  <Input
                    placeholder="24"
                    inputMode="numeric"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-card border-none h-12 text-foreground pl-10 rounded-2xl"
                  />
                  <Calendar size={18} className="absolute left-3 top-3 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 h-14 rounded-2xl bg-primary text-[#0A0E12] font-black text-lg uppercase tracking-tight shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Launching...</span>
                </div>
              ) : "Launch Pool"}
            </Button>
            <div className="h-4" /> {/* Spacer for bottom safe area */}
          </form>
        </div>
      </motion.div>
    </>
  );
}