import { Card, CardContent } from '@/components/ui/card';
import { router } from 'expo-router';
import { Bell, ChevronLeft, Flame, TrendingUp, Trophy } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center gap-4">
                <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card">
                    <ChevronLeft size={24} color="#FFFFFF" />
                </Pressable>
                <Text className="text-foreground text-xl font-bold">Notifications</Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <View className="gap-8 mt-4">
                    <View>
                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Activity</Text>
                        <View className="gap-3">
                            <Card className="bg-card border-none">
                                <CardContent className="p-4 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <Flame size={20} color="#FF8A65" />
                                        <View>
                                            <Text className="text-foreground font-bold">Daily Reminders</Text>
                                            <Text className="text-muted-foreground text-[10px]">Never miss a morning run</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: '#1A1F24', true: '#00E5FF33' }}
                                        thumbColor={true ? '#00E5FF' : '#94A3B8'}
                                        value={true}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-none">
                                <CardContent className="p-4 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <TrendingUp size={20} color="#00E5FF" />
                                        <View>
                                            <Text className="text-foreground font-bold">Progress Reports</Text>
                                            <Text className="text-muted-foreground text-[10px]">Weekly summary of your gains</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: '#1A1F24', true: '#00E5FF33' }}
                                        thumbColor={true ? '#00E5FF' : '#94A3B8'}
                                        value={true}
                                    />
                                </CardContent>
                            </Card>
                        </View>
                    </View>

                    <View>
                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Governance & Staking</Text>
                        <View className="gap-3">
                            <Card className="bg-card border-none">
                                <CardContent className="p-4 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <Trophy size={20} color="#1DE9B6" />
                                        <View>
                                            <Text className="text-foreground font-bold">Pool Results</Text>
                                            <Text className="text-muted-foreground text-[10px]">Outcome of your staked challenges</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: '#1A1F24', true: '#00E5FF33' }}
                                        thumbColor={true ? '#00E5FF' : '#94A3B8'}
                                        value={true}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-none">
                                <CardContent className="p-4 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <Bell size={20} color="#7986CB" />
                                        <View>
                                            <Text className="text-foreground font-bold">System Alerts</Text>
                                            <Text className="text-muted-foreground text-[10px]">Important network updates</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: '#1A1F24', true: '#00E5FF33' }}
                                        thumbColor={false ? '#00E5FF' : '#94A3B8'}
                                        value={false}
                                    />
                                </CardContent>
                            </Card>
                        </View>
                    </View>
                </View>
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
