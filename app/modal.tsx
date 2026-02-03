import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function ModalScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-foreground text-2xl font-bold mb-4">Modal</Text>
            <Pressable onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-xl">
                <Text className="text-background font-bold">Close</Text>
            </Pressable>
        </View>
    );
}
