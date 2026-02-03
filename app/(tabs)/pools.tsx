import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { ChevronLeft, Clock, Coins, HelpCircle, Plus, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PoolsScreen() {
    const [activeTab, setActiveTab] = useState('Global');

    const challenges = [
        {
            id: 1,
            title: '5km Sprint',
            pool: '5,000 SUI',
            participants: 128,
            timeLeft: '04h 22m',
            badge: 'LIVE NOW',
            badgeVariant: 'secondary',
            image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop',
        },
        {
            id: 2,
            title: 'Morning Cycling',
            pool: '12,500 SUI',
            participants: 85,
            timeLeft: '12h 05m',
            badge: 'POPULAR',
            badgeVariant: 'default',
            image: 'https://images.unsplash.com/photo-1541625602330-2277a1cd1f59?w=800&h=400&fit=crop',
        }
    ];

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-4 flex-row justify-between items-center">
                <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card">
                    <ChevronLeft size={24} color="#FFFFFF" />
                </Pressable>
                <Text className="text-foreground text-lg font-bold">Stake-to-Win</Text>
                <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-card">
                    <HelpCircle size={24} color="#FFFFFF" />
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <View className="mt-2 mb-6">
                    <View className="flex-row items-baseline gap-2 mb-4">
                        <Text className="text-primary text-4xl font-bold">Active</Text>
                        <Text className="text-muted-foreground text-2xl font-medium">Pools</Text>
                    </View>

                    {/* Segmented Control */}
                    <View className="flex-row bg-card p-1 rounded-xl mb-6">
                        {['Global', 'Friends'].map((tab) => (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className={cn(
                                    'flex-1 py-2.5 items-center justify-center rounded-lg',
                                    activeTab === tab ? 'bg-muted shadow-sm' : ''
                                )}
                            >
                                <Text className={cn(
                                    'text-sm font-semibold',
                                    activeTab === tab ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                    {tab}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Challenge Cards */}
                    {challenges.map((challenge) => (
                        <Card key={challenge.id} className="bg-card border-none mb-6 overflow-hidden">
                            <ImageBackground
                                source={{ uri: challenge.image }}
                                className="h-48 w-full"
                            >
                                <View className="absolute top-4 left-4">
                                    <Badge variant={challenge.badgeVariant as any} className="px-3 py-1">
                                        <Text className="text-[#0A0E12] text-[10px] font-bold">{challenge.badge}</Text>
                                    </Badge>
                                </View>
                                <View className="absolute inset-0 bg-black/20" />
                            </ImageBackground>

                            <CardContent className="p-5">
                                <View className="flex-row justify-between items-end">
                                    <View className="flex-1">
                                        <Text className="text-foreground text-xl font-bold mb-2">{challenge.title}</Text>
                                        <View className="flex-row items-center gap-1.5 mb-3">
                                            <Coins size={16} color="#00E5FF" />
                                            <Text className="text-primary font-bold">Pool: {challenge.pool}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-4">
                                            <View className="flex-row items-center gap-1">
                                                <Users size={14} color="#94A3B8" />
                                                <Text className="text-muted-foreground text-xs">{challenge.participants} Participants</Text>
                                            </View>
                                            <View className="flex-row items-center gap-1">
                                                <Clock size={14} color="#94A3B8" />
                                                <Text className="text-muted-foreground text-xs">{challenge.timeLeft} left</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <Button className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary">
                                        <Text className="text-[#0A0E12] font-bold">JOIN</Text>
                                    </Button>
                                </View>
                            </CardContent>
                        </Card>
                    ))}
                </View>
            </ScrollView>

            {/* FAB - Middle Action (as seen in some UIs) */}
            <View className="absolute bottom-6 left-1/2 -ml-8">
                <Pressable className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary items-center justify-center shadow-2xl shadow-primary/50 border-4 border-background">
                    <Plus size={32} color="#0A0E12" />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
