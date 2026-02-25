import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const BusesContext = createContext();

// Mock default data (simulate backend)
export const BusesProvider = ({ children }) => {
    const [routes, setRoutes] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [activeBuses, setActiveBuses] = useState({});

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
                    busMap[b.driver_id] = { lat: b.lat, lng: b.lng, routeId: b.route_id, updatedAt: b.updated_at };
                });
                setActiveBuses(busMap);
            }
        };

        fetchData();

        // Subscribe to real-time updates for active buses moving on the map!
        const channel = supabase.channel('public:active_buses')
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
                        [b.driver_id]: { lat: b.lat, lng: b.lng, routeId: b.route_id, updatedAt: b.updated_at }
                    }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
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

    const updateBusLocation = async (driverId, lat, lng, routeId) => {
        // Optimistic UI update
        setActiveBuses(prev => ({
            ...prev,
            [driverId]: { lat, lng, routeId, updatedAt: new Date().toISOString() }
        }));

        // Push to cloud
        await supabase.from('active_buses').upsert({
            driver_id: driverId,
            lat,
            lng,
            route_id: routeId,
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

    return (
        <BusesContext.Provider value={{
            routes, addRoute: addRouteToDB,
            drivers, addDriver: addDriverToDB,
            removeDriver: removeDriverFromDB,
            activeBuses, updateBusLocation, stopBusTracking
        }}>
            {children}
        </BusesContext.Provider>
    );
};

export const useBuses = () => useContext(BusesContext);
