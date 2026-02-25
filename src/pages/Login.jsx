import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Lock, Shield, BusFront } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBuses } from '../context/BusesContext';

const Login = () => {
    const [role, setRole] = useState('driver'); // 'driver' or 'admin'
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const { drivers } = useBuses();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (role === 'admin') {
            if (userId === 'admin' && password === 'admin123') {
                login('admin', { name: 'Super Admin' });
                navigate('/admin');
            } else {
                setError('Invalid admin credentials.');
            }
        } else {
            // Driver login
            const driver = drivers.find(d => d.id === userId);
            if (driver && password === driver.password) {
                login('driver', driver);
                navigate('/driver');
            } else {
                setError('Invalid driver ID or password.');
            }
        }
    };

    return (
        <div className="flex justify-center items-center" style={{ minHeight: '70vh' }}>
            <motion.div
                className="glass-card"
                style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex flex-col items-center mb-6">
                    <div className="flex gap-4 mb-6" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px' }}>
                        <button
                            className={`btn ${role === 'driver' ? 'btn-primary' : 'btn-outline'}`}
                            style={role === 'driver' ? {} : { border: 'none' }}
                            onClick={() => setRole('driver')}
                        >
                            <BusFront size={18} /> Driver Access
                        </button>
                        <button
                            className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                            style={role === 'admin' ? {} : { border: 'none' }}
                            onClick={() => setRole('admin')}
                        >
                            <Shield size={18} /> Admin Portal
                        </button>
                    </div>
                    <h2 className="title-gradient">
                        {role === 'driver' ? 'Driver Authentication' : 'Admin Login'}
                    </h2>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: 'var(--danger)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            {role === 'driver' ? 'Driver ID' : 'Admin Username'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <UserCircle size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '12px' }} />
                            <input
                                type="text"
                                style={{ paddingLeft: '2.5rem' }}
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '12px' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={{ paddingLeft: '2.5rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '1rem' }}>
                        Secure Login
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
