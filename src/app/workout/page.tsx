"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
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
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNativeLocation } from "@/hooks/use-native-location";
import { StrideSegmenter, computeMerkleRoot } from "@/lib/stride-logic";
import {
  ConnectButton,
  useDAppKit
} from "@mysten/dapp-kit-react";
import { enokiFlow } from "@/lib/enoki";
import { Transaction } from "@mysten/sui/transactions";
import { useAuth } from "@/context/auth";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { fromBase64 } from "@mysten/sui/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Blockchain configuration from environment variables
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0x0";
const STRIDE_MODULE = "core";
const RPC_URL = process.env.NEXT_PUBLIC_SUI_TESTNET_URL || 'https://fullnode.testnet.sui.io:443';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL || 'https://graphql.testnet.sui.io/graphql';

// Use the full SuiClient for robust transaction queries
const suiClient = new SuiGrpcClient({ baseUrl: RPC_URL, network: 'testnet' });
const graphqlClient = new SuiGraphQLClient({ url: GRAPHQL_URL, network: 'testnet' });

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

interface PoolOption {
  id: string;
  title: string;
  coinType: string;
}

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

interface TxResultHelper {
  $kind?: string;
  Transaction?: {
    effects?: {
      created?: { reference: { objectId: string } }[];
    };
    digest?: string;
  };
  effects?: {
    created?: { reference: { objectId: string } }[];
  };
  objectChanges?: { type: string; objectId: string }[];
  digest?: string;
}

export default function WorkoutTrackingPage() {
  const { user, isConnected, userDataId } = useAuth();
  const dAppKit = useDAppKit();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Params or null
  const paramPoolId = searchParams.get('pool');
  const paramCoinType = searchParams.get('type');

  // Selected Pool State
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(paramPoolId);
  const [selectedCoinType, setSelectedCoinType] = useState<string | null>(paramCoinType);
  const [poolTitle, setPoolTitle] = useState<string>("Free Run");

  // Pool Selection UI State
  const [joinedPools, setJoinedPools] = useState<PoolOption[]>([]);
  const [showPoolSelector, setShowPoolSelector] = useState(false);
  const [isLoadingPools, setIsLoadingPools] = useState(false);

  // Tracking State
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

  const fetchPoolTitle = useCallback(async (id: string) => {
    try {
      const obj = await suiClient.getObject({
        objectId: id,
        include: { json: true }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((obj as any).object?.json) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = (obj as any).object.json as any;
        const name = fields.name;
        let title = "Challenge";
        if (typeof name === 'string') title = name;
        else if (name && typeof name === 'object' && name.bytes) title = new TextDecoder().decode(Uint8Array.from(name.bytes));
        
        setPoolTitle(title);
      }
    } catch (e) {
      console.error("Failed to fetch pool title", e);
    }
  }, []);

  const fetchJoinedPools = useCallback(async () => {
    setIsLoadingPools(true);
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

      const myPools = allNodes.map((node) => {
        const moveObj = node.asMoveObject;
        const fields = moveObj?.contents?.json;
        const fullType = moveObj?.contents?.type?.repr;
        if (!fields || !fullType) return null;

        // Helper to extract string
        const extractStr = (val: string | { bytes: string } | undefined) => {
          if (typeof val === 'string') return val;
          if (val && typeof val === 'object' && val.bytes) return val.bytes;
          return String(val || "");
        };

        const poolName = extractStr(fields.name) || ("SuiStride Challenge");
        const coinType = fullType.match(/<(.+)>$/)?.[1] || "";

        // Check if joined
        const participants = fields.participants || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isJoined = Array.isArray(participants) ? participants.some((p: any) => {
          const pAddr = p.user_id || p.fields?.user_id || p;
          return pAddr === user?.address;
        }) : false;

        // Check if ended
        const finalized = fields.finalized;

        if (!isJoined || finalized) return null;

        return {
          id: node.address,
          title: poolName,
          coinType
        } as PoolOption;
      }).filter((p): p is PoolOption => p !== null);

      setJoinedPools(myPools);
      if (myPools.length > 0) {
        setShowPoolSelector(true);
      } else {
        // No pools? Redirect or warn
        // For now, let them run "Free" (but submission will fail if we enforce pool)
        // Actually, if no pool, we can't submit to a pool.
        // We should probably just tell them to join a pool.
        alert("You haven't joined any active pools! Please join a pool first.");
        router.push('/pools');
      }

    } catch (e) {
      console.error("Error fetching pools:", e);
    } finally {
      setIsLoadingPools(false);
    }
  }, [user?.address, router]);

  // Fetch Pool Metadata if ID is present
  useEffect(() => {
    if (paramPoolId) {
      // Just set ID, we could fetch title async if needed, but for now defaults or fetched later
      // We'll try to fetch title for better UX
      fetchPoolTitle(paramPoolId);
    } else {
      // No pool ID? Trigger selector logic
      if (isConnected && user) {
        fetchJoinedPools();
      }
    }
  }, [paramPoolId, isConnected, user, fetchPoolTitle, fetchJoinedPools]);

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

    if (!selectedPoolId || !selectedCoinType) {
      // Should have been caught by selector, but double check
      if (joinedPools.length > 0) {
        setShowPoolSelector(true);
        return;
      } else {
        alert("No target pool selected.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Start session on-chain
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${STRIDE_MODULE}::start_run`,
        typeArguments: [selectedCoinType],
        arguments: [
          tx.object(selectedPoolId), // The selected Pool ID
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
      
      const digest = result.$kind === 'Transaction' ? result.Transaction?.digest : null;

      if (!digest) {
        throw new Error("Transaction was signed but digest was not found in the result.");
      }

      // Use getTransactionBlock to get the finalized details with a reliable structure
      const txDetails = await suiClient.getTransaction({
        digest: digest,
        include: { effects: true, objectTypes: true },
      });

      let sessionId: string | undefined;

      if (txDetails.$kind === 'Transaction' && txDetails.Transaction.effects?.changedObjects) {
        // Find the 'created' object that is a 'Session' type
        const sessionObject = txDetails.Transaction.effects.changedObjects.find(
          (change) =>
            change.idOperation === 'Created' &&
            change.outputState === 'ObjectWrite' &&
            txDetails.Transaction.objectTypes?.[change.objectId!]?.endsWith('::core::Session'),
        );
        if (sessionObject) {
          sessionId = sessionObject.objectId;
        }
      }

      if (!sessionId) {
        console.log("DEBUG: Raw transaction details from getTransactionBlock:", JSON.stringify(txDetails, null, 2));
        throw new Error("Failed to find created Session object in getTransactionBlock response.");
      }

      setSessionId(sessionId);
      setIsTracking(true);
      console.log("Session started:", sessionId);
    } catch (e) {
      console.error("Failed to start run:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`Failed to start run on-chain. Reason: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndWorkout = async () => {
    if (!isConnected || !userDataId || !sessionId || !user || !selectedPoolId || !selectedCoinType) {
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
        typeArguments: [selectedCoinType],
        arguments: [
          tx.object(selectedPoolId),
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

      console.log("Transaction successful:", result);
      
      const txRes = result as unknown as TxResultHelper;
      const digest = txRes.digest || (txRes.$kind === 'Transaction' ? txRes.Transaction?.digest : 'Unknown');
      
      alert(`Workout Complete and Verified on Sui!\nDigest: ${digest}`);
      router.push('/'); // Go back to dashboard to see updated stats
    } catch (err) {
      console.error("Error ending workout:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Failed to submit run to blockchain. Reason: ${errorMessage}`);
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

  const selectPool = (poolId: string) => {
    const pool = joinedPools.find(p => p.id === poolId);
    if (pool) {
      setSelectedPoolId(pool.id);
      setSelectedCoinType(pool.coinType);
      setPoolTitle(pool.title);
      setShowPoolSelector(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6 pb-20">

      {/* Pool Selector Dialog */}
      <Dialog open={showPoolSelector} onOpenChange={setShowPoolSelector}>
        <DialogContent className="rounded-2xl w-[90%] max-w-sm">
          <DialogHeader>
            <DialogTitle>Select a Challenge</DialogTitle>
            <DialogDescription>
              Choose which pool you want to run for.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {isLoadingPools ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : joinedPools.length > 0 ? (
              <div className="flex flex-col gap-2">
                {joinedPools.map(pool => (
                  <Button
                    key={pool.id}
                    variant="outline"
                    className="justify-between h-14"
                    onClick={() => selectPool(pool.id)}
                  >
                    <span className="font-bold">{pool.title}</span>
                    <span className="text-xs text-muted-foreground">{pool.coinType.includes("STRD") ? "STRD" : "SUI"}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                No active pools found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="flex justify-between items-center py-2 mb-6">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft />
          </Button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-[10px] font-bold tracking-[2px] uppercase">
            RUNNING FOR
          </span>
          <span className="text-foreground text-sm font-black tracking-tight uppercase max-w-[150px] truncate text-center">
            {poolTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user?.label === 'Google User' ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-primary">ZK Login</span>
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
          className="w-14 h-14 rounded-full bg-card flex items-center justify-center border border-border hover:bg-card/80 transition-colors shadow-lg shadow-black/20 active:scale-95 disabled:opacity-50"
          onClick={() => {
            if (!sessionId) {
              handleStartWorkout();
            } else {
              setIsTracking(!isTracking);
            }
          }}
          disabled={isSubmitting || !selectedPoolId}
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
        disabled={isSubmitting || !sessionId}
      >
        <span className="text-foreground text-lg font-bold">
          {isSubmitting ? "Submitting to Sui..." : "End Workout"}
        </span>
      </Button>
    </div>
  );
}