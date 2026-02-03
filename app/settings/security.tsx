import { Card, CardContent } from '@/components/ui/card';
import { router } from 'expo-router';
import { ChevronLeft, Eye, Fingerprint, Lock, Shield } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center gap-4">
                <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card">
                    <ChevronLeft size={24} color="#FFFFFF" />
                </Pressable>
                <Text className="text-foreground text-xl font-bold">Security & Privacy</Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <View className="gap-6 mt-4">
                    <View>
                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Privacy</Text>
                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <Eye size={20} color="#00E5FF" />
                                    <Text className="text-foreground font-medium">Public Profile</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#1A1F24', true: '#00E5FF33' }}
                                    thumbColor={true ? '#00E5FF' : '#94A3B8'}
                                    value={true}
                                />
                            </CardContent>
                        </Card>
                    </View>

                    <View>
                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Security</Text>
                        <View className="gap-3">
                            <Card className="bg-card border-none">
                                <CardContent className="p-4 flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-3">
                                        <Fingerprint size={20} color="#00E5FF" />
                                        <Text className="text-foreground font-medium">Biometric Login</Text>
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
                                        <Shield size={20} color="#00E5FF" />
                                        <Text className="text-foreground font-medium">Two-Factor Auth</Text>
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

                    <View>
                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Account</Text>
                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <Lock size={20} color="#FF8A65" />
                                    <Text className="text-foreground font-medium">Change Password</Text>
                                </View>
                                <ChevronLeft size={16} color="#94A3B8" style={{ transform: [{ rotate: '180deg' }] }} />
                            </CardContent>
                        </Card>
                    </View>
                </View>
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
