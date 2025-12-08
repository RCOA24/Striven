import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Custom Icons for Start (Green) and End (Red) ---
const createPinIcon = (color) => L.divIcon({
  className: 'custom-pin',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const startIcon = createPinIcon('#10b981'); // Emerald-500 (Start)
const endIcon = createPinIcon('#ef4444');   // Red-500 (End)

// Component to auto-center map
const MapController = ({ location, route }) => {
  const map = useMap();
  
  useEffect(() => {
    // Mode 1: Live Tracking (Follow User)
    if (location) {
      map.setView(location, map.getZoom() || 16, { animate: true });
    }
    // Mode 2: View History (Fit Route)
    else if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [location, route, map]);
  
  return null;
};

const LiveMap = ({ route, currentLocation, readOnly = false, startName, endName, locationError }) => {
  const [startLocation, setStartLocation] = useState(startName || null);
  const [endLocation, setEndLocation] = useState(endName || null);

  // Update state if props change (e.g. opening different activities)
  useEffect(() => {
    if (startName) setStartLocation(startName);
    if (endName) setEndLocation(endName);
  }, [startName, endName]);

  // Fetch location names (Reverse Geocoding) - FALLBACK for old data
  useEffect(() => {
    if (readOnly && route && route.length > 0 && !startLocation) {
      const getAddress = async (lat, lng) => {
        try {
          // Using OpenStreetMap Nominatim API
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`);
          const data = await res.json();
          const addr = data.address;
          // Try to find the most relevant city/town name
          return addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || "Unknown Location";
        } catch (err) {
          console.error("Geocoding failed", err);
          return null;
        }
      };

      const fetchLocations = async () => {
        // Fetch Start Point
        const start = await getAddress(route[0][0], route[0][1]);
        if (start) setStartLocation(start);

        // Fetch End Point
        const last = route[route.length - 1];
        const end = await getAddress(last[0], last[1]);
        if (end) setEndLocation(end);
      };

      fetchLocations();
    }
  }, [readOnly, route, startLocation]);

  // --- MOVED HOOKS UP TO PREVENT REACT ERROR #310 ---
  // Determine center (fallback to route start or 0,0)
  const initialCenter = currentLocation || (route && route.length > 0 ? route[0] : [0,0]);

  // Force re-render on Android when map is ready to prevent grey tiles
  // FIXED: Stable key for live mode to prevent remounting on every location update
  const mapKey = useMemo(() => {
     if (readOnly) return `map-readonly-${route?.[0]?.[0] || 0}`;
     return `map-live-session`; 
  }, [readOnly, route]);

  // --- CONDITIONAL RENDERS AFTER HOOKS ---

  // If readOnly (history view) and no route, show error
  if (readOnly && (!route || route.length === 0)) {
    return (
      <div className="h-full w-full bg-zinc-900 flex items-center justify-center text-zinc-500">
        <span className="text-xs">No GPS data available</span>
      </div>
    );
  }

  // If live mode and no location yet
  if (!readOnly && !currentLocation) return (
    <div className="h-full w-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 text-center px-4">
      {locationError ? (
        <>
          <div className="text-sm font-bold mb-1">Location unavailable</div>
          <div className="text-[11px] leading-snug">
            {locationError}. Ensure permissions are granted and you are on HTTPS/localhost.
          </div>
        </>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-xs font-medium">Acquiring GPS...</span>
        </>
      )}
    </div>
  );

  return (
    <MapContainer 
      key={mapKey}
      center={initialCenter} 
      zoom={16} 
      scrollWheelZoom={false} 
      zoomControl={false}
      className="h-full w-full z-0 bg-zinc-900"
      dragging={true} // Allow dragging to inspect route
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* The Route Line */}
      {route && <Polyline positions={route} color="#10b981" weight={5} opacity={0.8} />}
      
      {/* Current Position Marker (Only in Live Mode) */}
      {currentLocation && !readOnly && <Marker position={currentLocation} />}

      {/* Start Marker (Visible in Live Mode if we have a route) */}
      {!readOnly && route && route.length > 0 && (
        <Marker position={route[0]} icon={startIcon} opacity={0.7} />
      )}

      {/* Start/End Markers (Only in ReadOnly Mode) */}
      {readOnly && route && route.length > 0 && (
        <>
          <Marker position={route[0]} icon={startIcon}>
            <Popup className="font-sans">
              <div className="text-center min-w-[100px]">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Start</div>
                <div className="text-sm font-bold text-emerald-600">{startLocation || 'Loading...'}</div>
              </div>
            </Popup>
          </Marker>
          
          <Marker position={route[route.length - 1]} icon={endIcon}>
            <Popup className="font-sans">
              <div className="text-center min-w-[100px]">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Finish</div>
                <div className="text-sm font-bold text-red-600">{endLocation || 'Loading...'}</div>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      <MapController location={currentLocation} route={route} />
    </MapContainer>
  );
};

export default LiveMap;
