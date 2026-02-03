import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocationTracking } from '@/hooks/use-location-tracking';
import { router } from 'expo-router';
import { Box, Camera, Clock, Flame, Gauge, Layers, Music, Pause, Play, Target } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutTrackingScreen() {
    const [isTracking, setIsTracking] = useState(true);
    const { location, path, distance, errorMsg } = useLocationTracking(isTracking);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: any;
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
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPace = () => {
        if (distance === 0) return "0'00\"";
        const paceInSeconds = elapsedTime / (distance / 1000);
        const mins = Math.floor(paceInSeconds / 60);
        const secs = Math.floor(paceInSeconds % 60);
        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    const calculateCalories = () => {
        // Simple MET calculation: MET * Weight (fixed at 70kg for now) * Time (hours)
        // Running at 8km/h is ~8 MET
        return Math.floor((8.0 * 70 * (elapsedTime / 3600)));
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
                                <Gauge size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Avg Pace</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">{formatPace()}</Text>
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
                            <Text className="text-foreground text-2xl font-bold">{calculateCalories()}</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Box size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">SUI Earned</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">{(distance / 500).toFixed(1)}</Text>
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
