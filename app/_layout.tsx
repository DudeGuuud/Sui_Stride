import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { LogBox, View } from 'react-native';
import 'react-native-reanimated';
import './global.css';

LogBox.ignoreLogs(['[Reanimated] Reading from `value` during component render']);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme('dark');
  }, [setColorScheme]);

  const customTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0A0E12',
      card: '#1A1F24',
      border: '#1A1F24',
      primary: '#00E5FF',
    },
  };

  return (
    <View className="flex-1 dark" style={{ backgroundColor: '#0A0E12' }}>
      <ThemeProvider value={customTheme}>
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0E12' },
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout/tracking" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </View >
  );
}
