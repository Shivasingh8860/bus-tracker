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
            // Real Geolocation explicitly every 3 seconds
            if ("geolocation" in navigator) {
                const geoOptions = {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                };

                const fetchLocation = () => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            setCurrentLocation({ lat: latitude, lng: longitude });
                            updateBusLocation(user.id, latitude, longitude, selectedRoute);
                        },
                        (err) => {
                            console.error('High accuracy GPS failed, trying fallback...', err);

                            // Fallback to standard accuracy
                            navigator.geolocation.getCurrentPosition(
                                (fbPosition) => {
                                    const { latitude, longitude } = fbPosition.coords;
                                    setCurrentLocation({ lat: latitude, lng: longitude });
                                    updateBusLocation(user.id, latitude, longitude, selectedRoute);
                                },
                                (fbErr) => {
                                    console.error('All GPS failed.', fbErr);
                                },
                                { enableHighAccuracy: false, timeout: 5000 }
                            );
                        },
                        geoOptions
                    );
                };

                // Fetch immediately on start
                fetchLocation();

                // Then fetch every 3 seconds
                interval = setInterval(fetchLocation, 3000);

            } else {
                alert("Geolocation not supported by this browser.");
                setTimeout(() => toggleTracking(), 0);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking, selectedRoute, user.id, updateBusLocation, toggleTracking]);


    return (
        <div className="flex justify-center" style={{ minHeight: '60vh' }}>
            <motion.div
                className="glass-card"
                style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="header-responsive mb-6 border-b" style={{ paddingBottom: '1rem', borderColor: 'var(--panel-border)' }}>
                    <div>
                        <h2 className="title-gradient">Driver Terminal</h2>
                        <p style={{ color: 'var(--text-muted)' }}>ID: {user.id} | Bus: {user.busNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span style={{
                            display: 'inline-block',
                            width: '12px', height: '12px',
                            borderRadius: '50%',
                            background: isTracking ? 'var(--accent)' : 'var(--danger)',
                            boxShadow: isTracking ? '0 0 10px var(--accent)' : 'none'
                        }}></span>
                        <span style={{ fontWeight: 500, color: isTracking ? 'var(--accent)' : 'var(--danger)' }}>
                            {isTracking ? 'Broadcasting Location' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Assigned Route</label>
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


                {currentLocation && isTracking && (
                    <div className="mb-6 p-4 rounded-xl fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)' }}>
                        <h4 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} color="var(--accent)" /> Current Location
                        </h4>
                        <div className="mt-2 form-grid">
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Latitude</p>
                                <p style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{currentLocation.lat.toFixed(6)}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Longitude</p>
                                <p style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{currentLocation.lng.toFixed(6)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {isTracking && (
                    <div className="mb-6 fade-in" style={{ height: '300px', borderRadius: '12px', overflow: 'hidden' }}>
                        <MapComponent selectedRouteId={selectedRoute} />
                    </div>
                )}

                <button
                    className={`btn ${isTracking ? 'btn-danger' : 'btn-primary'}`}
                    style={{ width: '100%', padding: '1rem', marginTop: 'auto' }}
                    onClick={toggleTracking}
                >
                    {isTracking ? (
                        <><StopCircle size={20} /> Stop Transmitting</>
                    ) : (
                        <><Play size={20} /> Start Route Tracking</>
                    )}
                </button>

            </motion.div>
        </div>
    );
};

export default DriverDashboard;
