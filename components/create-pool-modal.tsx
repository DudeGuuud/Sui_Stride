import { cn } from '@/lib/utils';
import { Activity as ActivityIcon, ChevronRight, Coins, Trophy, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface CreatePoolModalProps {
    isVisible: boolean;
    onClose: () => void;
}

export function CreatePoolModal({ isVisible, onClose }: CreatePoolModalProps) {
    const [title, setTitle] = useState('');
    const [stake, setStake] = useState('');
    const [activity, setActivity] = useState('Run');
    const [participants, setParticipants] = useState('10');

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/60">
                <Pressable
                    className="absolute inset-0"
                    onPress={onClose}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="w-full"
                >
                    <View className="bg-card rounded-t-[32px] border-t border-border p-6 pb-12 shadow-2xl">
                        {/* Handle */}
                        <View className="w-12 h-1.5 bg-muted rounded-full self-center mb-6 opacity-50" />

                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-foreground text-2xl font-black tracking-tight">Create Pool</Text>
                                <Text className="text-muted-foreground text-sm">Start a new stake-to-win challenge</Text>
                            </View>
                            <Pressable
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-background items-center justify-center border border-border"
                            >
                                <X size={20} color="#FFFFFF" />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60vh]">
                            <View className="gap-6">
                                {/* Title Input */}
                                <View>
                                    <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3 px-1">Challenge Title</Text>
                                    <View className="bg-background border border-border/50 rounded-2xl px-4 py-3">
                                        <TextInput
                                            placeholder="e.g. San Fran Speedrun"
                                            placeholderTextColor="#64748B"
                                            className="text-foreground font-medium text-base"
                                            value={title}
                                            onChangeText={setTitle}
                                        />
                                    </View>
                                </View>

                                {/* Activity Type Toggle */}
                                <View>
                                    <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3 px-1">Select Activity</Text>
                                    <View className="flex-row gap-3">
                                        {['Run', 'Cycle'].map((type) => (
                                            <Pressable
                                                key={type}
                                                onPress={() => setActivity(type)}
                                                className={cn(
                                                    "flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border",
                                                    activity === type
                                                        ? "bg-primary/10 border-primary"
                                                        : "bg-background border-border"
                                                )}
                                            >
                                                <ActivityIcon size={18} color={activity === type ? "#00E5FF" : "#94A3B8"} />
                                                <Text className={cn(
                                                    "font-bold",
                                                    activity === type ? "text-primary" : "text-muted-foreground"
                                                )}>{type}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                <View className="flex-row gap-4">
                                    {/* Stake Amount */}
                                    <View className="flex-1">
                                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3 px-1">Stake (SUI)</Text>
                                        <View className="bg-background border border-border/50 rounded-2xl px-4 py-3 flex-row items-center gap-2">
                                            <Coins size={16} color="#00E5FF" />
                                            <TextInput
                                                placeholder="0.00"
                                                placeholderTextColor="#64748B"
                                                keyboardType="numeric"
                                                className="flex-1 text-foreground font-bold text-base"
                                                value={stake}
                                                onChangeText={setStake}
                                            />
                                        </View>
                                    </View>

                                    {/* Max Participants */}
                                    <View className="flex-1">
                                        <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3 px-1">Max Players</Text>
                                        <View className="bg-background border border-border/50 rounded-2xl px-4 py-3 flex-row items-center gap-2">
                                            <Users size={16} color="#94A3B8" />
                                            <TextInput
                                                placeholder="10"
                                                placeholderTextColor="#64748B"
                                                keyboardType="numeric"
                                                className="flex-1 text-foreground font-bold text-base"
                                                value={participants}
                                                onChangeText={setParticipants}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Summary Card */}
                                <Card className="bg-primary/5 border-dashed border-primary/30 mt-2">
                                    <CardContent className="p-4 flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-3">
                                            <Trophy size={24} color="#00E5FF" />
                                            <View>
                                                <Text className="text-foreground text-xs font-bold">Estimated Prize Pool</Text>
                                                <Text className="text-primary text-lg font-black">{Number(stake) * Number(participants) || 0} SUI</Text>
                                            </View>
                                        </View>
                                        <ChevronRight size={16} color="#00E5FF" />
                                    </CardContent>
                                </Card>
                            </View>
                        </ScrollView>

                        <Button
                            className="h-16 rounded-[24px] bg-primary mt-8 shadow-xl shadow-primary/20"
                            onPress={onClose}
                        >
                            <Text className="text-[#0A0E12] text-lg font-black uppercase tracking-tight">Create & Stake</Text>
                        </Button>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
