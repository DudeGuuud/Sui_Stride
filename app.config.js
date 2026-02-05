console.log("Loading configuration...");
const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
console.log(`[Config] Google Maps API Key loaded: ${apiKey ? (apiKey.substr(0, 5) + '...') : 'FAILED - MISSING'}`);

export default {
    expo: {
        name: "SuiStride",
        slug: "suistride",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/logo.png",
        scheme: "suistride",
        userInterfaceStyle: "dark",
        backgroundColor: "#0A0E12",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.anonymous.suistride",
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "SuiStride needs access to your location to track your runs.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "SuiStride needs access to your location in the background to track your runs.",
                UIBackgroundModes: ["location", "fetch"]
            }
        },
        android: {
            package: "com.anonymous.suistride",
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/logo.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            config: {
                googleMaps: {
                    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
                }
            },
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION"
            ]
        },
        extra: {
            eas: {
                projectId: "b147dca0-b00b-4c91-9178-e4d2068abfd5"
            }
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    "image": "./assets/images/splash-icon.png",
                    "imageWidth": 200,
                    "resizeMode": "contain",
                    "backgroundColor": "#ffffff",
                    "dark": {
                        "backgroundColor": "#000000"
                    }
                }
            ],
            "expo-font",
            "expo-web-browser"
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: false
        }
    }
};
