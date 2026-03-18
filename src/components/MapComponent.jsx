import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBuses } from '../context/BusesContext';

// Fix typical Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const busIcon = new L.DivIcon({
    className: 'custom-bus-icon',
    html: `<div style="background: var(--primary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px var(--primary); border: 2px solid white; transform: translate(-50%, -50%);">🚌</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const stationIcon = new L.DivIcon({
    className: 'custom-station-icon',
    html: `<div style="background: var(--accent); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); transform: translate(-50%, -50%);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const userIcon = new L.DivIcon({
    className: 'custom-user-icon',
    html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #3b82f6; border: 3px solid white; transform: translate(-50%, -50%);"><div style="background: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Haversine distance
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const center = [28.6865, 77.5533]; // Default Sanskar College coordinate

// Component to dynamically fit bounds if route changes
function SetBounds({ route }) {
    const map = useMap();
    useEffect(() => {
        if (route && route.waypoints && route.waypoints.length > 0) {
            const bounds = L.latLngBounds(route.waypoints.map(wp => [wp.lat, wp.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, map]);
    return null;
}

const MapComponent = ({ selectedRouteId }) => {
    const { routes, activeBuses, drivers } = useBuses();
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error("Error watching user location:", error),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    const displayRoutes = selectedRouteId === 'all'
        ? routes
        : routes.filter(r => r.id === selectedRouteId);

    // Group active buses by route
    const activeBusesList = Object.entries(activeBuses).map(([driverId, data]) => {
        const driver = drivers.find(d => d.id === driverId);
        return { driverId, driver, ...data };
    });

    return (
        <div style={{ height: '600px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {displayRoutes.map((route) => {
                    if (!route.waypoints || route.waypoints.length === 0) return null;

                    const positions = route.waypoints.map(wp => [wp.lat, wp.lng]);

                    return (
                        <React.Fragment key={route.id}>
                            {/* Route Path */}
                            <Polyline positions={positions} color="var(--primary)" weight={4} opacity={0.7} dashArray="10, 10" />

                            {/* Waypoints / Stations */}
                            {route.waypoints.map((wp, idx) => (
                                <Marker key={`${route.id}-wp-${idx}`} position={[wp.lat, wp.lng]} icon={stationIcon}>
                                    <Popup>
                                        <div style={{ color: 'var(--bg-dark)' }}>
                                            <strong>{wp.name || `Stop ${idx + 1}`}</strong>
                                            <p style={{ margin: 0, fontSize: '0.8rem' }}>Route: {route.name}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {selectedRouteId !== 'all' && <SetBounds route={route} />}
                        </React.Fragment>
                    );
                })}

                {/* Active Buses */}
                {activeBusesList.map((bus) => {
                    // If we are filtering by route, don't show buses on other routes
                    if (selectedRouteId !== 'all' && bus.routeId !== selectedRouteId) return null;

                    return (
                        <Marker key={bus.driverId} position={[bus.lat, bus.lng]} icon={busIcon}>
                            <Popup>
                                <div style={{ color: 'var(--bg-dark)' }}>
                                    <strong>{bus.driver?.busNumber || 'Unknown Bus'}</strong>
                                    <p style={{ margin: '0.2rem 0', fontSize: '0.8rem' }}>Driver: {bus.driver?.name || bus.driverId}</p>
                                    {userLocation && (
                                        <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                                            Distance: {getDistance(userLocation.lat, userLocation.lng, bus.lat, bus.lng).toFixed(2)} km
                                        </p>
                                    )}
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                                        Updated: {new Date(bus.updatedAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* User Current Location */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup>
                            <div style={{ color: 'var(--bg-dark)' }}>
                                <strong>You are here</strong>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
