"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNativeLocation } from "@/hooks/use-native-location";

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
  const [isTracking, setIsTracking] = useState(true);
  const { location, path, distance, errorMsg } = useNativeLocation(isTracking);
  const [elapsedTime, setElapsedTime] = useState(0);
  // Derived state for calories: ~1 kcal per kg per km (approximate for running)
  const weightKg = 70; // User weight
  const calories = (distance / 1000) * weightKg * 1.036;

  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

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
            (( )) SUI MAINNET
          </span>
        </div>
        <span className="text-foreground text-xs font-bold tracking-[4px] uppercase">
          SuiStride
        </span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 bg-foreground rounded-sm opacity-50" />
          <div className="w-2 h-2 bg-foreground rounded-full opacity-50" />
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

      {/* Map */}
      <div className="relative w-full h-80 rounded-3xl bg-card border border-border overflow-hidden mb-8 shadow-lg shadow-black/20">
        <MapComponent location={location} path={path} />

        <div className="absolute right-4 bottom-4 gap-3 flex flex-col z-[400]">
          <button className="w-10 h-10 rounded-full bg-background/80 flex items-center justify-center border border-border hover:bg-background transition-colors">
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
          onClick={() => setIsTracking(!isTracking)}
        >
          {isTracking ? (
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
        className="h-16 w-full rounded-2xl border-2 border-primary/20 bg-background/20 mb-10 hover:bg-primary/10 transition-colors"
        onClick={() => router.back()}
      >
        <span className="text-foreground text-lg font-bold">End Workout</span>
      </Button>
    </div>
  );
}
