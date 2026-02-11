import React, { useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useLocationTracking } from './hooks/use-location-tracking';

// Use environment variable with EXPO_PUBLIC_ prefix for Expo
const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'http://localhost:3000';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const { location } = useLocationTracking(true);

  // Send GPS data to Web
  useEffect(() => {
    if (location && webViewRef.current) {
      const script = `
        window.postMessage(${JSON.stringify({
        type: 'LOCATION_UPDATE',
        payload: location,
      })}, '*');
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [location]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'WEB_READY') {
        console.log('Web App Ready');
      }

      if (data.type === 'HAPTICS_IMPACT') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // Ignore non-JSON messages
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={handleError}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 ReactNativeWebView"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});