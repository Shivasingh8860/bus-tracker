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
    const { drivers, setDrivers, routes, setRoutes, activeBuses } = useBuses();

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
                const name = routeWaypoints.length === 0 ? 'Start Stop' : 'End Stop';
                setRouteWaypoints(prev => [...prev, { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name }]);
                setSearchQuery('');
            } else {
                alert("Location not found. Try a different search term or click directly on the map.");
            }
        } catch (e) {
            console.error('Search error', e);
            alert("Error searching for location.");
        }
    };

    const addDriver = (e) => {
        e.preventDefault();
        if (!newDriver.id || !newDriver.name || !newDriver.busNumber || !newDriver.password) return;
        setDrivers([...drivers, newDriver]);
        setNewDriver({ id: '', name: '', busNumber: '', password: '' });
    };

    const addRoute = (e) => {
        e.preventDefault();
        if (!newRoute.id || !newRoute.name) return;
        if (routeWaypoints.length < 2) {
            alert("Please click on the map to select both a Starting Position and an Ending Position.");
            return;
        }
        setRoutes([...routes, { ...newRoute, waypoints: routeWaypoints }]);
        setNewRoute({ id: '', name: '' });
        setRouteWaypoints([]);
    };

    const removeDriver = (id) => {
        setDrivers(drivers.filter(d => d.id !== id));
    };

    return (
        <div className="grid grid-cols-[1fr] gap-6" style={{ minHeight: '80vh', maxWidth: '1000px', margin: '0 auto' }}>

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '2rem' }}>Command Center</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your fleet, drivers, and routes</p>
                </div>

                <div className="flex gap-4">
                    <div className="glass-card flex items-center gap-4" style={{ padding: '1rem', minWidth: '150px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                            <Bus size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Active Buses</p>
                            <h3 style={{ margin: 0 }}>{Object.keys(activeBuses).length}</h3>
                        </div>
                    </div>
                    <div className="glass-card flex items-center gap-4" style={{ padding: '1rem', minWidth: '150px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                            <Users size={24} color="var(--accent)" />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Drivers</p>
                            <h3 style={{ margin: 0 }}>{drivers.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>

                {/* Drivers Section */}
                <motion.div className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.75rem' }}>
                        <Users size={20} color="var(--primary)" /> Driver Management
                    </h3>

                    <form onSubmit={addDriver} className="flex flex-col gap-3 mb-6" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                        <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <input type="text" placeholder="ID (e.g. D102)" value={newDriver.id} onChange={e => setNewDriver({ ...newDriver, id: e.target.value })} required />
                            <input type="text" placeholder="Full Name" value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <input type="text" placeholder="Bus Registration No." value={newDriver.busNumber} onChange={e => setNewDriver({ ...newDriver, busNumber: e.target.value })} required />
                            <input type="password" placeholder="Assign Password" value={newDriver.password} onChange={e => setNewDriver({ ...newDriver, password: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}><Plus size={18} /> Enroll Driver</button>
                    </form>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {drivers.map(d => (
                            <div key={d.id} className="flex justify-between items-center" style={{ padding: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
                                <div>
                                    <h5 style={{ margin: 0 }}>{d.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>({d.id})</span></h5>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{d.busNumber}</p>
                                </div>
                                <button onClick={() => removeDriver(d.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Routes Section */}
                <motion.div className="glass-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.75rem' }}>
                        <RouteIcon size={20} color="var(--accent)" /> Route Management
                    </h3>

                    <form onSubmit={addRoute} className="flex flex-col gap-3 mb-6" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ paddingBottom: '0.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MapPin size={14} color="var(--accent)" /> Mode: {routeWaypoints.length === 0 ? "Select Start Position" : routeWaypoints.length === 1 ? "Select End Position" : "Done (Click Map to Reset)"}
                            </p>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    placeholder="Search location to add point..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAdd(); } }}
                                    style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                                />
                                <button type="button" className="btn btn-outline" onClick={handleSearchAdd} style={{ padding: '0 1rem', borderColor: 'var(--panel-border)' }}>
                                    <Search size={18} /> Search
                                </button>
                            </div>

                            <div style={{ height: '200px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--panel-border)', cursor: 'crosshair', position: 'relative', zIndex: 1 }}>
                                <MapContainer center={[28.6865, 77.5533]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                    <MapSelector waypoints={routeWaypoints} setWaypoints={setRouteWaypoints} />
                                </MapContainer>
                            </div>
                        </div>

                        <input type="text" placeholder="Route Code (e.g. r3)" value={newRoute.id} onChange={e => setNewRoute({ ...newRoute, id: e.target.value })} required />
                        <input type="text" placeholder="Route Description" value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} required />
                        <button type="submit" className="btn btn-outline" style={{ marginTop: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}><Plus size={18} /> Configure Route</button>
                    </form>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {routes.map(r => (
                            <div key={r.id} className="flex justify-between items-center" style={{ padding: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
                                <div>
                                    <h5 style={{ margin: 0 }}>{r.name}</h5>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Path nodes: {r.waypoints?.length || 0}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default AdminDashboard;
