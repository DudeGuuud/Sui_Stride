"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Camera,
  Clock,
  Flame,
  Gauge,
  Layers,
  Music,
  Pause,
  Play,
  Target,
  Wallet,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNativeLocation } from "@/hooks/use-native-location";
import { StrideSegmenter, computeMerkleRoot } from "@/lib/stride-logic";
import {
  ConnectButton,
  useDAppKit
} from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { useAuth } from "@/context/auth";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { enokiFlow } from "@/lib/enoki";
import { getZkLoginSignature } from "@mysten/sui/zklogin";
import { fromBase64 } from "@mysten/sui/utils";

// Blockchain configuration from environment variables
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0x0";
const PARTICIPANT_STORE_ID = process.env.NEXT_PUBLIC_SUI_PARTICIPANT_STORE_ID || "0x0";
const STRIDE_MODULE = "core";
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });

// Dynamically import Map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-card animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground text-xs uppercase tracking-widest">
        Loading Map...
      </span>
    </div>
  ),
});

export default function WorkoutTrackingPage() {
  const { user, isConnected, userDataId } = useAuth();
  const dAppKit = useDAppKit();

  const [isTracking, setIsTracking] = useState(false);
  const { location, path, relativePoints, distance, steps, errorMsg } = useNativeLocation(isTracking);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recenterTrigger, setRecenterTrigger] = useState(0); // Trigger for map re-centering
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Anti-cheat tracking
  const segmenterRef = useRef<StrideSegmenter>(new StrideSegmenter("SESSION_NONCE_PLACEHOLDER"));
  const lastSegmentStepsRef = useRef(0);
  const hasLocatedRef = useRef(false);

  // Derived state for calories: ~1 kcal per kg per km (approximate for running)
  const weightKg = 70; // User weight
  const calories = (distance / 1000) * weightKg * 1.036;

  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && hasLocatedRef.current) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // Handle segmenting as points come in
  useEffect(() => {
    if (location && !hasLocatedRef.current) {
      hasLocatedRef.current = true;
      setRecenterTrigger(prev => prev + 1);
    }

    if (location && isTracking && hasLocatedRef.current && relativePoints.length > 0) {
      const relPoint = relativePoints[relativePoints.length - 1];
      const incrementalSteps = steps - lastSegmentStepsRef.current;
      const mockAccVar = 0.8;
      segmenterRef.current.addPoint(relPoint, incrementalSteps, mockAccVar);
      lastSegmentStepsRef.current = steps;
    }
  }, [location, isTracking, steps, relativePoints]);

  const handleStartWorkout = async () => {
    if (!isConnected || !userDataId || !user) {
      alert("Please connect wallet and register profile first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Start session on-chain
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${STRIDE_MODULE}::start_run`,
        arguments: [
          tx.object(PARTICIPANT_STORE_ID), // The Pool ID
          tx.object('0x6'), // Clock
        ],
      });

      let result;
      if (user.label === 'Google User') {
        const session = await enokiFlow.getSession();
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

      // Find the Session object ID in created objects from effects
      let sessionId: string | undefined;
      if (result.$kind === 'Transaction') {
        sessionId = (result.Transaction.effects?.changedObjects || []).find(
          (obj) => obj.inputState === 'DoesNotExist'
        )?.objectId;
      }

      if (!sessionId) {
        throw new Error("Failed to create session on-chain.");
      }

      setSessionId(sessionId);
      setIsTracking(true);
      console.log("Session started:", sessionId);
    } catch (e) {
      console.error("Failed to start run:", e);
      alert("Failed to start run on-chain. Check if you joined the pool.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndWorkout = async () => {
    if (!isConnected || !userDataId || !sessionId || !user) {
      alert("Incomplete session data.");
      return;
    }

    setIsTracking(false);
    setIsSubmitting(true);

    try {
      const segments = segmenterRef.current.getSegments();
      const root = await computeMerkleRoot(segments);

      console.log("Workout Ended. Segments:", segments.length, "Root:", root);

      if (PACKAGE_ID === "0x0" || !PACKAGE_ID) {
        console.warn("Contract not deployed. Skipping Sui transaction.");
        router.back();
        return;
      }

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::${STRIDE_MODULE}::submit_run_with_proof`,
        arguments: [
          tx.object(PARTICIPANT_STORE_ID),
          tx.object(userDataId),
          tx.object(sessionId),
          tx.pure.u64(steps),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(root))), // Merkle root bytes
          tx.pure.vector('u8', []), // Placeholder signature
          tx.object('0x6'), // Clock
        ],
      });

      let result;
      if (user && user.label === 'Google User') {
        const session = await enokiFlow.getSession();
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

      console.log("Transaction successful:", result);
      const digest = result.$kind === 'Transaction' ? result.Transaction.digest : 'Unknown';
      alert(`Workout Complete and Verified on Sui!\nDigest: ${digest}`);
      router.back();
    } catch (err) {
      console.error("Error ending workout:", err);
      alert(err instanceof Error ? err.message : "Failed to submit run to blockchain.");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatAvgPace = () => {
    if (distance === 0) return "0'00\"";
    const paceInSeconds = elapsedTime / (distance / 1000);
    const mins = Math.floor(paceInSeconds / 60);
    const secs = Math.floor(paceInSeconds % 60);
    return `${mins}'${secs.toString().padStart(2, "0")}"`;
  };

  const formatCurrentPace = () => {
    const speed = location?.speed || 0;
    if (speed < 0.1) return "-'--\"";

    const paceSecondsPerKm = 1000 / speed;
    const mins = Math.floor(paceSecondsPerKm / 60);
    const secs = Math.floor(paceSecondsPerKm % 60);

    if (mins > 30) return "-'--\"";
    return `${mins}'${secs.toString().padStart(2, "0")}"`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6 pb-20">
      {/* Header */}
      <header className="flex justify-between items-center py-2 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-secondary text-[10px] uppercase font-bold tracking-widest">
            (( )) SUI TESTNET
          </span>
        </div>
        <span className="text-foreground text-xs font-bold tracking-[4px] uppercase">
          SuiStride
        </span>
        <div className="flex items-center gap-2">
          {user?.label === 'Google User' ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-primary">Google User</span>
            </div>
          ) : (
            <ConnectButton />
          )}
        </div>
      </header>

      {/* Distance Info */}
      <div className="items-center mt-6 mb-8 flex flex-col">
        <span className="text-primary text-sm font-bold tracking-[3px] uppercase mb-1">
          Total Distance
        </span>
        <span className="text-foreground text-8xl font-black leading-none">
          {(distance / 1000).toFixed(2)}
        </span>
        <span className="text-muted-foreground text-xl font-medium mt-1">
          Kilometers
        </span>
      </div>

      {!isConnected && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 mb-8 flex flex-row items-center gap-4">
          <Wallet className="text-secondary" size={24} />
          <div>
            <p className="text-foreground text-sm font-bold">Wallet Disconnected</p>
            <p className="text-muted-foreground text-xs">Connect your Sui wallet to earn rewards.</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative w-full h-80 rounded-3xl bg-card border border-border overflow-hidden mb-8 shadow-lg shadow-black/20">
        <MapComponent location={location} path={path} recenterTrigger={recenterTrigger} />

        <div className="absolute right-4 bottom-4 gap-3 flex flex-col z-[400]">
          <button
            className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center border border-border hover:bg-background transition-colors active:scale-95"
            onClick={() => setRecenterTrigger(prev => prev + 1)}
          >
            <Target size={20} className="text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center border border-border hover:bg-background transition-colors">
            <Layers size={20} className="text-foreground" />
          </button>
        </div>

        {errorMsg && (
          <div className="absolute top-4 left-4 right-4 bg-destructive/90 p-2 rounded-lg z-[400]">
            <p className="text-destructive-foreground text-[10px] text-center font-bold">
              {errorMsg}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-card border-none shadow-none">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} color="#00E5FF" />
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Avg Pace
              </span>
            </div>
            <span className="text-foreground text-2xl font-bold">
              {formatAvgPace()}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-none">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} color="#00E5FF" />
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Duration
              </span>
            </div>
            <span className="text-foreground text-2xl font-bold">
              {formatTime(elapsedTime)}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-none">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={16} color="#00E5FF" />
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Calories
              </span>
            </div>
            <span className="text-foreground text-2xl font-bold">
              {calories.toFixed(0)}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-none">
          <CardContent className="p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={16} color="#00E5FF" />
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                Current Pace
              </span>
            </div>
            <span className="text-foreground text-2xl font-bold">
              {formatCurrentPace()}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center items-center gap-10 mb-10">
        <button
          className="w-14 h-14 rounded-full bg-card flex items-center justify-center border border-border hover:bg-card/80 transition-colors shadow-lg shadow-black/20 active:scale-95"
          onClick={() => {
            if (!sessionId) {
              handleStartWorkout();
            } else {
              setIsTracking(!isTracking);
            }
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin text-primary" size={24} />
          ) : isTracking ? (
            <Pause size={24} className="text-foreground" />
          ) : (
            <Play size={24} className="text-foreground" />
          )}
        </button>
        <button className="w-14 h-14 rounded-full bg-card flex items-center justify-center border border-border hover:bg-card/80 transition-colors shadow-lg shadow-black/20 active:scale-95">
          <Camera size={24} className="text-foreground" />
        </button>
        <button className="w-14 h-14 rounded-full bg-card flex items-center justify-center border border-border hover:bg-card/80 transition-colors shadow-lg shadow-black/20 active:scale-95">
          <Music size={24} className="text-foreground" />
        </button>
      </div>

      {/* End Workout Button */}
      <Button
        variant="outline"
        className="h-16 w-full rounded-2xl border-2 border-primary/20 bg-background/20 mb-10 hover:bg-primary/10 transition-colors disabled:opacity-50"
        onClick={handleEndWorkout}
        disabled={isSubmitting}
      >
        <span className="text-foreground text-lg font-bold">
          {isSubmitting ? "Submitting to Sui..." : "End Workout"}
        </span>
      </Button>
    </div>
  );
}