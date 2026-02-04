import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type LocationPoint = {
    latitude: number;
    longitude: number;
    timestamp: number;
    speed: number | null;
    accuracy: number | null;
};

export function useLocationTracking(isActive: boolean) {
    const [location, setLocation] = useState<LocationPoint | null>(null);
    const [path, setPath] = useState<LocationPoint[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [distance, setDistance] = useState(0); // in meters

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

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        async function startTracking() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                (newLocation) => {
                    const { accuracy, latitude, longitude, speed } = newLocation.coords;

                    // Filter 1: Reject garbage data (low accuracy)
                    // If accuracy is worse than 20 meters, it's just noise.
                    if (accuracy && accuracy > 20) {
                        return;
                    }

                    const point: LocationPoint = {
                        latitude,
                        longitude,
                        timestamp: newLocation.timestamp,
                        speed,
                        accuracy,
                    };

                    setPath((currentPath) => {
                        if (currentPath.length > 0) {
                            const lastPoint = currentPath[currentPath.length - 1];
                            const dist = calculateDistance(lastPoint, point);

                            // Filter 2: Stationary Drift (Minimal movement)
                            // If we moved less than 2 meters, assume we are standing still
                            // and this is just GPS jitter.
                            if (dist < 2) {
                                return currentPath;
                            }

                            setDistance((prev) => prev + dist);
                            setLocation(point); // Only update current location if we actually moved
                            return [...currentPath, point];
                        }

                        // First point
                        setLocation(point);
                        return [point];
                    });
                }
            );
        }

        if (isActive) {
            startTracking();
        }

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [isActive]);

    const resetTracking = useCallback(() => {
        setPath([]);
        setDistance(0);
        setLocation(null);
    }, []);

    return { location, path, distance, errorMsg, resetTracking };
}
