import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Map, LogOut, Shield, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="glass" style={{ margin: '1rem', padding: '1rem 2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="header-responsive" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Link to="/" className="flex items-center gap-2">
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                    >
                        <Bus size={32} color="var(--primary)" />
                    </motion.div>
                    <h2 className="title-gradient" style={{ margin: 0 }}>CampusTracker</h2>
                </Link>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <Link to="/" className="btn btn-outline" style={{ border: 'none' }}>
                        <Map size={18} /> Public Map
                    </Link>

                    {user ? (
                        <>
                            {user.role === 'admin' ? (
                                <Link to="/admin" className="btn btn-outline" style={{ border: 'none' }}>
                                    <Shield size={18} /> Admin Dashboard
                                </Link>
                            ) : (
                                <Link to="/driver" className="btn btn-outline" style={{ border: 'none' }}>
                                    <MapPin size={18} /> Driver App
                                </Link>
                            )}
                            <div
                                style={{
                                    height: '24px',
                                    width: '1px',
                                    background: 'rgba(255,255,255,0.2)'
                                }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>Hello, {user.name || (user.role === 'admin' && 'Admin')}</span>
                            <button
                                onClick={handleLogout}
                                className="btn btn-outline"
                                style={{ border: 'none', color: 'var(--danger)' }}
                            >
                                <LogOut size={18} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary">
                            Login Portal
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
