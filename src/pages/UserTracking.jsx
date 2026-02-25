import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBuses } from '../context/BusesContext';
import MapComponent from '../components/MapComponent';
import { Search, Compass, Info, Map as MapIcon, RefreshCw, BusFront } from 'lucide-react';

const UserTracking = () => {
    const { routes, activeBuses } = useBuses();
    const [selectedRoute, setSelectedRoute] = useState('all');

    const activeCount = Object.keys(activeBuses).length;

    return (
        <div className="flex flex-col gap-6" style={{ minHeight: '80vh', position: 'relative' }}>

            <div className="header-responsive mb-2">
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Compass size={32} color="var(--primary)" /> Live Transit
                    </h1>
                </div>

                <div className="glass-card flex items-center gap-3" style={{ padding: '0.75rem 1.25rem', borderRadius: '30px' }}>
                    <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: activeCount > 0 ? 'var(--accent)' : 'var(--danger)',
                        boxShadow: `0 0 10px ${activeCount > 0 ? 'var(--accent)' : 'var(--danger)'}`
                    }}></div>
                    <span style={{ fontWeight: 500 }}>{activeCount} Active Buses</span>
                </div>
            </div>

            <div className="layout-sidebar">

                {/* Main Map View */}
                <motion.div
                    className="glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '0.5rem' }}
                >
                    <MapComponent selectedRouteId={selectedRoute} />
                </motion.div>

                {/* Sidebar Controls */}
                <motion.div
                    className="flex flex-col gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="glass-card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--panel-border)' }}>
                            <MapIcon size={18} color="var(--primary)" /> Select Route
                        </h3>

                        <div className="flex flex-col gap-2">
                            <button
                                className={`btn ${selectedRoute === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                style={{ width: '100%', justifyContent: 'flex-start' }}
                                onClick={() => setSelectedRoute('all')}
                            >
                                All Operating Routes
                            </button>

                            {routes.map(route => {
                                const busesOnRoute = Object.values(activeBuses).filter(b => b.routeId === route.id).length;
                                return (
                                    <button
                                        key={route.id}
                                        className={`btn ${selectedRoute === route.id ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem' }}
                                        onClick={() => setSelectedRoute(route.id)}
                                    >
                                        <div className="flex flex-col items-start w-full">
                                            <span style={{ fontWeight: selectedRoute === route.id ? 600 : 500 }}>{route.name}</span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: selectedRoute === route.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'
                                            }}>
                                                {busesOnRoute} bus{busesOnRoute !== 1 && 'es'} active
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                </motion.div>

            </div>
        </div>
    );
};

export default UserTracking;
