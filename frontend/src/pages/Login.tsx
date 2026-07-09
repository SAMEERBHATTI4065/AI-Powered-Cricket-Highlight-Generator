import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, Loader2, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '440023432666-3dsf0j0urad0efl20935t7bhriaam53n.apps.googleusercontent.com';

    useEffect(() => {
        const { google } = window as any;
        if (google) {
            google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCallback,
            });
            const btnEl = document.getElementById('google-signin-btn');
            if (btnEl) {
                google.accounts.id.renderButton(btnEl, {
                    theme: 'outline',
                    size: 'large',
                    width: '380',
                });
            }
        }
    }, []);

    const handleGoogleCallback = async (response: any) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(response.credential);
            toast.success('Successfully logged in with Google!');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        toast.info(`${provider} Login — Coming Soon!`, {
            description: 'We are working on integrating social logins. Stay tuned!',
            duration: 4000,
        });
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row text-white bg-[#040810] relative overflow-hidden font-body">
            {/* Background Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

            {/* Visual Left Panel */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-cover bg-center items-center justify-start p-16"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&auto=format&fit=crop')` }}
            >
                {/* Visual Blending Overlay and Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#040810]/70 via-[#040810]/40 to-[#040810] z-10" />
                <div className="absolute -left-20 top-1/4 w-[300px] h-[300px] bg-[#00FF87]/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-20 max-w-md w-full text-left">
                    <div className="inline-flex items-center gap-2 bg-[#00FF87]/10 border border-[#00FF87]/20 px-4 py-2 rounded-full mb-8 shadow-[0_0_15px_rgba(0,255,135,0.06)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse" />
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#00FF87] font-black">
                            SPORTS_INTELLIGENCE_API
                        </span>
                    </div>

                    <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[0.05em] leading-[1.0] mb-8 text-white">
                        ANALYZE.<br />
                        HIGHLIGHT.<br />
                        <span className="text-[#00FF87] block">BROADCAST.</span>
                    </h2>

                    <p className="text-white/60 text-xs sm:text-sm leading-relaxed tracking-[0.02em] font-light">
                        Unlock broadcast-quality cricket match edits powered by multimodal machine learning. Upload and share your highlights instantly.
                    </p>
                </div>
            </div>

            {/* Form Right Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 z-20">
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-[#00FF87]/5 rounded-full blur-[140px] pointer-events-none z-0" />

                <div className="w-full max-w-md bg-[#0B1525]/40 backdrop-blur-xl border border-white/5 rounded-[24px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-[#00FF87]/20 transition-all duration-300 relative z-10">
                    {/* Header */}
                    <div className="mb-8">
                        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
                            <div className="w-10 h-10 rounded-xl bg-[#00FF87]/15 flex items-center justify-center border border-[#00FF87]/20 group-hover:border-[#00FF87]/40 transition-colors">
                                <Zap className="w-5 h-5 text-[#00FF87]" />
                            </div>
                            <span className="font-display text-2xl font-bold tracking-[0.06em] text-white">
                                Cricket<span className="text-[#00FF87]">AI</span>
                            </span>
                        </Link>

                        <h1 className="text-3xl font-display font-bold tracking-wide mb-2 uppercase">
                            Welcome Back
                        </h1>
                        <p className="text-white/50 text-[11px] leading-relaxed">
                            Sign in to access your video highlights generator, AI reports dashboard, and match run archives.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block">
                                Username
                            </label>
                            <div className="relative group">
                                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF87] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,135,0.04)] transition-all font-body"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF87] transition-colors" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,135,0.04)] transition-all font-body"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2.5 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)] text-black font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            <span>Access Your Dashboard</span>
                            <ArrowRight size={14} />
                        </button>
                    </form>

                    {/* Social Logins */}
                    <div className="mt-6 flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-5 w-full">
                            <div className="absolute inset-0 w-full border-t border-white/5" />
                            <span className="relative z-10 bg-[#0b121e] px-3.5 text-white/30 text-[9px] uppercase tracking-widest font-black">
                                Or Continue With
                            </span>
                        </div>

                        <div className="w-full space-y-3">
                            <div className="w-full flex justify-center">
                                <div id="google-signin-btn" className="w-full flex justify-center" />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSocialLogin('Facebook')}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 hover:border-white/10 bg-[#0B1525]/30 hover:bg-[#0B1525]/50 transition-all text-xs font-bold cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Continue with Facebook
                            </button>
                        </div>
                    </div>

                    {/* Toggle */}
                    <p className="text-center text-xs text-white/30 mt-8 font-medium">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-[#00FF87] hover:text-[#33ff9f] font-bold transition-colors">
                            Sign up free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
