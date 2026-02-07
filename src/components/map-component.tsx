"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LocationPoint } from "@/hooks/use-native-location";

// Fix for default marker icon in Leaflet with Next.js/Webpack
// though we use CircleMarker so might not need it, but good safety.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface MapComponentProps {
  location: LocationPoint | null;
  path: LocationPoint[];
}

function MapUpdater({ location }: { location: LocationPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], map.getZoom());
    }
  }, [location, map]);
  return null;
}

export default function MapComponent({ location, path }: MapComponentProps) {
  const center: [number, number] = location
    ? [location.latitude, location.longitude]
    : [37.7749, -122.4194]; // Default San Francisco

  const polylinePositions = path.map((p) => [p.latitude, p.longitude] as [number, number]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%", background: "#0A0E12" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {path.length > 1 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: "#00E5FF", weight: 6, opacity: 0.8 }}
        />
      )}

      {location && (
        <CircleMarker
          center={[location.latitude, location.longitude]}
          radius={8}
          pathOptions={{
            color: "#FFFFFF",
            fillColor: "#00E5FF",
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}

      <MapUpdater location={location} />
    </MapContainer>
  );
}
