import React, { useState } from 'react';
import { useBuses } from '../context/BusesContext';
import { Users, Route as RouteIcon, Plus, Bus, Trash2, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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
    const { drivers, addDriver: handleAddDriverDB, removeDriver: handleRemoveDriverDB, routes, addRoute: handleAddRouteDB, removeRoute: handleRemoveRouteDB, activeBuses } = useBuses();

    const [newDriver, setNewDriver] = useState({ id: '', name: '', busNumber: '', password: '' });
    const [newRoute, setNewRoute] = useState({ id: '', name: '' });
    const [routeWaypoints, setRouteWaypoints] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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

    const addDriver = (e) => {
        e.preventDefault();
        if (!newDriver.id || !newDriver.name || !newDriver.busNumber || !newDriver.password) return;
        handleAddDriverDB(newDriver);
        setNewDriver({ id: '', name: '', busNumber: '', password: '' });
    };

    const addRoute = (e) => {
        e.preventDefault();
        if (!newRoute.id || !newRoute.name) return;
        if (routeWaypoints.length < 2) {
            alert("Select Start and End points on the map.");
            return;
        }
        handleAddRouteDB({ ...newRoute, waypoints: routeWaypoints });
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

                <div className="flex gap-4">
                    <div className="glass-card flex items-center gap-4" style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ background: 'var(--primary-glow)', padding: '0.6rem', borderRadius: '50%' }}>
                            <Bus size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</p>
                            <h3 style={{ fontSize: '1.25rem' }}>{Object.keys(activeBuses).length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="layout-equal">
                {/* Driver Management */}
                <motion.div className="glass-card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 mb-6">
                        <Users size={20} color="var(--primary)" />
                        <h3>Drivers</h3>
                    </div>

                    <form onSubmit={addDriver} className="flex flex-col gap-3 mb-8">
                        <div className="form-grid">
                            <input type="text" placeholder="Driver ID" value={newDriver.id} onChange={e => setNewDriver({ ...newDriver, id: e.target.value })} required />
                            <input type="text" placeholder="Full Name" value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} required />
                        </div>
                        <div className="form-grid">
                            <input type="text" placeholder="Bus Number" value={newDriver.busNumber} onChange={e => setNewDriver({ ...newDriver, busNumber: e.target.value })} required />
                            <input type="password" placeholder="Password" value={newDriver.password} onChange={e => setNewDriver({ ...newDriver, password: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            <Plus size={18} /> Register Driver
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {drivers.map(d => (
                            <div key={d.id} className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)' }}>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{d.name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.id} • {d.busNumber}</p>
                                </div>
                                <button onClick={() => removeDriver(d.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                    <Trash2 size={14} />
                                </button>
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

                    <form onSubmit={addRoute} className="flex flex-col gap-4 mb-8">
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
                            <input type="text" placeholder="Route ID" value={newRoute.id} onChange={e => setNewRoute({ ...newRoute, id: e.target.value })} required />
                            <input type="text" placeholder="Description" value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-outline" style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                            <Plus size={18} /> Deploy Route
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {routes.map(r => (
                            <div key={r.id} className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)' }}>
                                <div>
                                    <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{r.name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{r.id} • {r.waypoints?.length || 0} nodes</p>
                                </div>
                                <button onClick={() => removeRoute(r.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '50%' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
