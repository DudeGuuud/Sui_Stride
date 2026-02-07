import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

export const useLocationTracking = (tracking: boolean = true) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        if (tracking) {
          subscription = await Location.watchPositionAsync(
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
              });
            }
          );
        }
      } catch (err) {
        setErrorMsg('Error initializing location services');
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [tracking]);

  return { location, errorMsg };
};
