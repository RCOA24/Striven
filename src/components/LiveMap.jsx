import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to auto-center map when location changes
const RecenterAutomatically = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView(location, map.getZoom());
    }
  }, [location, map]);
  return null;
};

const LiveMap = ({ route, currentLocation }) => {
  // Default to a generic location if waiting for GPS (e.g., London) or show loading
  if (!currentLocation) return (
    <div className="h-full w-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 animate-pulse">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <span className="text-xs font-medium">Acquiring GPS...</span>
    </div>
  );

  return (
    <MapContainer 
      center={currentLocation} 
      zoom={16} 
      scrollWheelZoom={false} 
      zoomControl={false}
      className="h-full w-full z-0 bg-zinc-900"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark mode map tiles
      />
      <Polyline positions={route} color="#10b981" weight={5} opacity={0.8} />
      <Marker position={currentLocation} />
      <RecenterAutomatically location={currentLocation} />
    </MapContainer>
  );
};

export default LiveMap;
