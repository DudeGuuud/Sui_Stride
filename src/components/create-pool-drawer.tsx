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
const ADMIN_CAP = process.env.NEXT_PUBLIC_SUI_ADMIN_CAP || "";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !user) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find STRD coins
      const coins = await suiClient.listCoins({
        owner: user.address,
        coinType: `${PACKAGE_ID}::strd::STRD`
      });

      if (coins.objects.length === 0) {
        throw new Error("You don't have any STRD coins. Get some from the faucet first!");
      }

      const tx = new Transaction();
      // Convert stakeAmount to MIST (1e9)
      const mistAmount = Math.floor(Number(stakeAmount) * 1e9);
      // Convert hrs to seconds
      const durationSecs = Math.floor(Number(duration || 0) * 3600);

      const [payment] = tx.splitCoins(tx.object(coins.objects[0].objectId), [mistAmount]);

      tx.moveCall({
        target: `${PACKAGE_ID}::core::create_pool`,
        arguments: [
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
      // Reset form
      setTitle("");
      setStakeAmount("");
      setTargetDistance("");
      setDuration("");
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
                Stake Amount (SUI)
              </label>
              <div className="relative">
                <Input
                  placeholder="0.00"
                  inputMode="numeric"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-card border-none h-12 text-foreground pl-10 rounded-2xl"
                />
                <Coins size={18} className="absolute left-3 top-3 text-primary" />
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
