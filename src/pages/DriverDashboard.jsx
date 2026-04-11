import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBuses } from '../context/BusesContext';
import { Radio, MapPin, StopCircle, Play, AlertCircle } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { motion } from 'framer-motion';

const DriverDashboard = () => {
    const { user } = useAuth();
    const { routes, updateBusLocation, stopBusTracking } = useBuses();
    const [selectedRoute, setSelectedRoute] = useState(routes[0]?.id || '');
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);

    const toggleTracking = useCallback(() => {
        if (isTracking) {
            setIsTracking(false);
            stopBusTracking(user.id);
            setCurrentLocation(null);
        } else {
            setIsTracking(true);
        }
    }, [isTracking, stopBusTracking, user.id]);

    useEffect(() => {
        let interval;
        if (isTracking) {
            if ("geolocation" in navigator) {
                const fetchLocation = () => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            setCurrentLocation({ lat: latitude, lng: longitude });
                            updateBusLocation(user.id, latitude, longitude, selectedRoute);
                        },
                        (err) => console.error('GPS error', err),
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                };
                fetchLocation();
                interval = setInterval(fetchLocation, 5000);
            } else {
                alert("Geolocation not supported.");
                setIsTracking(false);
            }
        }
        return () => clearInterval(interval);
    }, [isTracking, selectedRoute, user.id, updateBusLocation]);

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
            <motion.div
                className="glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex justify-between items-start mb-8 border-b" style={{ paddingBottom: '1.5rem', borderColor: 'var(--panel-border)' }}>
                    <div>
                        <h2 className="title-gradient" style={{ fontSize: '1.5rem' }}>Driver Station</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bus {user.busNumber} • {user.id}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isTracking ? 'bg-accent/10 border-accent/20' : 'bg-danger/10 border-danger/20'}`} style={{ border: '1px solid transparent' }}>
                       <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isTracking ? 'var(--accent)' : 'var(--danger)' }}></span>
                       <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isTracking ? 'var(--accent)' : 'var(--danger)' }}>{isTracking ? 'LIVE' : 'OFFLINE'}</span>
                    </div>
                </div>

                <div className="mb-8">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assigned Route</label>
                    <select
                        value={selectedRoute}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                        disabled={isTracking}
                    >
                        {routes.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                {isTracking && (
                   <div className="mb-8 overflow-hidden fade-in" style={{ height: '350px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)' }}>
                       <MapComponent selectedRouteId={selectedRoute} />
                   </div>
                )}

                <button
                    className={`btn w-full ${isTracking ? 'btn-danger' : 'btn-primary'}`}
                    style={{ padding: '1rem', fontVariantCaps: 'all-small-caps', fontSize: '1.1rem', letterSpacing: '0.05em' }}
                    onClick={toggleTracking}
                >
                    {isTracking ? <StopCircle size={20} /> : <Play size={20} />}
                    <span style={{ marginLeft: '0.5rem' }}>{isTracking ? 'Terminate Session' : 'Initiate Broadcast'}</span>
                </button>
            </motion.div>
        </div>
    );
};

export default DriverDashboard;
