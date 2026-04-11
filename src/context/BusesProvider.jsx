import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BusesContext } from './BusesContext';

// Mock default data (simulate backend)
export const BusesProvider = ({ children }) => {
    const [routes, setRoutes] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [activeBuses, setActiveBuses] = useState({});
    const [broadcasts, setBroadcasts] = useState([]);

    useEffect(() => {
        // Fetch Initial Data
        const fetchData = async () => {
            const { data: dData } = await supabase.from('drivers').select('*');
            if (dData) {
                setDrivers(dData.map(d => ({
                    ...d,
                    busNumber: d.busnumber || d.busNumber
                })));
            }

            const { data: rData } = await supabase.from('routes').select('*');
            if (rData) setRoutes(rData);

            const { data: bData } = await supabase.from('active_buses').select('*');
            if (bData) {
                const busMap = {};
                bData.forEach(b => {
                    busMap[b.driver_id] = { 
                        lat: b.lat, 
                        lng: b.lng, 
                        routeId: b.route_id, 
                        crowdStatus: b.crowd_status || 'Empty',
                        updatedAt: b.updated_at 
                    };
                });
                setActiveBuses(busMap);
            }

            const { data: broadcastData } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(3);
            if (broadcastData) setBroadcasts(broadcastData);
        };

        fetchData();

        // Subscribe to real-time updates for active buses moving on the map!
        const busChannel = supabase.channel('public:active_buses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_buses' }, payload => {
                if (payload.eventType === 'DELETE') {
                    setActiveBuses(prev => {
                        const newBuses = { ...prev };
                        delete newBuses[payload.old.driver_id];
                        return newBuses;
                    });
                } else {
                    const b = payload.new;
                    setActiveBuses(prev => ({
                        ...prev,
                        [b.driver_id]: { 
                            lat: b.lat, 
                            lng: b.lng, 
                            routeId: b.route_id, 
                            crowdStatus: b.crowd_status || 'Empty',
                            updatedAt: b.updated_at 
                        }
                    }));
                }
            })
            .subscribe();

        // Broadcast subscription
        const broadcastChannel = supabase.channel('public:broadcasts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, payload => {
                if (payload.eventType === 'INSERT') {
                    setBroadcasts(prev => [payload.new, ...prev].slice(0, 3));
                } else if (payload.eventType === 'DELETE') {
                    setBroadcasts(prev => prev.filter(b => b.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(busChannel);
            supabase.removeChannel(broadcastChannel);
        };
    }, []);

    // Intercept state changes and push to Supabase
    const addDriverToDB = async (driver) => {
        const payload = {
            id: driver.id,
            name: driver.name,
            busnumber: driver.busNumber,
            password: driver.password
        };
        const { error } = await supabase.from('drivers').insert([payload]);
        if (!error) {
            setDrivers(prev => [...prev, driver]);
        } else {
            console.error("Error adding driver to Supabase:", error);
            alert("Database Error! Failed to insert driver.");
        }
    };

    const removeDriverFromDB = async (id) => {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (!error) {
            setDrivers(prev => prev.filter(d => d.id !== id));
        }
    };

    const addRouteToDB = async (route) => {
        const { error } = await supabase.from('routes').insert([route]);
        if (!error) {
            setRoutes(prev => [...prev, route]);
        } else {
            console.error("Error adding route to Supabase:", error);
            alert("Database Error! Failed to insert route.");
        }
    };

    const updateBusLocation = async (driverId, lat, lng, routeId, crowdStatus = 'Empty') => {
        // Optimistic UI update
        setActiveBuses(prev => ({
            ...prev,
            [driverId]: { lat, lng, routeId, crowdStatus, updatedAt: new Date().toISOString() }
        }));

        // Push to cloud
        await supabase.from('active_buses').upsert({
            driver_id: driverId,
            lat,
            lng,
            route_id: routeId,
            crowd_status: crowdStatus,
            updated_at: new Date().toISOString()
        });
    };

    const stopBusTracking = async (driverId) => {
        setActiveBuses(prev => {
            const newBuses = { ...prev };
            delete newBuses[driverId];
            return newBuses;
        });

        await supabase.from('active_buses').delete().eq('driver_id', driverId);
    };

    const removeRouteFromDB = async (id) => {
        const { error } = await supabase.from('routes').delete().eq('id', id);
        if (!error) {
            setRoutes(prev => prev.filter(r => r.id !== id));
        } else {
            console.error("Error removing route from Supabase:", error);
            alert("Database Error! Failed to delete route.");
        }
    };

    const sendBroadcast = async (message, type = 'info') => {
        const { error } = await supabase.from('broadcasts').insert([{ message, type }]);
        if (error) {
            console.error("Error sending broadcast:", error);
        }
    };

    const removeBroadcast = async (id) => {
        const { error } = await supabase.from('broadcasts').delete().eq('id', id);
        if (error) {
            console.error("Error removing broadcast:", error);
        }
    };

    return (
        <BusesContext.Provider value={{
            routes, addRoute: addRouteToDB, removeRoute: removeRouteFromDB,
            drivers, addDriver: addDriverToDB,
            removeDriver: removeDriverFromDB,
            activeBuses, updateBusLocation, stopBusTracking,
            broadcasts, sendBroadcast, removeBroadcast
        }}>
            {children}
        </BusesContext.Provider>
    );
};
