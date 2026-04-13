import React, { useState } from 'react';
import { useBuses } from '../context/BusesContext';
import { Users, Route as RouteIcon, Plus, Bus, Trash2, MapPin, Search, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MapComponent from '../components/MapComponent';

const wpIcon = new L.DivIcon({
    className: 'custom-station-icon',
    html: `<div style="background: var(--accent); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); transform: translate(-50%, -50%);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

function MapSelector({ waypoints, setWaypoints }) {
    useMapEvents({
        click(e) {
            if (waypoints.length >= 2) {
                setWaypoints([{ lat: e.latlng.lat, lng: e.latlng.lng, name: 'Start Stop' }]);
            } else {
                const name = waypoints.length === 0 ? 'Start Stop' : 'End Stop';
                setWaypoints([...waypoints, { lat: e.latlng.lat, lng: e.latlng.lng, name }]);
            }
        },
    });

    return (
        <>
            {waypoints.map((wp, idx) => (
                <Marker key={idx} position={[wp.lat, wp.lng]} icon={wpIcon} />
            ))}
        </>
    );
}

const AdminDashboard = () => {
    const { 
        drivers, addDriver: handleAddDriverDB, removeDriver: handleRemoveDriverDB, updateDriver: handleUpdateDriverDB,
        routes, addRoute: handleAddRouteDB, removeRoute: handleRemoveRouteDB, updateRoute: handleUpdateRouteDB, 
        activeBuses,
        broadcasts, sendBroadcast: handleSendBroadcast, removeBroadcast: handleRemoveBroadcast,
        fetchHistory: handleFetchHistory
    } = useBuses();

    const [newDriver, setNewDriver] = useState({ id: '', name: '', busNumber: '', password: '' });
    const [editingDriverId, setEditingDriverId] = useState(null);
    const [newRoute, setNewRoute] = useState({ id: '', name: '' });
    const [routeWaypoints, setRouteWaypoints] = useState([]);
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [historyPoints, setHistoryPoints] = useState([]);

    const toggleAnalytics = async () => {
        if (!showHistory) {
            const data = await handleFetchHistory();
            setHistoryPoints(data);
            setShowHistory(true);
        } else {
            setShowHistory(false);
        }
    };

    const handleSearchAdd = async () => {
        if (!searchQuery) return;
        if (routeWaypoints.length >= 2) {
            alert("Route already has a Start and End. Click on the map to reset the waypoints.");
            return;
        }

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const name = routeWaypoints.length === 0 ? 'Start' : 'End';
                setRouteWaypoints(prev => [...prev, { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name }]);
                setSearchQuery('');
            } else {
                alert("Location not found.");
            }
        } catch (e) {
            console.error('Search error', e);
        }
    };

    const handleDriverSubmit = (e) => {
        e.preventDefault();
        if (!newDriver.id || !newDriver.name || !newDriver.busNumber || !newDriver.password) return;
        if (editingDriverId) {
            handleUpdateDriverDB({ ...newDriver, originalId: editingDriverId });
            setEditingDriverId(null);
        } else {
            handleAddDriverDB(newDriver);
        }
        setNewDriver({ id: '', name: '', busNumber: '', password: '' });
    };

    const handleRouteSubmit = (e) => {
        e.preventDefault();
        if (!newRoute.id || !newRoute.name) return;
        if (routeWaypoints.length < 2) {
            alert("Select Start and End points on the map.");
            return;
        }
        if (editingRouteId) {
            handleUpdateRouteDB({ ...newRoute, waypoints: routeWaypoints, originalId: editingRouteId });
            setEditingRouteId(null);
        } else {
            handleAddRouteDB({ ...newRoute, waypoints: routeWaypoints });
        }
        setNewRoute({ id: '', name: '' });
        setRouteWaypoints([]);
    };

    const removeDriver = (id) => {
        handleRemoveDriverDB(id);
    };

    const removeRoute = (id) => {
        if (window.confirm("Delete this route permanently?")) {
            handleRemoveRouteDB(id);
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div className="flex justify-between items-end mb-10 mt-4">
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Control Center</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your operation's infrastructure</p>
                </div>

                <div className="flex gap-4 items-center">
                    <button 
                        onClick={toggleAnalytics}
                        className={`btn ${showHistory ? 'btn-primary' : 'btn-outline'}`}
                    >
                         {showHistory ? '🔥 Heatmap Active' : '📍 View Route History'}
                    </button>
                    <div className="glass-card flex items-center gap-4" style={{ padding: '0.9rem 1.5rem' }}>
                        <div style={{ background: 'var(--primary-glow)', padding: '0.6rem', borderRadius: '50%' }}>
                            <Bus size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fleet Live</p>
                            <h3 style={{ fontSize: '1.25rem' }}>{Object.keys(activeBuses).length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fleet Live View with Analytics */}
            <motion.div 
                className="glass-card mb-8 overflow-hidden map-responsive-wrapper" 
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: 0, position: 'relative' }}
            >
                <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000 }}>
                    <div className="glass-card" style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {showHistory ? 'Showing last 500 coordinates' : 'Real-time positioning'}
                    </div>
                </div>
                <MapComponent 
                    selectedRouteId="all" 
                    notificationsEnabled={false} 
                    showHistory={showHistory}
                    historyPoints={historyPoints}
                />
            </motion.div>

            <div className="layout-equal">
                {/* Driver Management */}
                <motion.div className="glass-card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 mb-6">
                        <Users size={20} color="var(--primary)" />
                        <h3>Drivers</h3>
                    </div>

                    <form onSubmit={handleDriverSubmit} className="flex flex-col gap-3 mb-8">
                        <div className="form-grid">
                            <input type="text" placeholder="Driver ID" value={newDriver.id} onChange={e => setNewDriver({ ...newDriver, id: e.target.value })} required disabled={!!editingDriverId} />
                            <input type="text" placeholder="Full Name" value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} required />
                        </div>
                        <div className="form-grid">
                            <input type="text" placeholder="Bus Number" value={newDriver.busNumber} onChange={e => setNewDriver({ ...newDriver, busNumber: e.target.value })} required />
                            <input type="password" placeholder="Password" value={newDriver.password} onChange={e => setNewDriver({ ...newDriver, password: e.target.value })} required={!editingDriverId} />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editingDriverId ? <><Edit size={18} /> Update Driver</> : <><Plus size={18} /> Register Driver</>}
                            </button>
                            {editingDriverId && (
                                <button type="button" className="btn btn-outline" onClick={() => { setEditingDriverId(null); setNewDriver({ id: '', name: '', busNumber: '', password: '' }) }}>Cancel</button>
                            )}
                        </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {drivers.map(d => (
                            <div key={d.id} className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)' }}>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{d.name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.id} • {d.busNumber}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        setEditingDriverId(d.id);
                                        setNewDriver({ id: d.id, name: d.name, busNumber: d.busNumber, password: d.password || '' });
                                    }} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => removeDriver(d.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Route Management */}
                <motion.div className="glass-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 mb-6">
                        <RouteIcon size={20} color="var(--accent)" />
                        <h3>Routes</h3>
                    </div>

                    <form onSubmit={handleRouteSubmit} className="flex flex-col gap-4 mb-8">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAdd(); } }}
                            />
                            <button type="button" className="btn btn-outline" onClick={handleSearchAdd}>
                                <Search size={18} />
                            </button>
                        </div>

                        <div style={{ height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--panel-border)', position: 'relative', zIndex: 1 }}>
                            <MapContainer center={[28.6865, 77.5533]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <MapSelector waypoints={routeWaypoints} setWaypoints={setRouteWaypoints} />
                            </MapContainer>
                        </div>

                        <div className="form-grid">
                            <input type="text" placeholder="Route ID" value={newRoute.id} onChange={e => setNewRoute({ ...newRoute, id: e.target.value })} required disabled={!!editingRouteId} />
                            <input type="text" placeholder="Description" value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} required />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-outline" style={{ flex: 1, border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                                {editingRouteId ? <><Edit size={18} /> Update Route</> : <><Plus size={18} /> Deploy Route</>}
                            </button>
                            {editingRouteId && (
                                <button type="button" className="btn btn-outline" onClick={() => { setEditingRouteId(null); setNewRoute({ id: '', name: '' }); setRouteWaypoints([]); }}>Cancel</button>
                            )}
                        </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {routes.map(r => (
                            <div key={r.id} className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)' }}>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{r.name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{r.id} • {r.waypoints?.length || 0} nodes</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        setEditingRouteId(r.id);
                                        setNewRoute({ id: r.id, name: r.name });
                                        setRouteWaypoints(r.waypoints ? [...r.waypoints] : []);
                                    }} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                        <Edit size={14} />
                                    </button>
                                    <button onClick={() => removeRoute(r.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Operational Efficiency: Broadcast Center */}
            <motion.div 
                className="glass-card mt-8" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ border: '1px solid var(--primary-glow)' }}
            >
                <div className="flex items-center gap-2 mb-6">
                    <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '50%' }}>
                        <Plus size={20} color="white" />
                    </div>
                    <h3>Global Broadcast Center</h3>
                </div>

                <div className="layout-equal">
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Send real-time alerts to every student's map instantly.
                        </p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const msg = e.target.msg.value;
                            const type = e.target.type.value;
                            if (!msg) return;
                            handleSendBroadcast(msg, type);
                            e.target.reset();
                        }} className="flex flex-col gap-3">
                            <textarea name="msg" placeholder="Type emergency message here..." style={{ minHeight: '100px', resize: 'none' }} required></textarea>
                            <div className="flex gap-2">
                                <select name="type" style={{ flex: 1 }}>
                                    <option value="info">Information (Blue)</option>
                                    <option value="warning">Warning (Orange)</option>
                                    <option value="emergency">Emergency (Red)</option>
                                </select>
                                <button type="submit" className="btn btn-primary">Publish Alert</button>
                            </div>
                        </form>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--panel-border)' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Active Announcements</h4>
                        <div className="flex flex-col gap-3">
                            {broadcasts?.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No active broadcasts.</p>}
                            {broadcasts?.map(b => (
                                <div key={b.id} className="flex justify-between items-start gap-4" style={{ padding: '1rem', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)' }}>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{b.message}</p>
                                    <button onClick={() => handleRemoveBroadcast(b.id)} className="btn btn-danger" style={{ padding: '0.3rem', borderRadius: '50%' }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
