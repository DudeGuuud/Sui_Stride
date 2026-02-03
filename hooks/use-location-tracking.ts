import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type LocationPoint = {
    latitude: number;
    longitude: number;
    timestamp: number;
    speed: number | null;
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
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (newLocation) => {
                    const point: LocationPoint = {
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                        timestamp: newLocation.timestamp,
                        speed: newLocation.coords.speed,
                    };

                    setLocation(point);
                    setPath((currentPath) => {
                        if (currentPath.length > 0) {
                            const lastPoint = currentPath[currentPath.length - 1];
                            const d = calculateDistance(lastPoint, point);
                            setDistance((prev) => prev + d);
                        }
                        return [...currentPath, point];
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
