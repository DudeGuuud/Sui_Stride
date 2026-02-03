import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from 'expo-router';
import { Box, Camera, Clock, Flame, Gauge, Layers, Music, Pause, Target } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutTrackingScreen() {
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
                    <Text className="text-foreground text-8xl font-black">5.42</Text>
                    <Text className="text-muted-foreground text-xl font-medium mt-1">Kilometers</Text>
                </View>

                {/* Map Placeholder */}
                <View className="relative w-full h-80 rounded-3xl bg-card border border-border overflow-hidden mb-8">
                    {/* Schematic Map (Mockup) */}
                    <View className="absolute inset-0 bg-[#162128]">
                        {/* Fake path */}
                        <View
                            style={{
                                position: 'absolute',
                                bottom: '20%',
                                left: '20%',
                                width: '60%',
                                height: '60%',
                                borderLeftWidth: 6,
                                borderTopWidth: 6,
                                borderColor: '#00E5FF',
                                borderTopLeftRadius: 100,
                                transform: [{ rotate: '45deg' }]
                            }}
                        />
                        <View className="absolute top-1/2 left-1/2 -ml-2 -mt-2 w-4 h-4 bg-primary rounded-full shadow-[0_0_10px_#00E5FF]" />
                    </View>

                    <View className="absolute right-4 bottom-4 gap-3">
                        <Pressable className="w-10 h-10 rounded-full bg-background/80 items-center justify-center border border-border">
                            <Target size={20} color="#FFFFFF" />
                        </Pressable>
                        <Pressable className="w-10 h-10 rounded-full bg-background/80 items-center justify-center border border-border">
                            <Layers size={20} color="#FFFFFF" />
                        </Pressable>
                    </View>

                    <View className="absolute top-1/2 left-1/2 -ml-12 -mt-4">
                        <Text className="text-foreground/40 font-bold text-xs uppercase tracking-tighter">San Francisco</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-4 mb-8">
                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Gauge size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Avg Pace</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">5&apos;12&quot;</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Clock size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Duration</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">00:28:15</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Flame size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Calories</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">428</Text>
                        </CardContent>
                    </Card>

                    <Card className="w-[47%] bg-card border-none">
                        <CardContent className="p-5">
                            <View className="flex-row items-center gap-2 mb-3">
                                <Box size={16} color="#00E5FF" />
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">SUI Earned</Text>
                            </View>
                            <Text className="text-foreground text-2xl font-bold">12.4</Text>
                        </CardContent>
                    </Card>
                </View>

                {/* Control Buttons */}
                <View className="flex-row justify-center items-center gap-10 mb-10">
                    <Pressable className="w-14 h-14 rounded-full bg-card items-center justify-center border border-border">
                        <Pause size={24} color="#FFFFFF" />
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

                {/* Pagination Dots */}
                <View className="flex-row justify-center gap-1.5 mb-10">
                    <View className="w-8 h-1 bg-primary rounded-full" />
                    <View className="w-1.5 h-1 bg-muted rounded-full" />
                    <View className="w-1.5 h-1 bg-muted rounded-full" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
