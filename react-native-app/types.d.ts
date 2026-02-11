declare module 'react-native-geolocation-service' {
  export interface GeoPosition {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface GeoError {
    code: number;
    message: string;
    PERMISSION_DENIED: number;
    POSITION_UNAVAILABLE: number;
    TIMEOUT: number;
  }

  export interface GeoOptions {
    timeout?: number;
    maximumAge?: number;
    enableHighAccuracy?: boolean;
    distanceFilter?: number;
    showLocationDialog?: boolean;
    forceRequestLocation?: boolean;
    fastestInterval?: number;
    interval?: number;
  }

  export function requestAuthorization(authorizationLevel: "whenInUse" | "always" | "auto"): Promise<"granted" | "denied" | "restricted" | "disabled">;
  export function getCurrentPosition(successCallback: (position: GeoPosition) => void, errorCallback?: (error: GeoError) => void, options?: GeoOptions): void;
  export function watchPosition(successCallback: (position: GeoPosition) => void, errorCallback?: (error: GeoError) => void, options?: GeoOptions): number;
  export function clearWatch(watchID: number): void;
  export function stopObserving(): void;
}
