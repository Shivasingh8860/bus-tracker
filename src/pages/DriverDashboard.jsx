import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBuses } from '../context/BusesContext';
import { Radio, MapPin, StopCircle, Play, AlertCircle, AlertTriangle } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { motion } from 'framer-motion';

const DriverDashboard = () => {
    const { user } = useAuth();
    const { routes, updateBusLocation, stopBusTracking } = useBuses();
    const [selectedRoute, setSelectedRoute] = useState(routes[0]?.id || '');
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [crowdStatus, setCrowdStatus] = useState('Empty');

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
                            updateBusLocation(user.id, latitude, longitude, selectedRoute, crowdStatus);
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
    }, [isTracking, selectedRoute, user.id, updateBusLocation, crowdStatus]);

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

                <div className="layout-equal mb-8">
                    <div>
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

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Capacity Status</label>
                        <div className="flex gap-2">
                             {[
                                { id: 'Empty', color: 'var(--accent)' },
                                { id: 'Substantial', color: 'var(--warning)' },
                                { id: 'Full', color: 'var(--danger)' }
                             ].map(status => (
                                <button
                                    key={status.id}
                                    type="button"
                                    className={`btn ${crowdStatus === status.id ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderColor: crowdStatus === status.id ? 'transparent' : status.color, color: crowdStatus === status.id ? 'white' : status.color }}
                                    onClick={() => setCrowdStatus(status.id)}
                                >
                                    {status.id}
                                </button>
                             ))}
                        </div>
                    </div>
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

                {isTracking && (
                    <div className="mt-4 flex gap-2">
                        <button 
                            className="btn w-full btn-danger"
                            style={{ 
                                background: 'transparent',
                                border: '2px solid var(--danger)',
                                color: 'var(--danger)',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                animation: 'pulse-danger 2s infinite'
                            }}
                            onClick={() => {
                                // SOS Signal simulation (would update DB in prod)
                                const busRef = activeBuses[user.id];
                                if (busRef) {
                                  // toggle sos status logic
                                }
                                alert('🚨 EMERGENCY SOS BROADCAST SENT TO SECURITY');
                            }}
                        >
                            <AlertTriangle size={24} /> EMERGENCY SOS
                        </button>
                    </div>
                )}

                {isTracking && (
                    <div className="mt-10 p-6 border-t" style={{ borderColor: 'var(--panel-border)', textAlign: 'center' }}>
                        <h4 className="mb-4" style={{ color: 'var(--text-secondary)' }}>Passenger Check-In Station</h4>
                        <div className="glass-card d-inline-block" style={{ display: 'inline-block', background: 'white', padding: '15px', borderRadius: '12px' }}>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/checkin/${user.id}`)}`} 
                                alt="Boarding QR"
                                style={{ display: 'block' }}
                            />
                        </div>
                        <p className="mt-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '1rem auto' }}>
                           Display this QR to your passengers. When they scan it, their entry/exit will automatically update your bus's occupancy status.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default DriverDashboard;
