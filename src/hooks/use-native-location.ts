import { useEffect, useState, useCallback, useRef } from "react";
import { StrideTracker, RelativePoint } from "@/lib/stride-logic";
import { StrideRepository, StrideRun } from "@/lib/stride-repo";

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  accuracy: number | null;
  steps?: number; // Added steps field
}

export function useNativeLocation(isActive: boolean) {
  const [location, setLocation] = useState<LocationPoint | null>(null);
  const [path, setPath] = useState<LocationPoint[]>([]);
  const [relativePoints, setRelativePoints] = useState<RelativePoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [steps, setSteps] = useState(0); // Real-time steps
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trackerRef = useRef<StrideTracker>(new StrideTracker());
  const pathRef = useRef<LocationPoint[]>([]);
  const relativeRef = useRef<RelativePoint[]>([]);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const calculateDistance = (p1: LocationPoint, p2: LocationPoint) => {
    const R = 6371e3; // metres
    const φ1 = (p1.latitude * Math.PI) / 180;
    const φ2 = (p2.latitude * Math.PI) / 180;
    const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };



  // Persistence
  const repoRef = useRef<StrideRepository | null>(null);
  const runIdRef = useRef<string | null>(null);
  const originSavedRef = useRef(false);

  // Initialize DB and restore state
  useEffect(() => {
    const initRepo = async () => {
      const repo = new StrideRepository();
      repoRef.current = repo;

      const activeRun = await repo.getActiveRun();
      if (activeRun) {
        console.log("Restoring active run:", activeRun.id);
        runIdRef.current = activeRun.id;
        setDistance(activeRun.totalDistance);
        setSteps(activeRun.totalSteps);

        const points = await repo.getRunPoints(activeRun.id);
        if (points.length > 0) {
          // Restore path and relative points
          // Note context: points here are RelativePoint. We need to reconstruct LocationPoint roughly or just trust the visual path isn't fully needed if we have relative points for logic.
          // Actually, we store "RelativePoint" in 'points' store but we need "LocationPoint" for the map path.
          // The current design stores RelativePoint. Let's stick to restoring the Logic State (tracker) and visual path if possible.
          // Since we don't store raw lat/lon in 'points' store (only relative x,y), we can't fully restore the visual Polyline on the map 
          // UNLESS we modify StrideRepository to store full LocationPoint.
          // For now, let's just restore the "Relative" state so the tracker doesn't jump.

          // Re-populate tracker state provided we have the origin.
          // Actually, the StrideTracker resets on reload.
          // Use Case: User kills app. Restart.
          // We need to re-initialize StrideTracker with the LAST KNOWN point to continue the path relative to it?
          // Or just accept a gap?

          // Let's at least modify repo to store full LocationPoint if we want to restore map.
          // Given the prompt "ensure calculated things are the same", restoring the internal state is key.
          // For this iteration, I will restore the generic accumulators (dist, steps) and ensure new points are added to the SAME run.

          relativeRef.current = points;
          setRelativePoints(points);

          if (activeRun.origin) {
            trackerRef.current.restoreState(activeRun.origin, points[points.length - 1]);
            originSavedRef.current = true;
            console.log("Restored tracker origin and state");
          }
        }
      } else {
        // Start new run immediately? Or wait for first point?
        // Let's wait for first valid location key to start run?
        // Or just start one now.
        const newRunId = await repo.startRun(crypto.randomUUID());
        runIdRef.current = newRunId;
        console.log("Started new run:", newRunId);
      }
    };

    initRepo();
  }, []);

  const processLocationUpdate = useCallback(
    async (
      latitude: number,
      longitude: number,
      speed: number | null,
      accuracy: number | null,
      timestamp: number,
      newSteps?: number
    ) => {
      if (!isActiveRef.current) return;

      // Filter 1: Accuracy check (skip if > 20m)
      if (accuracy && accuracy > 20) return;

      // Filter 2: Kalman & Relative Tracker
      const relPoint = trackerRef.current.process(latitude, longitude, timestamp);

      if (newSteps !== undefined) {
        setSteps(newSteps);
      }

      const point: LocationPoint = {
        latitude,
        longitude,
        timestamp: timestamp || Date.now(),
        speed: relPoint.v, // Use filtered velocity
        accuracy,
        steps: newSteps,
      };

      const currentPath = pathRef.current;
      const currentRel = relativeRef.current;
      let distDelta = 0;

      if (currentPath.length > 0) {
        const lastPoint = currentPath[currentPath.length - 1];
        const dist = calculateDistance(lastPoint, point);

        // Filter 3: Stationary drift (< 1.5m)
        if (dist < 1.5) return;

        distDelta = dist;
        setDistance((prev) => prev + dist);
        setLocation(point);

        const newPath = [...currentPath, point];
        pathRef.current = newPath;
        setPath(newPath);

        const newRel = [...currentRel, relPoint];
        relativeRef.current = newRel;
        setRelativePoints(newRel);
      } else {
        // First point
        setLocation(point);
        setPath([point]);
        pathRef.current = [point];

        setRelativePoints([relPoint]);
        relativeRef.current = [relPoint];
      }

      // Persistence: Save point + update run stats
      if (repoRef.current && runIdRef.current) {
        // We persist the RELATIVE point as that's the "calculated thing"
        // But maybe we should also persist the LatLon if we want to verify it later?
        // The prompt says "ensure calculated things are the same".
        repoRef.current.addPoint(runIdRef.current, relPoint);

        // Save origin if not saved yet
        if (!originSavedRef.current) {
          const origin = trackerRef.current.getOrigin();
          if (origin) {
            repoRef.current.setRunOrigin(runIdRef.current, origin);
            originSavedRef.current = true;
          }
        }

        // Optimize: Don't update run header on every point if IO is heavy, but IDB is fast enough.
        // We only really need to update 'totalDistance' and 'totalSteps' occasionally or on exit.
        // But since we can't catch "kill", we should try to keep it fresh.
        // Updating the run object every second might be overkill?
        // Let's just blindly save the point. The 'active run' loading logic calculates totals from points?
        // No, we store totals in the run object.
        // Let's update the run object with new totals.
        // To avoid race conditions, we might just trust the state 'distance' and 'steps' variable
        // But 'distance' state is inside this scope. 
        // We can't await here easily without blocking UI? IDB is async but off main thread mostly.

        // Fire and forget allow?
        /* await */ repoRef.current.updateRunStats(runIdRef.current, {
          distance: distance + distDelta, // naive: uses closure state + delta
          steps: newSteps ?? steps
        });
      }
    },
    [distance, steps] // depend on distance/steps to save correct values
  );

  useEffect(() => {
    // Notify native that web is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "WEB_READY" })
      );
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.type === "LOCATION_UPDATE") {
          const { latitude, longitude, speed, accuracy, timestamp, steps: incomingSteps } =
            data.payload;
          processLocationUpdate(
            latitude,
            longitude,
            speed,
            accuracy,
            timestamp,
            incomingSteps
          );
        }
      } catch (e) {
        console.error("Failed to parse location message", e);
      }
    };

    window.addEventListener("message", handleMessage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document.addEventListener("message", handleMessage as any);

    // Fallback for browser testing using Geolocation API
    let watchId: number | null = null;
    if (
      typeof window !== "undefined" &&
      !window.ReactNativeWebView &&
      navigator.geolocation
    ) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          processLocationUpdate(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.speed,
            position.coords.accuracy,
            position.timestamp
          );
        },
        (error) => {
          console.error("Geolocation error:", error);
          setErrorMsg(error.message);
        },
        {
          enableHighAccuracy: true,
        }
      );
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.removeEventListener("message", handleMessage as any);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [processLocationUpdate]);

  const resetTracking = useCallback(async () => {
    // Complete current run in DB
    if (repoRef.current && runIdRef.current) {
      await repoRef.current.completeRun(runIdRef.current, distance, steps);
      runIdRef.current = null;
    }

    setPath([]);
    pathRef.current = [];
    setRelativePoints([]);
    relativeRef.current = [];
    setDistance(0);
    setSteps(0);
    setLocation(null);
    trackerRef.current = new StrideTracker();

    // Start new run
    if (repoRef.current) {
      const newId = await repoRef.current.startRun(crypto.randomUUID());
      runIdRef.current = newId;
    }
  }, [distance, steps]);

  return { location, path, relativePoints, distance, steps, errorMsg, resetTracking };
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
