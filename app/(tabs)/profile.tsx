import { Card, CardContent } from '@/components/ui/card';
import { router } from 'expo-router';
import { Bell, ChevronRight, CreditCard, Shield } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <View className="items-center py-8">
                    <View className="w-24 h-24 rounded-full bg-muted mb-4 overflow-hidden border-2 border-primary">
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                            className="w-full h-full"
                        />
                    </View>
                    <Text className="text-foreground text-2xl font-bold">Alex Stride</Text>
                    <Text className="text-muted-foreground text-sm font-medium">0x...A123</Text>
                </View>

                <View className="gap-4">
                    <Pressable onPress={() => router.push('/settings/security' as any)}>
                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center gap-4">
                                <Shield size={20} color="#00E5FF" />
                                <Text className="text-foreground font-medium flex-1">Security & Privacy</Text>
                                <ChevronRight size={16} color="#94A3B8" />
                            </CardContent>
                        </Card>
                    </Pressable>

                    <Pressable onPress={() => router.push('/settings/wallet' as any)}>
                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center gap-4">
                                <CreditCard size={20} color="#00E5FF" />
                                <Text className="text-foreground font-medium flex-1">Wallet Management</Text>
                                <ChevronRight size={16} color="#94A3B8" />
                            </CardContent>
                        </Card>
                    </Pressable>

                    <Pressable onPress={() => router.push('/settings/notifications' as any)}>
                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center gap-4">
                                <Bell size={20} color="#00E5FF" />
                                <Text className="text-foreground font-medium flex-1">Notifications</Text>
                                <ChevronRight size={16} color="#94A3B8" />
                            </CardContent>
                        </Card>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
