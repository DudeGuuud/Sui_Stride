import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { router } from 'expo-router';
import { Flame, Footprints, MapPin, Play } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeDashboard() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center py-4">
                    <View className="flex-row items-center gap-2">
                        <View className="w-10 h-10 rounded-xl bg-card items-center justify-center overflow-hidden border border-border">
                            <Image
                                source={require('@/assets/images/logo.png')}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                        <View>
                            <Text className="text-foreground font-bold text-lg">SuiStride</Text>
                            <Text className="text-secondary text-xs font-medium">MAINNET</Text>
                        </View>
                    </View>
                    <Badge variant="secondary" className="bg-card px-3 py-1.5 border-border">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-foreground text-xs font-mono">0x...A123</Text>
                            <View className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                                    className="w-full h-full"
                                />
                            </View>
                        </View>
                    </Badge>
                </View>

                {/* Balance Card */}
                <Card className="bg-card border-none mb-6 overflow-hidden shadow-2xl shadow-primary/5">
                    <CardContent className="p-6">
                        <Text className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2">SUI Balance</Text>
                        <View className="flex-row items-baseline gap-2 mb-6">
                            <Text className="text-foreground text-5xl font-bold tracking-tighter">1,240.50</Text>
                            <Text className="text-primary text-xl font-medium tracking-tight">SUI</Text>
                        </View>
                        <View className="flex-row gap-2">
                            <Badge variant="outline" className="bg-background/80 border-border/50 px-2.5 py-1 rounded-lg">
                                <Text className="text-muted-foreground text-[10px] font-medium">zkLogin active</Text>
                            </Badge>
                            <Badge variant="outline" className="bg-background/80 border-border/50 px-2.5 py-1 rounded-lg">
                                <Text className="text-muted-foreground text-[10px] font-medium">v1.2.0</Text>
                            </Badge>
                        </View>
                    </CardContent>
                    {/* Subtle glow effect */}
                    <View className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                </Card>

                {/* Today's Activity */}
                <View className="mb-8">
                    <Text className="text-foreground text-2xl font-bold mb-5 tracking-tight">Today&apos;s Activity</Text>
                    <Card className="bg-card border-none mb-5 shadow-sm">
                        <CardContent className="p-6">
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center gap-3">
                                    <View className="bg-primary/10 p-2 rounded-lg">
                                        <Footprints size={24} color="#00E5FF" />
                                    </View>
                                    <View>
                                        <Text className="text-foreground font-bold text-lg">
                                            7,500 <Text className="text-muted-foreground font-normal text-sm">/ 10,000 steps</Text>
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-primary font-black text-lg">75%</Text>
                            </View>
                            <Progress value={75} className="h-2.5 bg-muted/30" />
                        </CardContent>
                    </Card>

                    <View className="flex-row gap-4">
                        <Card className="flex-1 bg-card border-none shadow-sm">
                            <CardContent className="p-5">
                                <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center mb-4">
                                    <MapPin size={22} color="#7986CB" />
                                </View>
                                <View className="flex-row items-baseline gap-1 mb-1">
                                    <Text className="text-foreground text-3xl font-bold">5.2</Text>
                                    <Text className="text-muted-foreground text-sm font-medium">km</Text>
                                </View>
                                <Text className="text-muted-foreground text-[10px] uppercase font-black tracking-[1.5px] opacity-70">Distance</Text>
                            </CardContent>
                        </Card>
                        <Card className="flex-1 bg-card border-none shadow-sm">
                            <CardContent className="p-5">
                                <View className="w-10 h-10 rounded-xl bg-orange-500/10 items-center justify-center mb-4">
                                    <Flame size={22} color="#FF8A65" />
                                </View>
                                <View className="flex-row items-baseline gap-1 mb-1">
                                    <Text className="text-foreground text-3xl font-bold">450</Text>
                                    <Text className="text-muted-foreground text-sm font-medium">kcal</Text>
                                </View>
                                <Text className="text-muted-foreground text-[10px] uppercase font-black tracking-[1.5px] opacity-70">Calories</Text>
                            </CardContent>
                        </Card>
                    </View>
                </View>

                {/* Start Running Button */}
                <Button
                    className="h-20 rounded-[28px] bg-primary flex-row items-center justify-center gap-4 mb-10 shadow-2xl shadow-primary/40 active:opacity-90"
                    onPress={() => router.push('/workout/tracking')}
                >
                    <Play size={28} color="#0A0E12" fill="#0A0E12" />
                    <Text className="text-[#0A0E12] text-2xl font-black uppercase tracking-tight">Start Running</Text>
                </Button>

                {/* Live Challenges */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-foreground text-xl font-bold">Live Challenges</Text>
                        <Pressable onPress={() => router.push('/pools')}>
                            <Text className="text-primary text-sm font-medium">View all</Text>
                        </Pressable>
                    </View>

                    <Card className="bg-card border-none mb-4 overflow-hidden">
                        <CardContent className="p-4 flex-row items-center gap-4">
                            <View className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary items-center justify-center shadow-lg shadow-secondary/20">
                                <Trophy size={28} color="#0A0E12" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-bold text-base mb-0.5">Summer Sizzle 10k</Text>
                                <Text className="text-muted-foreground text-xs mb-2">Stake 50 SUI to win from pot</Text>
                                <View className="flex-row items-center">
                                    <View className="flex-row -space-x-2 mr-2">
                                        {[1, 2, 3].map(i => (
                                            <View key={i} className="w-5 h-5 rounded-full border border-card bg-muted overflow-hidden">
                                                <Image source={{ uri: `https://i.pravatar.cc/100?u=${i}` }} className="w-full h-full" />
                                            </View>
                                        ))}
                                    </View>
                                    <Text className="text-muted-foreground text-[10px]">+420 others</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-secondary font-bold text-sm">2,500 SUI</Text>
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Prize Pot</Text>
                            </View>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-none mb-4 overflow-hidden">
                        <CardContent className="p-4 flex-row items-center gap-4">
                            <View className="w-14 h-14 rounded-xl bg-blue-500/20 items-center justify-center">
                                <Flame size={28} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-bold text-base mb-0.5">Morning Dash 2km</Text>
                                <Text className="text-muted-foreground text-xs mb-2">Daily stake-to-win</Text>
                                <View className="flex-row items-center">
                                    <View className="flex-row -space-x-2 mr-2">
                                        {[4, 5].map(i => (
                                            <View key={i} className="w-5 h-5 rounded-full border border-card bg-muted overflow-hidden">
                                                <Image source={{ uri: `https://i.pravatar.cc/100?u=${i}` }} className="w-full h-full" />
                                            </View>
                                        ))}
                                    </View>
                                    <Text className="text-muted-foreground text-[10px]">+128 others</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-blue-500 font-bold text-sm">800 SUI</Text>
                                <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Prize Pot</Text>
                            </View>
                        </CardContent>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Simple Trophy component if not available from lucide or to match the custom look
const Trophy = ({ size, color }: { size: number, color: string }) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.8, color }}>🏆</Text>
    </View>
);
