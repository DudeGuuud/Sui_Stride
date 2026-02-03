import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from 'expo-router';
import { CheckCircle2, ChevronLeft, Copy, Plus, Wallet } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletManagementScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-6 py-4 flex-row items-center gap-4">
                <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card">
                    <ChevronLeft size={24} color="#FFFFFF" />
                </Pressable>
                <Text className="text-foreground text-xl font-bold">Wallet Management</Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <View className="mt-4 mb-8">
                    <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Active Wallet</Text>
                    <Card className="bg-card border-none overflow-hidden">
                        <CardContent className="p-6">
                            <View className="flex-row justify-between items-start mb-6">
                                <View className="bg-primary/20 p-3 rounded-2xl">
                                    <Wallet size={32} color="#00E5FF" />
                                </View>
                                <View className="bg-secondary/20 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                                    <View className="w-2 h-2 rounded-full bg-secondary" />
                                    <Text className="text-secondary text-[10px] font-bold uppercase">Mainnet</Text>
                                </View>
                            </View>

                            <View className="mb-6">
                                <Text className="text-muted-foreground text-xs mb-1 font-medium">Wallet Address</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-foreground text-lg font-mono font-bold">0x7a...d912</Text>
                                    <Pressable className="p-2 bg-muted/30 rounded-lg">
                                        <Copy size={16} color="#94A3B8" />
                                    </Pressable>
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <Button className="flex-1 bg-primary/10 border border-primary/20 rounded-xl h-12">
                                    <Text className="text-primary font-bold">View Explorer</Text>
                                </Button>
                                <Button className="flex-1 bg-primary border-none rounded-xl h-12">
                                    <Text className="text-[#0A0E12] font-bold">Manage</Text>
                                </Button>
                            </View>
                        </CardContent>
                        <View className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                    </Card>
                </View>

                <View className="mb-8">
                    <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-4">Connected Methods</Text>
                    <View className="gap-3">
                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center gap-4">
                                <View className="w-10 h-10 rounded-xl bg-orange-500/10 items-center justify-center">
                                    <Image source={{ uri: 'https://cdn.iconscout.com/icon/free/png-256/free-google-1772223-1507807.png' }} className="w-6 h-6" resizeMode="contain" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-foreground font-bold">Google zkLogin</Text>
                                    <Text className="text-muted-foreground text-[10px]">Connected via alex***@gmail.com</Text>
                                </View>
                                <CheckCircle2 size={20} color="#1DE9B6" />
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-none">
                            <CardContent className="p-4 flex-row items-center gap-4">
                                <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
                                    <Text className="text-blue-500 font-bold">S</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-foreground font-bold">Sui Wallet</Text>
                                    <Text className="text-muted-foreground text-[10px]">Extension / Mobile App</Text>
                                </View>
                                <CheckCircle2 size={20} color="#1DE9B6" />
                            </CardContent>
                        </Card>
                    </View>
                </View>

                <Button variant="outline" className="w-full h-16 rounded-2xl border-dashed border-border/50 flex-row gap-3">
                    <Plus size={20} color="#94A3B8" />
                    <Text className="text-muted-foreground font-bold">Connect Another Wallet</Text>
                </Button>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
