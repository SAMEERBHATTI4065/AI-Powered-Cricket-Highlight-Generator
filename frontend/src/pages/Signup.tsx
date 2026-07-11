import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, AlertCircle, Loader2, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    // Step management: 1 = enter details, 2 = verify OTP
    const [step, setStep] = useState<1 | 2>(1);
    const [devCode, setDevCode] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
            const btnEl = document.getElementById('google-signup-btn');
            if (btnEl) {
                google.accounts.id.renderButton(btnEl, {
                    theme: 'outline',
                    size: 'large',
                    width: window.innerWidth < 640 ? '280' : '340',
                });
            }
        }
    }, [step]);

    const handleGoogleCallback = async (response: any) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(response.credential);
            toast.success('Successfully registered/logged in with Google!');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Validate fields and send verification code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/send-code/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send code.');

            // Save dev code to display on screen
            if (data.dev_code) {
                setDevCode(data.dev_code);
            }

            toast.success('Verification code sent!', {
                description: 'Check your email inbox.',
                duration: 6000,
            });
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP code and automatically Register
    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const verifyRes = await fetch('/api/auth/verify-code/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, code }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Invalid verification code.');

            await register(username, email, password);
            toast.success('Account created! Welcome to CricketAI!');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to complete registration.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/send-code/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend code.');

            if (data.dev_code) {
                setDevCode(data.dev_code);
            }

            toast.success('New verification code sent!');
            setCode('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialSignup = (provider: string) => {
        toast.info(`${provider} Signup — Coming Soon!`, {
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

            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 md:p-16 z-20">
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-[#00FF87]/5 rounded-full blur-[140px] pointer-events-none z-0" />

                <div className="w-full max-w-md bg-[#0B1525]/40 backdrop-blur-xl border border-white/5 rounded-[24px] p-4 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-[#00FF87]/20 transition-all duration-300 relative z-10">
                    {/* Header */}
                    <div className="mb-5">
                        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
                            <div className="w-8 h-8 rounded-lg bg-[#00FF87]/15 flex items-center justify-center border border-[#00FF87]/20 group-hover:border-[#00FF87]/40 transition-colors">
                                <Zap className="w-4 h-4 text-[#00FF87]" />
                            </div>
                            <span className="font-display text-xl font-bold tracking-[0.06em] text-white">
                                Cricket<span className="text-[#00FF87]">AI</span>
                            </span>
                        </Link>

                        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-wide mb-1 uppercase">
                            {step === 1 ? 'Create Account' : 'Verify Your Email'}
                        </h1>
                        <p className="text-white/50 text-[10px] leading-relaxed">
                            {step === 1
                                ? 'Create your account to start generating cricket highlights.'
                                : `We've sent a verification code to ${email}`}
                        </p>
                    </div>

                    {/* Step 1: Details Entry */}
                    {step === 1 && (
                        <form onSubmit={handleSendCode} className="space-y-3">
                            {/* Username */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block">
                                    Username
                                </label>
                                <div className="relative group">
                                    <User size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF87] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Choose username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        required
                                        className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 pl-11 pr-4 py-2.5 rounded-xl text-white placeholder-white/20 text-xs focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,135,0.04)] transition-all font-body"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF87] transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="yourname@domain.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 pl-11 pr-4 py-2.5 rounded-xl text-white placeholder-white/20 text-xs focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,135,0.04)] transition-all font-body"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF87] transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Minimum 6 characters"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 pl-11 pr-4 py-2.5 rounded-xl text-white placeholder-white/20 text-xs focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,135,0.04)] transition-all font-body"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <Lock size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF87] transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Match password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 pl-11 pr-4 py-2.5 rounded-xl text-white placeholder-white/20 text-xs focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,135,0.04)] transition-all font-body"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                                    <AlertCircle size={13} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 mt-1 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)] text-black font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                            >
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                <span>Get Verification Code</span>
                                <ArrowRight size={13} />
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                            {/* Locked details preview */}
                            <div className="p-2.5 bg-[#0B1525]/60 border border-white/5 rounded-xl space-y-0.5 text-[10px] text-white/50">
                                <p>Username: <strong className="text-white">{username}</strong></p>
                                <p>Email: <strong className="text-white">{email}</strong></p>
                            </div>

                            {/* OTP Code */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase tracking-wider text-white/40 font-bold block text-center">
                                    Enter 6-Digit Verification Code
                                </label>
                                <div className="relative group">
                                    <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        required
                                        className="w-full bg-[#0B1525]/60 border border-white/5 focus:border-[#00FF87]/50 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none text-xs tracking-[0.3em] font-mono text-center transition-all focus:shadow-[0_0_15px_rgba(0,255,135,0.04)]"
                                    />
                                </div>

                                <div className="flex justify-between items-center px-1 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-[9px] text-white/40 hover:text-white uppercase tracking-widest font-bold transition-colors cursor-pointer"
                                    >
                                        ← Edit details
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        className="text-[9px] text-[#00FF87]/80 hover:text-[#00FF87] uppercase tracking-widest font-bold transition-colors cursor-pointer"
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                                    <AlertCircle size={13} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full py-2.5 mt-1 rounded-xl bg-[#00FF87] hover:bg-[#00FF87]/90 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)] text-black font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                            >
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                <span>Verify & Create Account</span>
                                <ArrowRight size={13} />
                            </button>
                        </form>
                    )}

                    {/* Social Logins */}
                    <div className="mt-5 flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-4 w-full">
                            <div className="absolute inset-0 w-full border-t border-white/5" />
                            <span className="relative z-10 bg-[#0b121e] px-3 text-white/30 text-[9px] uppercase tracking-widest font-black">
                                Or Continue With
                            </span>
                        </div>

                        <div className="w-full space-y-2.5">
                            <div className="w-full flex justify-center">
                                <div id="google-signup-btn" className="w-full flex justify-center" />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSocialSignup('Facebook')}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 hover:border-white/10 bg-[#0B1525]/30 hover:bg-[#0B1525]/50 transition-all text-xs font-bold cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Continue with Facebook
                            </button>
                        </div>
                    </div>

                    {/* Toggle */}
                    <p className="text-center text-xs text-white/30 mt-6 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#00FF87] hover:text-[#33ff9f] font-bold transition-colors">
                            Log in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
