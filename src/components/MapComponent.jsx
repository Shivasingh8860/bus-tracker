import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBuses } from '../context/BusesContext';
import { MapPin, Compass, Maximize } from 'lucide-react';

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

const LocateControl = () => {
    const map = useMap();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        const mapElem = document.querySelector('.leaflet-container');
        if (!isFullscreen) {
            if (mapElem.requestFullscreen) mapElem.requestFullscreen();
            else if (mapElem.webkitRequestFullscreen) mapElem.webkitRequestFullscreen();
            else if (mapElem.msRequestFullscreen) mapElem.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
                className="glass-card" 
                onClick={toggleFullscreen}
                style={{ padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            >
                <Maximize size={18} color="white" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
            <button 
                className="glass-card" 
                onClick={() => {
                    map.locate({ setView: true, maxZoom: 16 });
                    map.on('locationfound', (e) => {
                        L.circle(e.latlng, { radius: e.accuracy, color: 'var(--accent)', fillOpacity: 0.1 }).addTo(map);
                    });
                }}
                style={{ padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            >
                <Compass size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Locate Me</span>
            </button>
        </div>
    );
};

const MapComponent = ({ selectedRouteId, notificationsEnabled, voiceEnabled = false, showHistory = false, historyPoints = [] }) => {
    const { routes, activeBuses, drivers, trafficReports, submitTrafficReport } = useBuses();
    const [userLocation, setUserLocation] = useState(null);
    const [mapType, setMapType] = useState('roadmap'); // roadmap or satellite
    const alertedBuses = React.useRef(new Set());
    const spokenBuses = React.useRef(new Set());
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

    const shareTracking = (driverId) => {
        const url = `${window.location.origin}${window.location.pathname}?track=${driverId}`;
        navigator.clipboard.writeText(url);
        alert("Tracking link copied to clipboard! Share it with your friends.");
    };

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setIsDarkMode(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

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

    useEffect(() => {
        if (!notificationsEnabled || !userLocation) return;

        activeBusesList.forEach(bus => {
            const distance = getDistance(userLocation.lat, userLocation.lng, bus.lat, bus.lng);
            const busId = bus.driverId;

            if (distance < 1.0) { // 1 km geofence
                if (!alertedBuses.current.has(busId)) {
                    new Notification("Bus Nearby! 🚌", {
                        body: `${bus.driver?.busNumber || 'A bus'} is currently ${distance.toFixed(2)}km away from you.`,
                        icon: '/vite.svg'
                    });
                    alertedBuses.current.add(busId);
                }
            } else {
                // Remove from alerted set if it moves away, so it can alert again if it returns
                alertedBuses.current.delete(busId);
            }
        });
    }, [activeBuses, userLocation, notificationsEnabled]);

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
                <div className="map-controls-floating" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button 
                        className="glass-card" 
                        onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                        style={{ padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    >
                        <MapPin size={18} color="white" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{mapType === 'roadmap' ? 'Satellite' : 'Roadmap'}</span>
                    </button>
                    <LocateControl />
                </div>

                {mapType === 'roadmap' ? (
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                ) : (
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    />
                )}

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

                {/* Route Analytics (Heatmap/History) */}
                {showHistory && historyPoints.map((point, idx) => (
                    <Marker 
                        key={`hist-${idx}`} 
                        position={[point.lat, point.lng]} 
                        icon={new L.DivIcon({
                            className: 'hist-dot',
                            html: `<div style="background: var(--accent); width: 6px; height: 6px; border-radius: 50%; opacity: 0.3;"></div>`,
                            iconSize: [6, 6],
                            iconAnchor: [3, 3],
                        })}
                    >
                        <Popup>
                            <span style={{ fontSize: '0.7rem' }}>Recorded: {new Date(point.created_at).toLocaleString()}</span>
                        </Popup>
                    </Marker>
                ))}

                {activeBusesList.map((bus) => {
                    if (selectedRouteId !== 'all' && bus.routeId !== selectedRouteId) return null;

                    return (
                        <Marker key={bus.driverId} position={[bus.lat, bus.lng]} icon={busIcon}>
                            <Popup className="bus-popup">
                                <div style={{ padding: '0.2rem', minWidth: '150px' }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>{bus.driver?.busNumber || 'Bus'}</p>
                                        <div className="flex items-center gap-2">
                                             <span style={{ 
                                                fontSize: '0.6rem', 
                                                padding: '2px 6px', 
                                                borderRadius: '4px',
                                                background: bus.crowdStatus === 'Full' ? 'var(--danger)' : bus.crowdStatus === 'Substantial' ? 'var(--warning)' : 'var(--accent)',
                                                color: 'white',
                                                fontWeight: 800,
                                                textTransform: 'uppercase'
                                             }}>
                                                {bus.crowdStatus || 'Empty'}
                                             </span>
                                             <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600 }}>● LIVE</span>
                                        </div>
                                    </div>
                                    
                                    {/* Schedule Overlay */}
                                    <div className="flex items-center gap-2 mb-3 px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (Date.now() - new Date(bus.updatedAt).getTime() > 120000) ? 'var(--danger)' : 'var(--accent)' }}></div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {(Date.now() - new Date(bus.updatedAt).getTime() > 120000) ? 'SCHEDULE DELAYED' : 'ON TIME'}
                                        </span>
                                    </div>

                                    {/* Crowdsourced Traffic Alert */}
                                    {(trafficReports[bus.driverId] || 0) > 2 && (
                                        <div className="mb-3 px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', color: 'var(--warning)', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center' }}>
                                            🚦 HEAVY TRAFFIC REPORTED ({trafficReports[bus.driverId]} Passengers)
                                        </div>
                                    )}

                                    <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operator: {bus.driver?.name || 'Assigned'}</p>

                                    {/* Action Grid */}
                                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--panel-border)' }}>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => submitTrafficReport(bus.driverId)}
                                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.65rem', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--panel-border)', cursor: 'pointer', color: 'var(--text-main)' }}
                                            >
                                                Traffic!
                                            </button>
                                            <button 
                                                onClick={() => shareTracking(bus.driverId)}
                                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.65rem', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--panel-border)', cursor: 'pointer', color: 'var(--text-main)' }}
                                            >
                                                Share Trip
                                            </button>
                                        </div>
                                        <a 
                                            href={`https://wa.me/?text=${encodeURIComponent(`Hey! I'm tracking Bus #${bus.driverId}. It's currently at ${bus.crowdStatus} capacity with ${bus.passengerCount || 0} passengers. Track it live here: ${window.location.origin}/?track=${bus.driverId}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ 
                                                width: '100%', 
                                                padding: '0.6rem', 
                                                fontSize: '0.75rem', 
                                                borderRadius: '4px', 
                                                background: '#25D366', 
                                                color: 'white', 
                                                textDecoration: 'none', 
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            🔔 Notify on WhatsApp
                                        </a>
                                    </div>
                                                            {userLocation && (() => {
                                        const distanceKM = getDistance(userLocation.lat, userLocation.lng, bus.lat, bus.lng);
                                        const distanceMeters = Math.round(distanceKM * 1000);
                                        
                                        // Voice Alert Logic
                                        if (voiceEnabled && distanceMeters < 1000 && !spokenBuses.current.has(bus.driverId)) {
                                            const utterance = new SpeechSynthesisUtterance(`Attention. Bus ${bus.driver?.busNumber || 'approaching'} is nearly here.`);
                                            window.speechSynthesis.speak(utterance);
                                            spokenBuses.current.add(bus.driverId);
                                        }

                                        // Reset spoken state if bus moves away
                                        if (distanceMeters > 1500 && spokenBuses.current.has(bus.driverId)) {
                                            spokenBuses.current.delete(bus.driverId);
                                        }

                                        const avgSpeed = 20; // 20 km/h avg campus speed
                                        const etaMinutes = Math.max(1, Math.round((distanceKM / avgSpeed) * 60));
                                        
                                        return (
                                            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--panel-border)' }}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distance:</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                        {distanceKM < 1 ? `${distanceMeters}m` : `${distanceKM.toFixed(2)} km`}
                                                    </span>
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
