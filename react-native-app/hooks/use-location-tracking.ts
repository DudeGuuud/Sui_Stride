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
  
  const lastLocationRef = useRef<LocationData | null>(null);
  const currentStepsRef = useRef<number>(0);

  // Pedometer Setup
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pedometerSubscription: any = null;
    
    const startPedometer = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
          pedometerSubscription = Pedometer.watchStepCount((result) => {
            currentStepsRef.current = result.steps;
            setLocation(prev => prev ? { ...prev, steps: result.steps } : null);
          });
        }
      } catch (e) {
        console.warn("Pedometer error:", e);
      }
    };

    startPedometer();

    return () => {
      pedometerSubscription?.remove();
    };
  }, []);

  // Geolocation Setup
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied');
          return;
        }

        if (tracking) {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 0,
            },
            (position) => {
              const { latitude, longitude, speed, accuracy } = position.coords;

              // Filter 1: Accuracy Check (accuracy is in meters, lower is better)
              if (accuracy && accuracy > 200) {
                return;
              }

              // Filter 2: Stationary Drift Check
              if (lastLocationRef.current) {
                const dist = calculateDistance(
                  lastLocationRef.current.latitude,
                  lastLocationRef.current.longitude,
                  latitude,
                  longitude
                );
                // If moved less than 1 meter, ignore (drift)
                if (dist < 1) {
                  return;
                }
              }

              const validLocation: LocationData = {
                latitude,
                longitude,
                speed,
                accuracy,
                timestamp: position.timestamp,
                steps: currentStepsRef.current,
              };

              lastLocationRef.current = validLocation;
              setLocation(validLocation);
            }
          );
        }
      } catch (error) {
        console.error("Location tracking error:", error);
        setErrorMsg("Error starting location tracking");
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [tracking]);

  return { location, errorMsg };
};