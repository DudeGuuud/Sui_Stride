import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
  steps: number;
}

// Haversine formula to calculate distance between two points in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const useLocationTracking = (tracking: boolean = true) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Ref to keep track of the last valid location for filtering
  // Using ref to avoid stale closures in the subscription callback
  const lastLocationRef = useRef<LocationData | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let pedometerSubscription: Pedometer.PedometerSubscription | null = null;
    let currentSteps = 0;

    (async () => {
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
           pedometerSubscription = Pedometer.watchStepCount((result) => {
            currentSteps = result.steps;
            setLocation(prev => prev ? { ...prev, steps: currentSteps } : null);
          });
        }

        if (tracking) {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 1,
            },
            (newLocation) => {
              const { latitude, longitude, speed, accuracy } = newLocation.coords;

              // Filter 1: Accuracy Check (from main branch)
              // Reject points with poor accuracy (> 200m for testing, was 20m)
              if (accuracy && accuracy > 200) {
                return;
              }

              // Filter 2: Stationary Drift Check (from main branch)
              // If moved less than 1 meters, assume stationary to avoid jitter
              if (lastLocationRef.current) {
                const dist = calculateDistance(
                  lastLocationRef.current.latitude,
                  lastLocationRef.current.longitude,
                  latitude,
                  longitude
                );
                if (dist < 1) { // Relaxed from 2m
                  return;
                }
              }

              const validLocation: LocationData = {
                latitude,
                longitude,
                speed,
                accuracy,
                timestamp: newLocation.timestamp,
                steps: currentSteps,
              };

              lastLocationRef.current = validLocation;
              setLocation(validLocation);
            }
          );
        }
      } catch (_) {
        setErrorMsg('Error initializing tracking services');
      }
    })();

    return () => {
      locationSubscription?.remove();
      pedometerSubscription?.remove();
      // Reset ref on unmount or when tracking stops? 
      // Maybe not if we want to resume, but for now this is fine.
    };
  }, [tracking]);

  return { location, errorMsg };
};
