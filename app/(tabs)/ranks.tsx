import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RanksScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <View className="py-6">
                    <Text className="text-foreground text-3xl font-bold mb-2">Leaderboard</Text>
                    <Text className="text-muted-foreground text-base mb-6">Top performers this week</Text>

                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="bg-card border-none mb-4">
                            <CardContent className="p-4 flex-row items-center gap-4">
                                <Text className="text-primary font-bold text-lg w-6">#{i}</Text>
                                <View className="w-10 h-10 rounded-full bg-muted" />
                                <View className="flex-1">
                                    <Text className="text-foreground font-bold">User {i}</Text>
                                    <Text className="text-muted-foreground text-xs">245.5 km</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-secondary font-bold">4,200 pts</Text>
                                </View>
                            </CardContent>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
