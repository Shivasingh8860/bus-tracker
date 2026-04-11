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
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <div className="flex justify-between items-end mb-8">
                <div>
                   <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Live Tracking</h1>
                   <p style={{ color: 'var(--text-secondary)' }}>Real-time campus transit intelligence</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-panel-border" style={{ background: 'var(--bg-card)', border: '1px solid var(--panel-border)', borderRadius: '100px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeCount > 0 ? 'var(--accent)' : 'var(--danger)', boxShadow: activeCount > 0 ? '0 0 10px var(--accent)' : 'none' }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeCount} active buses</span>
                </div>
            </div>

            <div className="layout-sidebar">
                <motion.div
                    className="overflow-hidden shadow-2xl"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ borderRadius: 'var(--radius-md)', minHeight: '600px', border: '1px solid var(--panel-border)' }}
                >
                    <MapComponent selectedRouteId={selectedRoute} />
                </motion.div>

                <motion.div
                    className="flex flex-col gap-6"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="glass-card">
                        <h3 className="mb-4" style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation</h3>
                        <div className="flex flex-col gap-2">
                            <button
                                className={`btn w-full justify-start ${selectedRoute === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setSelectedRoute('all')}
                            >
                                <Compass size={18} /> All Routes
                            </button>

                            <div style={{ marginTop: '1rem', marginBottom: '0.5rem', height: '1px', background: 'var(--panel-border)' }}></div>

                            {routes.map(route => {
                                const busesOnRoute = Object.values(activeBuses).filter(b => b.routeId === route.id);
                                const isActive = busesOnRoute.length > 0;
                                
                                return (
                                    <button
                                        key={route.id}
                                        className={`btn w-full justify-between items-center ${selectedRoute === route.id ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setSelectedRoute(route.id)}
                                        style={{ 
                                            padding: '1rem 1.25rem', 
                                            opacity: isActive ? 1 : 0.7,
                                            borderLeft: selectedRoute === route.id ? '4px solid white' : '4px solid transparent'
                                        }}
                                    >
                                        <div className="flex flex-col items-start" style={{ textAlign: 'left' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{route.name}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{route.id}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {isActive ? (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>{busesOnRoute.length} LIVE</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>Inactive</span>
                                            )}
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
