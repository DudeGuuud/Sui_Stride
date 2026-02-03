import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { ChevronLeft, Lock, Mail, ShieldCheck, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="px-6 py-4">
                    <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card">
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </Pressable>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="mb-10">
                        <Text className="text-foreground text-4xl font-black tracking-tight mb-2">Create Account</Text>
                        <Text className="text-muted-foreground text-base">Join the SuiStride community today</Text>
                    </View>

                    {/* Traditional Form */}
                    <View className="gap-5 mb-10">
                        <View className="bg-card border border-border/50 rounded-2xl px-5 py-4 flex-row items-center gap-4">
                            <User size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor="#64748B"
                                className="flex-1 text-foreground font-medium text-base"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        <View className="bg-card border border-border/50 rounded-2xl px-5 py-4 flex-row items-center gap-4">
                            <Mail size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Email Address"
                                placeholderTextColor="#64748B"
                                className="flex-1 text-foreground font-medium text-base"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <View className="bg-card border border-border/50 rounded-2xl px-5 py-4 flex-row items-center gap-4">
                            <Lock size={20} color="#94A3B8" />
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor="#64748B"
                                className="flex-1 text-foreground font-medium text-base"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View className="flex-row items-start gap-3 px-1">
                            <View className="mt-0.5">
                                <ShieldCheck size={16} color="#1DE9B6" />
                            </View>
                            <Text className="flex-1 text-muted-foreground text-xs leading-4">
                                By signing up, you agree to our <Text className="text-primary font-bold">Terms of Service</Text> and <Text className="text-primary font-bold">Privacy Policy</Text>.
                            </Text>
                        </View>
                    </View>

                    <Button
                        className="h-16 rounded-[24px] bg-primary shadow-xl shadow-primary/30 mb-8"
                        onPress={() => router.replace('/(tabs)' as any)}
                    >
                        <Text className="text-[#0A0E12] text-lg font-black uppercase tracking-tight">Create Account</Text>
                    </Button>

                    <View className="flex-row justify-center gap-2 mb-10">
                        <Text className="text-muted-foreground text-sm">Already have an account?</Text>
                        <Pressable onPress={() => router.push('/auth/login' as any)}>
                            <Text className="text-primary text-sm font-bold">Login</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
