import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
  steps: number; // Added real-time steps
}

export const useLocationTracking = (tracking: boolean = true) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let pedometerSubscription: Pedometer.PedometerSubscription | null = null;
    // Track steps in a local variable to update location immediately
    let currentSteps = 0;

    (async () => {
      try {
        // 1. Request Location Permissions
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        // 2. Request Pedometer Permissions
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
           pedometerSubscription = Pedometer.watchStepCount((result) => {
            currentSteps = result.steps;
            // Optimistically update location if we have one
            setLocation(prev => prev ? { ...prev, steps: currentSteps } : null);
          });
        }

        if (tracking) {
          // Track Location
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 1,
            },
            (newLocation) => {
              setLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                speed: newLocation.coords.speed,
                accuracy: newLocation.coords.accuracy,
                timestamp: newLocation.timestamp,
                steps: currentSteps, // Use the latest steps value
              });
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
    };
  }, [tracking]);

  return { location, errorMsg };
};
