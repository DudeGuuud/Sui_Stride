import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useLocationTracking } from './hooks/use-location-tracking';

// Use environment variable with EXPO_PUBLIC_ prefix for Expo
const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'http://localhost:3000';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const { location } = useLocationTracking(true);
  const nativeRedirectUrl = useMemo(() => {
    // Generate the dynamic redirect URL (exp:// in Dev, suistride:// in Prod)
    const url = Linking.createURL('auth-callback');
    console.log("Native Redirect URL:", url);
    return url;
  }, []);

  // Send GPS data to Web
  useEffect(() => {
    if (location && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'LOCATION_UPDATE',
        payload: location,
      }));
    }
  }, [location]);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // Web App requests the redirect URL on mount
      if (data.type === 'GET_REDIRECT_URL' || data.type === 'WEB_READY') {
        console.log('Web requested Redirect URL / Ready');
        if (nativeRedirectUrl) {
           webViewRef.current?.postMessage(JSON.stringify({
             type: 'SET_REDIRECT_URL',
             url: nativeRedirectUrl
           }));
        }
        
        // Proactively send current location if available
        if (location) {
          console.log('Pushing initial location to Web');
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'LOCATION_UPDATE',
            payload: location,
          }));
        }
      }

      if (data.type === 'HAPTICS_IMPACT') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (data.type === 'OPEN_AUTH') {
        const { url } = data;
        
        // Use the dynamic URL we generated. This ensures WebBrowser closes automatically.
        const redirectUrl = nativeRedirectUrl || Linking.createURL('auth-callback');
        
        console.log("Opening Auth Session in System Browser:", url);
        console.log("Expecting Redirect to:", redirectUrl);

        // Open System Browser
        const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          console.log("Auth Success, Redirected Back:", result.url);
          // Send the full callback URL back to the WebView to parse
          webViewRef.current?.postMessage(JSON.stringify({
             type: 'AUTH_RESULT',
             url: result.url
          }));
        } else {
          console.log("Auth Cancelled or Failed", result.type);
        }
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
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        showsVerticalScrollIndicator={false}
        // Injected JS to announce readiness
        injectedJavaScript={`
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEB_READY' }));
          true;
        `}
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