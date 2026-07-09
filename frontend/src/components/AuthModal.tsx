import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, User, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(username, password);
            } else {
                await register(username, email, password);
            }
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden">
                {/* Header gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d]" />

                <div className="p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Logo + Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 mb-4">
                            <span className="text-2xl">🏏</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-sm text-white/40 mt-1">
                            {mode === 'login'
                                ? 'Login to access your highlight history'
                                : 'Sign up to save your match highlights'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/60 text-sm transition-colors"
                            />
                        </div>

                        {/* Email (register only) */}
                        {mode === 'register' && (
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/60 text-sm transition-colors"
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/60 text-sm transition-colors"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {mode === 'login' ? 'Login' : 'Create Account'}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-sm text-white/40 mt-6">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                            className="text-green-400 hover:text-green-300 font-medium transition-colors"
                        >
                            {mode === 'login' ? 'Sign up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
