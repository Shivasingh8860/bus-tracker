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
    html: `<div style="background: var(--primary); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px var(--primary-glow); border: 2px solid white; transform: translate(-50%, -50%); cursor: pointer; transition: all 0.2s;">🚌</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const stationIcon = new L.DivIcon({
    className: 'custom-station-icon',
    html: `<div style="background: var(--accent); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); transform: translate(-50%, -50%);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const userIcon = new L.DivIcon({
    className: 'custom-user-icon',
    html: `<div style="background: #3b82f6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); border: 2px solid white; transform: translate(-50%, -50%); animate: pulse 2s infinite;"><div style="background: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
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

function SetBounds({ route }) {
    const map = useMap();
    useEffect(() => {
        if (route && route.waypoints && route.waypoints.length > 0) {
            const bounds = L.latLngBounds(route.waypoints.map(wp => [wp.lat, wp.lng]));
            map.fitBounds(bounds, { padding: [80, 80] });
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

    const activeBusesList = Object.entries(activeBuses).map(([driverId, data]) => {
        const driver = drivers.find(d => d.id === driverId);
        return { driverId, driver, ...data };
    });

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <style>
                {`
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                    }
                `}
            </style>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {displayRoutes.map((route) => {
                    if (!route.waypoints || route.waypoints.length === 0) return null;
                    const positions = route.waypoints.map(wp => [wp.lat, wp.lng]);

                    return (
                        <React.Fragment key={route.id}>
                            <Polyline positions={positions} color="var(--primary)" weight={3} opacity={0.6} dashArray="8, 8" />
                            {route.waypoints.map((wp, idx) => (
                                <Marker key={`${route.id}-wp-${idx}`} position={[wp.lat, wp.lng]} icon={stationIcon}>
                                    <Popup className="bus-popup">
                                        <div style={{ padding: '0.2rem' }}>
                                            <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{wp.name || `Stop ${idx + 1}`}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{route.name}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                            {selectedRouteId !== 'all' && <SetBounds route={route} />}
                        </React.Fragment>
                    );
                })}

                {activeBusesList.map((bus) => {
                    if (selectedRouteId !== 'all' && bus.routeId !== selectedRouteId) return null;

                    return (
                        <Marker key={bus.driverId} position={[bus.lat, bus.lng]} icon={busIcon}>
                            <Popup className="bus-popup">
                                <div style={{ padding: '0.2rem', minWidth: '150px' }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>{bus.driver?.busNumber || 'Bus'}</p>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>● LIVE</span>
                                    </div>
                                    <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operator: {bus.driver?.name || 'Assigned'}</p>
                                    
                                    {userLocation && (() => {
                                        const distance = getDistance(userLocation.lat, userLocation.lng, bus.lat, bus.lng);
                                        const avgSpeed = 20; // 20 km/h avg city speed
                                        const etaMinutes = Math.round((distance / avgSpeed) * 60);
                                        
                                        return (
                                            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--panel-border)' }}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance:</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{distance.toFixed(2)} km</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Arrival:</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                        {etaMinutes < 2 ? 'Arriving soon' : `~${etaMinutes} mins`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <p style={{ marginTop: '0.6rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem' }}>
                                        Signal: {new Date(bus.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup className="bus-popup">
                            <p style={{ fontWeight: 600, margin: 0, fontSize: '0.85rem' }}>Your Location</p>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
