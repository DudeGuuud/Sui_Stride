import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocationTracking } from '@/hooks/use-location-tracking';
import { router } from 'expo-router';
import { Box, Camera, Clock, Flame, Gauge, Layers, Music, Pause, Play, Target } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import mapStyle from '@/constants/map-style.json';

export default function WorkoutTrackingScreen() {
    const [isTracking, setIsTracking] = useState(true);
    const { location, path, distance, errorMsg } = useLocationTracking(isTracking);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [calories, setCalories] = useState(0);
    const weightKg = 70; // User weight (default 70kg)

    useEffect(() => {
        let interval: any;
        if (isTracking) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking]);

    // Calculate Calories based on speed and time (ACSM Metabolic Equation)
    // Run this effect whenever location updates (every 1s roughly)
    useEffect(() => {
        if (!isTracking || !location) return;

        const speedMetersPerSec = location.speed || 0;
        const speedMetersPerMin = speedMetersPerSec * 60;

        // ACSM Formula for Running: VO2 (ml/kg/min) = 0.2 * speed(m/min) + 0.9 * speed(m/min) * grade + 3.5
        // We assume 0 grade for now.
        // VO2 = 0.2 * speedMetersPerMin + 3.5
        // Calories/min = (VO2 * weightKg) / 200
        // Calories/sec = Calories/min / 60

        // If speed is very low (< 0.8 m/s ~ 3 km/h), use Walking formula:
        // VO2 = 0.1 * speed(m/min) + 3.5
        let vo2 = 0;
        if (speedMetersPerSec < 0.8) {
             vo2 = 0.1 * speedMetersPerMin + 3.5;
        } else {
             vo2 = 0.2 * speedMetersPerMin + 3.5;
        }

        const kcalPerMin = (vo2 * weightKg) / 200;
        const kcalPerSec = kcalPerMin / 60;

        // Since location updates roughly every 1s, we add 1s worth of calories
        // But better to use the actual time difference if we had it.
        // For simplicity and "Linus" robustness, assuming 1s tick is fine given our 1s GPS update rate.
        setCalories(c => c + kcalPerSec);

    }, [location, isTracking]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatAvgPace = () => {
        if (distance === 0) return "0'00\"";
        const paceInSeconds = elapsedTime / (distance / 1000);
        const mins = Math.floor(paceInSeconds / 60);
        const secs = Math.floor(paceInSeconds % 60);
        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    const formatCurrentPace = () => {
        const speed = location?.speed || 0; // m/s
        if (speed < 0.1) return "-'--\""; // Stationary

        const paceSecondsPerKm = 1000 / speed;
        const mins = Math.floor(paceSecondsPerKm / 60);
        const secs = Math.floor(paceSecondsPerKm % 60);
        
        // Cap at 30:00 pace to avoid ugly numbers when walking very slowly
        if (mins > 30) return "-'--\"";

        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* System Bar Placeholder */}
            <View className="px-6 py-2 flex-row justify-between items-center">
                <View className="flex-row items-center gap-1">
                    <Text className="text-secondary text-[10px] uppercase font-bold tracking-widest">(( )) SUI MAINNET</Text>
                </View>
                <Text className="text-foreground text-xs font-bold tracking-[4px] uppercase">SuiStride</Text>
                <View className="flex-row items-center gap-2">
                    <View className="w-4 h-2 bg-foreground rounded-sm opacity-50" />
                    <View className="w-2 h-2 bg-foreground rounded-full opacity-50" />
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Distance Info */}
                <View className="items-center mt-6 mb-8">
                    <Text className="text-primary text-sm font-bold tracking-[3px] uppercase mb-1">Total Distance</Text>
                    <Text className="text-foreground text-8xl font-black">{(distance / 1000).toFixed(2)}</Text>
                    <Text className="text-muted-foreground text-xl font-medium mt-1">Kilometers</Text>
                </View>

                <View className="relative w-full h-80 rounded-3xl bg-card border border-border overflow-hidden mb-8">
                    <MapView
                        style={{ flex: 1 }}
                        customMapStyle={mapStyle}
                        loadingBackgroundColor="#0A0E12"
                        loadingEnabled
                        toolbarEnabled={false}
                        initialRegion={{
                            latitude: location?.latitude || 37.7749,
                            longitude: location?.longitude || -122.4194,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                        region={location ? {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        } : undefined}
                        showsUserLocation
                        userInterfaceStyle="dark"
                    >
                        {path.length > 1 && (
                            <Polyline
                                coordinates={path.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                                strokeColor="#00E5FF"
                                strokeWidth={6}
                            />
                        )}
                    </MapView>

                    <View className="absolute right-4 bottom-4 gap-3">
                        <Pressable className="w-10 h-10 rounded-full bg-background/80 items-center justify-center border border-border">
                            <Target size={20} color="#FFFFFF" />
                        </Pressable>
                        <Pressable className="w-10 h-10 rounded-full bg-background/80 items-center justify-center border border-border">
                            <Layers size={20} color="#FFFFFF" />
                        </Pressable>
                    </View>

                    {errorMsg && (
                        <View className="absolute top-4 left-4 right-4 bg-destructive/90 p-2 rounded-lg">
                            <Text className="text-destructive-foreground text-[10px] text-center">{errorMsg}</Text>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-4 mb-8">
                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Target size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Avg Pace</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">{formatAvgPace()}</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Clock size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Duration</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">{formatTime(elapsedTime)}</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Flame size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Calories</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">{calories.toFixed(0)}</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Gauge size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Current Pace</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">{formatCurrentPace()}</Text>
                        </CardContent>
                    </Card>
                </View>

                {/* Control Buttons */}
                <View className="flex-row justify-center items-center gap-10 mb-10">
                    <Pressable
                        className="w-14 h-14 rounded-full bg-card items-center justify-center border border-border"
                        onPress={() => setIsTracking(!isTracking)}
                    >
                        {isTracking ? <Pause size={24} color="#FFFFFF" /> : <Play size={24} color="#FFFFFF" />}
                    </Pressable>
                    <Pressable className="w-14 h-14 rounded-full bg-card items-center justify-center border border-border">
                        <Camera size={24} color="#FFFFFF" />
                    </Pressable>
                    <Pressable className="w-14 h-14 rounded-full bg-card items-center justify-center border border-border">
                        <Music size={24} color="#FFFFFF" />
                    </Pressable>
                </View>

                {/* End Workout Button */}
                <Button
                    variant="outline"
                    className="h-16 rounded-2xl border-2 border-primary/20 bg-background/20 mb-10"
                    onPress={() => router.back()}
                >
                    <Text className="text-foreground text-lg font-bold">End Workout</Text>
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}
