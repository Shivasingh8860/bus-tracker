import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBuses } from '../context/BusesContext';
import MapComponent from '../components/MapComponent';
import { Search, Compass, Info, Map as MapIcon, RefreshCw, BusFront, Volume2 } from 'lucide-react';

const UserTracking = () => {
    const { routes, activeBuses, messages, addMessage } = useBuses();
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [activeTab, setActiveTab] = useState('routes'); // 'routes' or 'chat'
    const [focusedBusId, setFocusedBusId] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        return localStorage.getItem('bus_notifications') === 'true';
    });
    const [voiceEnabled, setVoiceEnabled] = useState(() => {
        return localStorage.getItem('bus_voice') === 'true';
    });

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const trackId = params.get('track');
        if (trackId && activeBuses[trackId]) {
            setSelectedRoute(activeBuses[trackId].routeId);
            setFocusedBusId(trackId);
        }
    }, [activeBuses]);

    const toggleNotifications = () => {
        const newState = !notificationsEnabled;
        if (newState) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    localStorage.setItem('bus_notifications', 'true');
                }
            });
        } else {
            setNotificationsEnabled(false);
            localStorage.setItem('bus_notifications', 'false');
        }
    };

    const toggleVoice = () => {
        const newState = !voiceEnabled;
        setVoiceEnabled(newState);
        localStorage.setItem('bus_voice', newState.toString());
        if (newState) {
            const msg = new SpeechSynthesisUtterance("Voice alerts enabled");
            window.speechSynthesis.speak(msg);
        }
    };

    const activeCount = Object.keys(activeBuses).length;

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                   <h1 className="title-gradient" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}>Live Tracking</h1>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time campus transit intelligence</p>
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
                    <MapComponent 
                        selectedRouteId={selectedRoute} 
                        notificationsEnabled={notificationsEnabled} 
                        voiceEnabled={voiceEnabled}
                    />
                </motion.div>

                <motion.div
                    className="flex flex-col gap-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    {/* CARD 1: ALERTS */}
                    <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--primary-glow)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <RefreshCw size={18} className="text-primary" />
                            <h3 className="text-sm font-bold m-0 uppercase tracking-wider">Smart Alerts</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                className={`btn w-full justify-start ${notificationsEnabled ? 'btn-primary' : 'btn-outline'}`}
                                onClick={toggleNotifications}
                                style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
                            >
                                <Compass size={16} /> {notificationsEnabled ? 'Notifications On' : 'Allow Notifications'}
                            </button>
                            <button
                                className={`btn w-full justify-start ${voiceEnabled ? 'btn-primary' : 'btn-outline'}`}
                                onClick={toggleVoice}
                                style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', borderColor: voiceEnabled ? 'transparent' : 'var(--accent)', color: voiceEnabled ? 'white' : 'var(--accent)' }}
                            >
                                <Volume2 size={16} /> {voiceEnabled ? 'Voice Alerts On' : 'Enable Voice'}
                            </button>
                        </div>
                    </div>

                    {/* CARD 2: NAVIGATION */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Compass size={20} />
                            </div>
                            <h2 className="text-lg font-bold m-0">Navigator</h2>
                        </div>
                        
                        <div className="flex gap-4 mb-4">
                            <button 
                                className={`btn btn-sm ${selectedRoute === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setSelectedRoute('all')}
                                style={{ flex: 1, fontSize: '0.75rem' }}
                            >
                                All Routes
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {routes.length === 0 ? (
                                [1, 2].map(i => <div key={i} className="skeleton" style={{ height: '50px', width: '100%', marginBottom: '0.5rem' }}></div>)
                            ) : (
                                routes.map(route => {
                                    const busesOnRoute = Object.values(activeBuses).filter(b => b.routeId === route.id);
                                    const isActive = busesOnRoute.length > 0;
                                    
                                    return (
                                        <button
                                            key={route.id}
                                            className={`btn w-full justify-between items-center mb-1 ${selectedRoute === route.id ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => {
                                                setSelectedRoute(route.id);
                                                if (busesOnRoute.length > 0) {
                                                   const busId = Object.keys(activeBuses).find(id => activeBuses[id].routeId === route.id);
                                                   setFocusedBusId(busId);
                                                }
                                            }}
                                            style={{ padding: '0.75rem 1rem' }}
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-sm m-0">{route.name}</p>
                                                <p className="text-[10px] opacity-50 m-0">{route.id}</p>
                                            </div>
                                            {isActive && (
                                                <span className="text-[0.6rem] bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded font-bold">
                                                    ● {busesOnRoute.length} LIVE
                                                </span>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* CARD 3: BUS BUZZ */}
                    <div className="glass-card flex flex-col" style={{ padding: '1.25rem', minHeight: '380px' }}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#10B981]/10 text-[#10B981]">
                                    <Volume2 size={20} />
                                </div>
                                <h2 className="text-lg font-bold m-0">Bus Buzz</h2>
                            </div>
                            {focusedBusId && (
                               <span className="text-[9px] bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded-full font-black animate-pulse">LIVE</span>
                            )}
                        </div>

                        <div className="flex flex-col flex-1 gap-4 overflow-hidden">
                            {!focusedBusId ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 px-4">
                                    <Info size={32} className="mb-4" />
                                    <p className="text-xs">Select a live bus to join its community chatroom</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs shadow-lg shadow-primary/20">
                                            #{focusedBusId.slice(-2)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-bold leading-none truncate">BUS #{focusedBusId}</p>
                                            <p className="text-[9px] text-muted truncate">{activeBuses[focusedBusId]?.routeId}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                                        {(messages[focusedBusId] || []).length === 0 ? (
                                            <p className="text-center text-[10px] text-muted mt-4 italic opacity-50">No conversation yet...</p>
                                        ) : (
                                            messages[focusedBusId].map(msg => (
                                                <div key={msg.id} className="fade-in">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-primary">{msg.userName}</span>
                                                        <span className="text-[8px] opacity-40">{msg.time}</span>
                                                    </div>
                                                    <div className="bg-white/5 p-2.5 rounded-xl rounded-tl-none border border-white/5 text-xs leading-relaxed">
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-lg border border-white/10 mt-auto">
                                        <input 
                                            id="sidebar-chat-input"
                                            placeholder="Type message..." 
                                            className="flex-1 bg-transparent border-none focus:outline-none text-xs p-1.5 px-3"
                                            autoComplete="off"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                    addMessage(focusedBusId, e.target.value, 'Student');
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => {
                                                const input = document.getElementById('sidebar-chat-input');
                                                if (input.value.trim()) {
                                                    addMessage(focusedBusId, input.value, 'Student');
                                                    input.value = '';
                                                }
                                            }}
                                            className="p-1 px-3 bg-primary text-white rounded font-bold text-xs hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            🚀
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UserTracking;
