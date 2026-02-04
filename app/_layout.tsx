import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import 'react-native-reanimated';
import './global.css';
import { AuthProvider, useAuth } from '@/context/auth';

LogBox.ignoreLogs(['[Reanimated] Reading from `value` during component render']);

export const unstable_settings = {
  anchor: '(tabs)',
};

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { setColorScheme } = useColorScheme();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    setColorScheme('dark');
  }, [setColorScheme]);

  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsNavigationReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if the user is not signed in
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to the tabs page if the user is signed in
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, isNavigationReady]);

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
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="workout/tracking" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </View >
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
