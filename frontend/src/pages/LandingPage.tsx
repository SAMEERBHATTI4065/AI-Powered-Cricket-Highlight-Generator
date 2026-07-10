import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, BarChart3, Clock, LayoutGrid, Zap, FileText, Download, Share2, Play, CheckCircle2, Shield, Upload, Database, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const FeatureCard = ({ title, desc, icon, size = "small", learnMoreUrl }: any) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className={`glass-card p-4 sm:p-8 flex flex-col justify-between group h-full ${size === "large" ? "md:col-span-2" : ""}`}
    >
        <div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-surface border border-white/5 flex items-center justify-center mb-3 sm:mb-8 text-primary group-hover:shadow-[0_0_30px_rgba(0,200,117,0.2)] transition-all">
                {icon}
            </div>
            <h3 className="text-sm sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-3 tracking-[0.08em] leading-[1.1]">{title}</h3>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-[1.6] tracking-[0.02em]">{desc}</p>
        </div>
        <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 sm:mt-8 flex items-center text-[9px] sm:text-[10px] uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
            Learn More <ArrowRight className="w-3 h-3 ml-2" />
        </a>
    </motion.div>
);

const AIDemoVisual = ({ videoRef, onTimeUpdate }: { videoRef: React.RefObject<HTMLVideoElement>, onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void }) => {
    return (
        <div className="relative w-full h-full bg-black">
            <video
                ref={videoRef}
                src="/api/demo-video/"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={(e) => (e.currentTarget.muted = true)}
            />

            {/* High-Tech Overlay to maintain the vibe */}
            <div className="absolute inset-0 pointer-events-none z-10">
                {/* Minimalist Scanner */}
                <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[1px] bg-primary/40 shadow-[0_0_15px_rgba(0,255,135,0.4)]"
                />

                {/* Status Badges */}
                <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold">ANALYZING_STREAM_LIVE</span>
                    </div>
                </div>

                <div className="absolute bottom-4 right-4">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-white/60 font-medium">99.8% PRECISION</span>
                    </div>
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#00ff87_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>
        </div>
    );
};

const LandingPage = () => {
    const containerRef = useRef(null);
    const demoRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { user } = useAuth();
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    const scrollToDemo = () => {
        demoRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const toggleDemo = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
        scrollToDemo();
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        // Enforce 5-minute limit (300 seconds)
        if (e.currentTarget.currentTime >= 300) {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play();
        }
        // Force mute always
        if (!e.currentTarget.muted) {
            e.currentTarget.muted = true;
        }
    };

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    return (
        <div ref={containerRef} className="min-h-screen bg-background selection:bg-primary selection:text-background overflow-x-hidden">
            <Navbar />

            {/* --- Section 1: Hero --- */}
            <section className="relative min-h-[90vh] lg:h-[110vh] flex items-center justify-center overflow-hidden pt-28 pb-12 lg:py-0">
                <motion.div
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/25 to-background z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2400&auto=format&fit=crop"
                        alt="Stadium"
                        className="w-full h-full object-cover scale-110 brightness-[0.65]"
                    />
                </motion.div>

                <div className="relative z-20 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="font-display text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[4.5rem] xl:text-[5.5rem] font-bold leading-[1.1] md:leading-[0.9] mb-5 sm:mb-8 tracking-[0.05em] uppercase">
                            EVERY WICKET.<br />
                            <span className="text-primary">EVERY BOUNDARY.</span><br />
                            IN MINUTES.
                        </h1>
                        <p className="font-body text-xs sm:text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 leading-[1.6] tracking-[0.02em] font-light">
                            Drop your match video. Get broadcast-quality highlights and a full AI report.
                            The raw energy of sports meets the precision of AI.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                            <Link to={user ? "/dashboard" : "/login"} className="btn-primary px-4 py-2 sm:px-7 sm:py-3 text-xs sm:text-base w-auto min-w-[140px]">
                                Get Started
                                <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </Link>
                            <button
                                onClick={toggleDemo}
                                className="btn-ghost px-4 py-2 sm:px-7 sm:py-3 text-xs sm:text-base w-auto min-w-[140px] group"
                            >
                                Watch Demo
                                <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:fill-current transition-all" />
                            </button>
                        </div>
                        <div className="mt-8 flex justify-center">
                            <Link
                                to={user ? "/dashboard?demo=true" : "/login?redirect=/dashboard?demo=true"}
                                className="text-[11px] uppercase tracking-widest text-primary hover:text-primary/80 hover:underline transition-all font-mono font-bold flex items-center gap-1.5"
                            >
                                <Database className="w-3.5 h-3.5" />
                                Test Video
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Section 2: The Living Demo --- */}
            <section ref={demoRef} className="py-[40px] sm:py-[80px] container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2 sm:mb-4 block">PROVEN PERFORMANCE</span>
                        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-[1.1] tracking-[0.08em]">THE LIVING DEMO.</h2>
                        <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-6 sm:mb-8 leading-[1.6] tracking-[0.02em]">
                            Why explain when we can show? On the left, hours of raw broadcast. On the right,
                            the surgical precision of CricketAI. We don't just find events; we package them for global consumption.
                        </p>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium leading-[1.6] tracking-[0.02em]">Frame-perfect boundary detection</span>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium leading-[1.6] tracking-[0.02em]">Automated wicket reel generation</span>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium leading-[1.6] tracking-[0.02em]">Broadcast-ready summary reports</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        <div className="aspect-video rounded-3xl bg-surface border-2 border-primary/30 overflow-hidden relative group shadow-[0_0_50px_rgba(0,255,135,0.15)]">
                            <AIDemoVisual videoRef={videoRef} onTimeUpdate={handleTimeUpdate} />
                        </div>
                        <div className="flex justify-center">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">LIVE DEMO — REAL MATCH HIGHLIGHTS</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Section 3: How It Works --- */}
            <section className="py-[40px] sm:py-[80px] bg-surface/20 border-y border-white/5 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between mb-12 sm:mb-24 gap-6 sm:gap-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="max-w-2xl mx-auto lg:mx-0"
                        >
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2 sm:mb-4 block">THE PIPELINE</span>
                            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-[0.08em]">FOUR STEPS TO<br />BROADCAST GOLD.</h2>
                        </motion.div>
                        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs mb-2 sm:mb-4 leading-[1.6] tracking-[0.02em] mx-auto lg:mx-0">A complete horizontal journey from raw file to premium export.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
                        {/* Desktop Connector Line */}
                        <div className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 z-0" />

                        {[
                            { step: "01", title: "UPLOAD", desc: "Drop any video file. We handle the rest.", icon: "⬆️" },
                            { step: "02", title: "OCR SCAN", desc: "Artificial eyes read the scoreboard live.", icon: "🔍" },
                            { step: "03", title: "DETECT", desc: "AI identifies moments of historical impact.", icon: "🎯" },
                            { step: "04", title: "PACKAGE", desc: "Premium highlights ready for distribution.", icon: "📦" },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                whileHover={{ y: -12 }}
                                className="glass-card p-6 sm:p-10 group cursor-default relative z-10 hover:shadow-[0_20px_40px_rgba(0,255,135,0.1)]"
                            >
                                <div className="flex justify-between items-start mb-6 sm:mb-10">
                                    <div className="text-3xl sm:text-5xl filter drop-shadow-[0_0_15px_rgba(0,255,135,0.5)] group-hover:scale-110 transition-transform duration-500">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-mono font-bold text-primary px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(0,255,135,0.2)]">
                                        {item.step}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 tracking-[0.08em] leading-[1.1]">{item.title}</h3>
                                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-[1.6] tracking-[0.02em]">{item.desc}</p>

                                {/* Connector Arrow for Desktop */}
                                {idx < 3 && (
                                    <div className="hidden lg:flex absolute -right-6 top-[4.25rem] z-20 text-primary/40 group-hover:text-primary transition-colors">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Section 4: Features Bento Grid --- */}
            <section className="py-[80px] container mx-auto px-6">
                <div className="text-center mb-12 sm:mb-24">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2 sm:mb-4 block">CAPABILITIES</span>
                    <h2 className="text-xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-[0.08em]">THE ENGINE ROOM.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    <FeatureCard
                        size="large"
                        title="Scoreboard OCR 2.0"
                        desc="Our multi-layer OCR engine reads scores, overs, and wickets from any broadcast layout with 99.8% precision."
                        icon={<LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8" />}
                        learnMoreUrl="https://en.wikipedia.org/wiki/Optical_character_recognition"
                    />
                    <FeatureCard
                        title="Wicket Detection"
                        desc="AI identifies the exact moment of impact for every dismissal."
                        icon={<Zap className="w-6 h-6 sm:w-8 sm:h-8" />}
                        learnMoreUrl="https://en.wikipedia.org/wiki/Computer_vision"
                    />
                    <FeatureCard
                        title="Boundary Clipping"
                        desc="Auto-clipping for every four and six with 5-second buffers."
                        icon={<Clock className="w-6 h-6 sm:w-8 sm:h-8" />}
                        learnMoreUrl="https://en.wikipedia.org/wiki/Video_editing"
                    />
                    <FeatureCard
                        title="AI Match Report"
                        desc="Generative reports that capture the drama of the match."
                        icon={<FileText className="w-6 h-6 sm:w-8 sm:h-8" />}
                        learnMoreUrl="https://en.wikipedia.org/wiki/Natural_language_generation"
                    />
                    <FeatureCard
                        title="Multi-Format Export"
                        desc="Export to MP4, PDF, and clinical CSV/JSON data."
                        icon={<Download className="w-6 h-6 sm:w-8 sm:h-8" />}
                        learnMoreUrl="https://en.wikipedia.org/wiki/File_format"
                    />
                </div>
            </section>

            {/* --- Section 5: Team Section --- */}
            <section className="py-[80px] container mx-auto px-6">
                <div className="text-center mb-12 sm:mb-24">
                    <h2 className="text-xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 leading-[1.1] tracking-[0.08em]">BUILT BY BELIEVERS.</h2>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary font-bold block">The team behind CricketAI</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        {
                            name: "Sameer Zaheer Bhatti",
                            role: "Lead AI Systems Architect & Backend Engineer",
                            bio: "Conceived the project architecture and integrated core AI modules for the ultimate match experience.",
                            initials: "SB"
                        },
                        {
                            name: "Muhammad Hanzla",
                            role: "Senior Frontend Engineer & UI/UX Specialist",
                            bio: "Architected the user interface and the high-fidelity 'Broadcast Dark' design system.",
                            initials: "MH"
                        },
                        {
                            name: "Farooq Muaviya",
                            role: "Full-Stack Integration Engineer (React Specialist)",
                            bio: "Engineered the high-performance video processing pipeline and backend infrastructure.",
                            initials: "FM"
                        }
                    ].map((member, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="bg-surface/40 p-4 sm:p-8 rounded-[20px] sm:rounded-3xl border border-white/5 hover:border-primary/50 transition-all group"
                        >
                            <div className="w-9 h-9 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs sm:text-xl mb-2 sm:mb-6 shadow-[0_0_20px_rgba(0,255,135,0.1)] group-hover:shadow-[0_0_30px_rgba(0,255,135,0.3)] transition-all">
                                {member.initials}
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 tracking-[0.08em]">{member.name}</h3>
                            <p className="text-primary text-[9px] sm:text-xs font-semibold mb-1.5 sm:mb-3 tracking-[0.02em]">{member.role}</p>
                            <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-[1.6] tracking-[0.02em]">{member.bio}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Section 6: Final CTA --- */}
            <section className="py-[80px] relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] z-0" />

                <div className="relative z-10 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-bold mb-6 sm:mb-8 tracking-[0.05em] uppercase leading-[1.1] md:leading-[0.85]">
                            READY TO<br /><span className="text-primary italic">BROADCAST?</span>
                        </h2>
                        <Link to={user ? "/dashboard" : "/login"} className="btn-primary px-4 py-2 sm:px-8 sm:py-3.5 text-[10px] sm:text-lg w-auto max-w-[260px] sm:max-w-none mx-auto group">
                            <span className="hidden sm:inline">Analyse Your First Match — Free</span>
                            <span className="inline sm:hidden">Analyse Match Free</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <p className="mt-3 sm:mt-10 text-muted-foreground/50 text-[8px] sm:text-xs uppercase tracking-[0.25em] font-medium text-center">No credit card required.</p>
                    </motion.div>
                </div>
            </section>

            <footer className="py-10 border-t border-white/10 container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Zap className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-[0.06em] text-white">
                            Cricket<span className="text-primary">AI</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <a href="https://github.com/SAMEERBHATTI4065" target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-105 transition-transform" title="GitHub">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        </a>
                        <a href="https://linkedin.com/in/sameer-zaheer-bhatti-b57707342" target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-105 transition-transform" title="LinkedIn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                        </a>
                        <a href="https://www.instagram.com/sameerbhatti365/" target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-105 transition-transform" title="Instagram">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-105 transition-transform" title="Facebook">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                    <p className="normal-case text-white/40 text-xs font-mono">© 2026 CricketAI. All rights reserved.</p>
                    <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.15em] text-white/60">
                        <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none">Privacy</button>
                        <button onClick={() => setIsTermsOpen(true)} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none">Terms</button>
                        <a href="https://github.com/SAMEERBHATTI4065" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>

            {/* --- Modals for Privacy and Terms --- */}
            <AnimatePresence>
                {isPrivacyOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setIsPrivacyOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0B1525]/95 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsPrivacyOpen(false)}
                                className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer bg-transparent border-none outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-4 uppercase tracking-wider">Privacy Policy</h3>
                            <div className="space-y-4 text-xs sm:text-sm text-white/70 font-body leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                                <p>Welcome to CricketAI. We value your privacy and are committed to protecting your personal data.</p>
                                
                                <h4 className="font-bold text-primary uppercase text-[10px] sm:text-xs tracking-wider mt-4">1. Data Collection & Media Security</h4>
                                <p>When you upload video files for highlights generation, they are stored securely on our isolated processing servers. We implement automatic cleanup routines that completely erase media uploads and generated outputs after highlight processing is completed.</p>
                                
                                <h4 className="font-bold text-primary uppercase text-[10px] sm:text-xs tracking-wider mt-4">2. Account Credentials</h4>
                                <p>If you register an account or use Google OAuth single sign-on, we only collect necessary information (like username, email, and password hashes) to authenticate your access to your dashboard archives. We never share or sell your details.</p>
                                
                                <h4 className="font-bold text-primary uppercase text-[10px] sm:text-xs tracking-wider mt-4">3. Security Standards</h4>
                                <p>We employ high-grade SSL/TLS encryption for all data in transit, ensuring your video assets and user credentials remain strictly private and secure.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isTermsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setIsTermsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0B1525]/95 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsTermsOpen(false)}
                                className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer bg-transparent border-none outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-4 uppercase tracking-wider">Terms of Service</h3>
                            <div className="space-y-4 text-xs sm:text-sm text-white/70 font-body leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                                <p>By accessing CricketAI, you agree to comply with and be bound by the following Terms and Conditions of service.</p>
                                
                                <h4 className="font-bold text-primary uppercase text-[10px] sm:text-xs tracking-wider mt-4">1. Acceptable Use Policy</h4>
                                <p>You are solely responsible for all video assets uploaded to our platform. You agree not to upload copyrighted content, prohibited media, or run malicious scripts designed to overload the highlight processing pipeline.</p>
                                
                                <h4 className="font-bold text-primary uppercase text-[10px] sm:text-xs tracking-wider mt-4">2. Processing & Resource Fair-Use</h4>
                                <p>Highlight generation utilizes computationally heavy AI pipeline engines. We reserve the right to apply rate limiting, queue processing delays, or restrict concurrent uploads to maintain system integrity and fair availability for all users.</p>
                                
                                <h4 className="font-bold text-primary uppercase text-[10px] sm:text-xs tracking-wider mt-4">3. Disclaimers</h4>
                                <p>CricketAI services are provided "as is". We make no warranties regarding the absolute precision of event detections, scoreboard OCR outputs, or continuous uptime of processing workers.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
