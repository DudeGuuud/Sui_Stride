import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { Github, Chrome as Google, Lock, Mail, Smartphone as Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (provider: string) => {
        setIsLoading(true);
        // Mock network delay for effect
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
                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-1">
                        {/* Logo & Branding */}
                        <View className="items-center mt-12 mb-10">
                            <Animated.View 
                                entering={FadeInDown.delay(200).springify()}
                                className="w-24 h-24 rounded-[28px] bg-card items-center justify-center overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10"
                            >
                                <Image
                                    source={require('@/assets/images/logo.png')}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </Animated.View>
                            <Animated.Text entering={FadeInDown.delay(300).springify()} className="text-foreground text-3xl font-black mt-6 tracking-tight">
                                SuiStride
                            </Animated.Text>
                            <Animated.Text entering={FadeInDown.delay(400).springify()} className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-[3px]">
                                Next-Gen Fitness
                            </Animated.Text>
                        </View>

                        {/* Social / zkLogin Section */}
                        <Animated.View entering={FadeInDown.delay(500).springify()} className="mb-8">
                            <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest text-center mb-6">Log in with zkLogin</Text>
                            <View className="flex-row gap-4 mb-4">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-14 rounded-2xl border-border/50 bg-card/50 flex-row gap-3"
                                    onPress={() => handleLogin('google')}
                                    disabled={isLoading}
                                >
                                    <Google size={20} color="#EA4335" />
                                    <Text className="text-foreground font-bold">Google</Text>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-14 rounded-2xl border-border/50 bg-card/50 flex-row gap-3"
                                    disabled={isLoading}
                                >
                                    <Github size={20} color={Platform.OS === 'ios' ? "#FFFFFF" : "#000000"} />
                                    <Text className="text-foreground font-bold">Github</Text>
                                </Button>
                            </View>
                            <Button
                                variant="outline"
                                className="w-full h-14 rounded-2xl border-primary/30 bg-primary/5 flex-row gap-3 mb-6"
                                onPress={() => handleLogin('sui')}
                                disabled={isLoading}
                            >
                                <Wallet size={20} color="#00E5FF" />
                                <Text className="text-primary font-bold">Connect Sui Wallet</Text>
                            </Button>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(600).springify()} className="flex-row items-center gap-4 mb-8">
                            <View className="flex-1 h-[1px] bg-border/30" />
                            <Text className="text-muted-foreground text-[10px] font-black uppercase">OR</Text>
                            <View className="flex-1 h-[1px] bg-border/30" />
                        </Animated.View>

                        {/* Traditional Form */}
                        <Animated.View entering={FadeInDown.delay(700).springify()} className="gap-4 mb-8">
                            <View className="bg-card border border-border/50 rounded-2xl px-4 py-3 flex-row items-center gap-3">
                                <Mail size={18} color="#94A3B8" />
                                <TextInput
                                    placeholder="Email Address"
                                    placeholderTextColor="#64748B"
                                    className="flex-1 text-foreground font-medium py-1"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>
                            <View className="bg-card border border-border/50 rounded-2xl px-4 py-3 flex-row items-center gap-3">
                                <Lock size={18} color="#94A3B8" />
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="#64748B"
                                    className="flex-1 text-foreground font-medium py-1"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                            </View>
                            <Pressable className="items-end" disabled={isLoading}>
                                <Text className="text-primary text-xs font-bold">Forgot Password?</Text>
                            </Pressable>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(800).springify()}>
                            <Button
                                className="h-16 rounded-[24px] bg-primary shadow-xl shadow-primary/30 mb-8"
                                onPress={() => handleLogin('email')}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#0A0E12" />
                                ) : (
                                    <Text className="text-[#0A0E12] text-lg font-black uppercase tracking-tight">Login</Text>
                                )}
                            </Button>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(900).springify()} className="flex-row justify-center gap-2 mb-10">
                            <Text className="text-muted-foreground text-sm">Don't have an account?</Text>
                            <Pressable onPress={() => router.push('/auth/register' as any)} disabled={isLoading}>
                                <Text className="text-primary text-sm font-bold">Sign Up</Text>
                            </Pressable>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
