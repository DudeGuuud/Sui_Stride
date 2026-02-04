import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { ChevronLeft, Chrome as Google, Lock, Mail, ShieldCheck, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';

export default function RegisterScreen() {
    const { signIn } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (provider: string) => {
        setIsLoading(true);
        // Mock network delay
        setTimeout(() => {
            signIn();
            // The root layout will handle the redirect when user state changes
        }, 1500);
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="px-6 py-4">
                    <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card border border-border/50">
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </Pressable>
                </View>

                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-1">
                        {/* Header */}
                        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8">
                            <Text className="text-foreground text-4xl font-black tracking-tight mb-2">Create Account</Text>
                            <Text className="text-muted-foreground text-base">Join the SuiStride community today</Text>
                        </Animated.View>

                        {/* Social Sign Up */}
                        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-8">
                            <Button 
                                variant="outline" 
                                className="w-full h-14 rounded-2xl border-border/50 bg-card/50 flex-row gap-3"
                                onPress={() => handleRegister('google')}
                                disabled={isLoading}
                            >
                                <Google size={20} color="#EA4335" />
                                <Text className="text-foreground font-bold">Sign up with Google</Text>
                            </Button>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400).springify()} className="flex-row items-center gap-4 mb-8">
                            <View className="flex-1 h-[1px] bg-border/30" />
                            <Text className="text-muted-foreground text-[10px] font-black uppercase">OR CONTINUE WITH EMAIL</Text>
                            <View className="flex-1 h-[1px] bg-border/30" />
                        </Animated.View>

                        {/* Traditional Form */}
                        <Animated.View entering={FadeInDown.delay(500).springify()} className="gap-5 mb-10">
                            <View className="bg-card border border-border/50 rounded-2xl px-5 py-4 flex-row items-center gap-4">
                                <User size={20} color="#94A3B8" />
                                <TextInput
                                    placeholder="Full Name"
                                    placeholderTextColor="#64748B"
                                    className="flex-1 text-foreground font-medium text-base"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading}
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
                                    editable={!isLoading}
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
                                    editable={!isLoading}
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
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(600).springify()}>
                            <Button
                                className="h-16 rounded-[24px] bg-primary shadow-xl shadow-primary/30 mb-8"
                                onPress={() => handleRegister('email')}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#0A0E12" />
                                ) : (
                                    <Text className="text-[#0A0E12] text-lg font-black uppercase tracking-tight">Create Account</Text>
                                )}
                            </Button>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(700).springify()} className="flex-row justify-center gap-2 mb-10">
                            <Text className="text-muted-foreground text-sm">Already have an account?</Text>
                            <Pressable onPress={() => router.push('/auth/login' as any)} disabled={isLoading}>
                                <Text className="text-primary text-sm font-bold">Login</Text>
                            </Pressable>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
