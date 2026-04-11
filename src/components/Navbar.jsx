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
        <nav className="glass-card" style={{ margin: '1.5rem auto', maxWidth: '1200px', width: '92%', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3">
                    <Bus size={28} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Campus<span style={{ color: 'var(--primary)' }}>Tracker</span></h2>
                </Link>

                <div className="flex items-center gap-2">
                    <Link to="/" className="btn btn-outline" style={{ border: 'none', fontSize: '0.9rem' }}>
                        <Map size={18} /> Public
                    </Link>

                    {user ? (
                        <>
                            {user.role === 'admin' ? (
                                <Link to="/admin" className="btn btn-outline" style={{ border: 'none', fontSize: '0.9rem' }}>
                                    <Shield size={18} /> Admin
                                </Link>
                            ) : (
                                <Link to="/driver" className="btn btn-outline" style={{ border: 'none', fontSize: '0.9rem' }}>
                                    <MapPin size={18} /> Drive
                                </Link>
                            )}
                            <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
