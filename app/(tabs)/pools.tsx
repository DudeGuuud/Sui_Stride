import { CreatePoolModal } from '@/components/create-pool-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { Activity as ActivityIcon, ChevronLeft, Clock, Coins, HelpCircle, Plus, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PoolsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Global');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

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

    const friendChallenges = [
        {
            id: 1,
            friend: 'David',
            avatar: 'https://i.pravatar.cc/150?u=david',
            title: '1v1 Speed Run',
            pool: '100 SUI',
            timeLeft: '02h 15m',
            status: 'PENDING'
        },
        {
            id: 2,
            friend: 'Sarah',
            avatar: 'https://i.pravatar.cc/150?u=sarah',
            title: 'Weekend Warrior',
            pool: '500 SUI',
            timeLeft: '1d 12h',
            status: 'ACTIVE'
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
                    {activeTab === 'Global' ? challenges.map((challenge) => (
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
                    )) : (
                        <View className="gap-6">
                            {/* Friends Stats Header */}
                            <View className="flex-row gap-4 mb-2">
                                <Card className="flex-1 bg-card border-none">
                                    <CardContent className="p-4 items-center">
                                        <Text className="text-secondary font-black text-xl">12</Text>
                                        <Text className="text-muted-foreground text-[8px] uppercase font-bold tracking-widest">Active Battles</Text>
                                    </CardContent>
                                </Card>
                                <Card className="flex-1 bg-card border-none">
                                    <CardContent className="p-4 items-center">
                                        <Text className="text-primary font-black text-xl">450</Text>
                                        <Text className="text-muted-foreground text-[8px] uppercase font-bold tracking-widest">SUI Won</Text>
                                    </CardContent>
                                </Card>
                            </View>

                            <View className="flex-row justify-between items-center px-1">
                                <Text className="text-foreground font-bold">Pending Invitations</Text>
                                <Badge variant="secondary" className="bg-primary/10 px-2 py-0.5 border-none">
                                    <Text className="text-primary text-[10px] font-bold">3 NEW</Text>
                                </Badge>
                            </View>

                            {friendChallenges.map((challenge) => (
                                <Card key={challenge.id} className="bg-card border-none overflow-hidden">
                                    <CardContent className="p-0">
                                        <View className="p-4 flex-row items-center gap-4">
                                            <View className="relative">
                                                <View className="w-14 h-14 rounded-full bg-muted overflow-hidden border-2 border-primary/20">
                                                    <Image source={{ uri: challenge.avatar }} className="w-full h-full" />
                                                </View>
                                                <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                                                    {challenge.status === 'ACTIVE' ? (
                                                        <ActivityIcon size={12} color="#1DE9B6" />
                                                    ) : (
                                                        <Clock size={12} color="#94A3B8" />
                                                    )}
                                                </View>
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-2 mb-1">
                                                    <Text className="text-foreground text-lg font-bold">{challenge.title}</Text>
                                                </View>
                                                <View className="flex-row items-center gap-2">
                                                    <Text className="text-muted-foreground text-xs font-medium">with {challenge.friend}</Text>
                                                    <View className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                    <View className="flex-row items-center gap-1">
                                                        <Coins size={12} color="#00E5FF" />
                                                        <Text className="text-primary text-[10px] font-black">{challenge.pool}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        <View className="h-[1px] bg-border/30 w-full" />

                                        <View className="p-3 bg-muted/20 flex-row justify-between items-center">
                                            <View className="flex-row items-center gap-2">
                                                <Clock size={12} color="#94A3B8" />
                                                <Text className="text-muted-foreground text-[10px]">{challenge.timeLeft} remaining</Text>
                                            </View>
                                            <Button size="sm" className={cn(
                                                "h-8 px-4 rounded-lg",
                                                challenge.status === 'ACTIVE' ? "bg-primary" : "bg-card border border-border"
                                            )}>
                                                <Text className={cn(
                                                    "text-xs font-bold",
                                                    challenge.status === 'ACTIVE' ? "text-[#0A0E12]" : "text-foreground"
                                                )}>
                                                    {challenge.status === 'ACTIVE' ? 'VIEW PROGRESS' : 'ACCEPT'}
                                                </Text>
                                            </Button>
                                        </View>
                                    </CardContent>
                                </Card>
                            ))}

                            <Pressable
                                onPress={() => setIsCreateModalVisible(true)}
                                className="p-8 rounded-3xl border-2 border-dashed border-border/50 items-center justify-center gap-3 bg-card/10"
                            >
                                <View className="w-12 h-12 rounded-full bg-muted/30 items-center justify-center">
                                    <Users size={24} color="#94A3B8" />
                                </View>
                                <View className="items-center">
                                    <Text className="text-foreground font-bold">Start 1v1 Battle</Text>
                                    <Text className="text-muted-foreground text-xs text-center mt-1">Challenge a friend to a custom{'\n'}stake-to-win run</Text>
                                </View>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FAB - Middle Action (as seen in some UIs) */}
            <View className="absolute bottom-6 left-1/2 -ml-8">
                <Pressable
                    onPress={() => setIsCreateModalVisible(true)}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary items-center justify-center shadow-2xl shadow-primary/50 border-4 border-background"
                >
                    <Plus size={32} color="#FFFFFF" />
                </Pressable>
            </View>

            <CreatePoolModal
                isVisible={isCreateModalVisible}
                onClose={() => setIsCreateModalVisible(false)}
            />
        </SafeAreaView>
    );
}
