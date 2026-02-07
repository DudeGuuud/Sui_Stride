import { useEffect, useState, useCallback, useRef } from "react";

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  accuracy: number | null;
}

export function useNativeLocation(isActive: boolean) {
  const [location, setLocation] = useState<LocationPoint | null>(null);
  const [path, setPath] = useState<LocationPoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pathRef = useRef<LocationPoint[]>([]);
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

  const processLocationUpdate = useCallback(
    (
      latitude: number,
      longitude: number,
      speed: number | null,
      accuracy: number | null,
      timestamp: number
    ) => {
      if (!isActiveRef.current) return;

      // Filter 1: Accuracy check (skip if > 20m)
      if (accuracy && accuracy > 20) return;

      const point: LocationPoint = {
        latitude,
        longitude,
        timestamp: timestamp || Date.now(),
        speed,
        accuracy,
      };

      const currentPath = pathRef.current;

      if (currentPath.length > 0) {
        const lastPoint = currentPath[currentPath.length - 1];
        const dist = calculateDistance(lastPoint, point);

        // Filter 2: Stationary drift (< 2m)
        if (dist < 2) return;

        setDistance((prev) => prev + dist);
        setLocation(point);
        const newPath = [...currentPath, point];
        setPath(newPath);
        pathRef.current = newPath;
      } else {
        // First point
        setLocation(point);
        setPath([point]);
        pathRef.current = [point];
      }
    },
    []
  );

  useEffect(() => {
    // Notify native that web is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "WEB_READY" })
      );
    } else {
      console.log("Running in browser mode - simulating native location");
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.type === "LOCATION_UPDATE") {
          const { latitude, longitude, speed, accuracy, timestamp } =
            data.payload;
          processLocationUpdate(
            latitude,
            longitude,
            speed,
            accuracy,
            timestamp
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

  const resetTracking = useCallback(() => {
    setPath([]);
    pathRef.current = [];
    setDistance(0);
    setLocation(null);
  }, []);

  return { location, path, distance, errorMsg, resetTracking };
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
