import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, X, ArrowRight, Loader2, Zap, LayoutGrid, Clock, Shield, CheckCircle2, ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

// --- Types ---
type ProcessingStage = "File Read" | "OCR Scan" | "Event Detection" | "Timeline Build" | "Clip Render" | "Report Write";

interface StageStatus {
    name: ProcessingStage;
    status: "idle" | "active" | "completed";
    detail: string;
}

const Dashboard = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeStage, setActiveStage] = useState<number>(-1);
    const [eta, setEta] = useState<number | null>(null);
    const [frames, setFrames] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 });
    const [detectedEvents, setDetectedEvents] = useState<{ type: string; time: string; icon: string }[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [jobId, setJobId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [error, setError] = useState<any>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [verifiedCount, setVerifiedCount] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Settings
    const [format, setFormat] = useState("MP4");
    const [depth, setDepth] = useState("Standard");
    const [style, setStyle] = useState("Professional");

    const stages: StageStatus[] = [
        {
            name: "File Read",
            status: activeStage === 0 || progress >= 0 ? (activeStage > 0 || progress > 5 ? "completed" : "active") : "idle",
            detail: "Analysing stream integrity..."
        },
        {
            name: "OCR Scan",
            status: activeStage === 1 || progress >= 16 ? (activeStage > 1 || progress > 22 ? "completed" : "active") : "idle",
            detail: "Reading scoreboard data..."
        },
        {
            name: "Event Detection",
            status: activeStage === 2 || progress >= 33 ? (activeStage > 2 || progress > 38 ? "completed" : "active") : "idle",
            detail: "Identifying key moments..."
        },
        {
            name: "Timeline Build",
            status: activeStage === 3 || progress >= 50 ? (activeStage > 3 || progress > 55 ? "completed" : "active") : "idle",
            detail: "Compiling chronological logs..."
        },
        {
            name: "Clip Render",
            status: activeStage === 4 || progress >= 66 ? (activeStage > 4 || progress > 72 ? "completed" : "active") : "idle",
            detail: "Generating highlight reel..."
        },
        {
            name: "Report Write",
            status: activeStage === 5 || progress >= 83 ? (activeStage > 5 || progress > 95 ? "completed" : "active") : "idle",
            detail: "Drafting AI match summary..."
        },
    ];

    const stageMap: Record<string, number> = {
        "file_read": 0,
        "ocr_scan": 1,
        "event_detection": 2,
        "timeline_build": 3,
        "clip_render": 4,
        "report_write": 5
    };

    // Auto-scroll terminal to the bottom
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Continuous terminal heartbeat for UI showcase
    const HEARTBEAT_MSGS = [
        "Scanning frame buffer...",
        "OCR pass complete — checking scoreboard delta...",
        "Audio energy spike detected at t+{s}s",
        "Cross-referencing wicket hash table...",
        "Frame diff: delta={d} — writing to event queue",
        "Compiling clip segment...",
        "Score parsed: boundary candidate confirmed",
        "Running integrity check on event log...",
    ];
    useEffect(() => {
        if (!processing) return;
        const hb = setInterval(() => {
            const msg = HEARTBEAT_MSGS[Math.floor(Math.random() * HEARTBEAT_MSGS.length)]
                .replace('{s}', String((Math.random() * 60 + 1).toFixed(1)))
                .replace('{d}', String(Math.floor(Math.random() * 256)));
            const logMsg = `[${new Date().toLocaleTimeString()}] ENGINE: ${msg}`;
            setLogs(prev => [...prev.slice(-20), logMsg]);
        }, 2200);
        return () => clearInterval(hb);
    }, [processing]);

    // Polling logic for real-time progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (processing && jobId && progress < 100) {
            // Initial fetch to get immediate state
            const fetchStatus = async () => {
                try {
                    const response = await fetch(`/api/status/${jobId}/`);
                    const data = await response.json();

                    if (data.state === 'PROGRESS' || data.state === 'SUCCESS') {
                        setProgress(data.progress ?? progress);
                        if (data.stage) setActiveStage(stageMap[data.stage] ?? activeStage);
                        if (data.eta_seconds) setEta(data.eta_seconds);
                        if (data.frames_processed) setFrames({ processed: data.frames_processed, total: data.total_frames });

                        // Event counts for live progress display
                        if (data.verified_events !== undefined) setVerifiedCount(data.verified_events);
                        if (data.total_events !== undefined) setTotalEvents(data.total_events);

                        // Live detected events
                        if (data.events && Array.isArray(data.events)) {
                            const mappedEvents = data.events.map((e: any) => ({
                                type: e.event_type,
                                time: `${Math.floor(e.timestamp / 60)}:${String(Math.floor(e.timestamp % 60)).padStart(2, '0')}`,
                                icon: e.event_type?.toUpperCase() === 'WICKET' ? '☝️' :
                                    e.event_type?.toUpperCase() === 'SIX' ? '🚀' :
                                        e.event_type?.toUpperCase() === 'FOUR' ? '🏏' : '✨'
                            }));
                            setDetectedEvents(mappedEvents);
                        }

                        if (data.status) {
                            const logMsg = `[${new Date().toLocaleTimeString()}] ${data.stage_label || 'SYS'}: ${data.status}`;
                            setLogs(prev => {
                                // Prevent duplicate logs from polling
                                if (prev.length > 0 && prev[prev.length - 1].includes(data.status)) return prev;
                                return [...prev.slice(-30), logMsg];
                            });
                        }

                        if (data.session_id) setSessionId(data.session_id);

                        if (data.progress === 100) {
                            clearInterval(interval);
                            handleSuccess(data.session_id || sessionId || "");
                        }
                    } else if (data.state === 'FAILURE') {
                        clearInterval(interval);
                        setProcessing(false);
                        setError({
                            message: data.status || "Processing failed at a critical stage.",
                            stage: data.stage_label || "Backend Engine",
                            details: "The engine encountered an error. This usually happens if the video quality is too low or a resource limit was reached.",
                            input: file?.name
                        });
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            };

            fetchStatus();
            interval = setInterval(fetchStatus, 10000); // Increased polling to 10 seconds to reduce load
        }
        return () => clearInterval(interval);
    }, [processing, jobId, progress]);

    const handleSuccess = (sessionId: string) => {
        setProgress(100);
        setShowCelebration(true);
        setTimeout(() => {
            navigate(`/results?session_id=${sessionId}`);
        }, 8000);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type.startsWith("video/")) {
            setFile(droppedFile);
        }
    }, []);

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        setProgress(0);
        setActiveStage(0);
        setError(null);
        setLogs([`[${new Date().toLocaleTimeString()}] SYS: Initializing upload...`]);

        const formData = new FormData();
        formData.append('video', file);
        formData.append('format', format);
        formData.append('depth', depth);
        formData.append('style', style);

        try {
            const response = await fetch('/api/upload/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            const data = await response.json();
            setJobId(data.job_id);
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] SYS: Upload successful. Job ID: ${data.job_id}`, ...prev]);

        } catch (err: any) {
            console.error("Error:", err);
            setError({
                message: err.message || "An unexpected error occurred during upload.",
                stage: "Upload/Initialisation",
                details: "Check your internet connection or server status."
            });
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
            {/* Animated Background Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat animate-pulse" />
            </div>

            <Navbar />

            {/* Celebration Overlay */}
            <AnimatePresence>
                {showCelebration && (
                    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden">
                        {/* Phase 1 & 2: Exploding ring & Cricket Ball */}
                        <motion.div
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute w-64 h-64 border-4 border-primary rounded-full shadow-[0_0_100px_rgba(0,255,135,0.8)]"
                        />

                        <motion.div
                            initial={{ x: "-100vw", y: "100vh", rotate: 0 }}
                            animate={{
                                x: ["-50vw", "150vw"],
                                y: ["50vh", "-150vh"],
                                rotate: 720
                            }}
                            transition={{ duration: 3, ease: [0.23, 1, 0.32, 1], delay: 1 }}
                            className="absolute w-20 h-20 bg-[#D32F2F] rounded-full shadow-[0_0_30px_rgba(211,47,47,0.5)] flex items-center justify-center border-t-2 border-b-2 border-white/30"
                        >
                            <div className="w-full h-1 bg-white/20" />
                        </motion.div>

                        {/* Phase 3: MASSIVE IMPACT TEXT */}
                        <motion.h1
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                            transition={{ duration: 0.8, delay: 3.5, type: "spring" }}
                            className="text-[15rem] md:text-[25rem] font-bold text-primary italic drop-shadow-[0_0_50px_rgba(0,255,135,0.5)]"
                        >
                            SIX!
                        </motion.h1>

                        {/* Phase 4: Final Message */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 5.5 }}
                            className="text-center mt-[-50px] z-10"
                        >
                            <h2 className="text-4xl font-bold mb-4 tracking-[0.1em] uppercase">Analysis Complete</h2>
                            <p className="text-primary text-xl mb-10 tracking-[0.05em]">Your highlights are ready</p>
                            <button
                                onClick={() => navigate(`/results?session_id=${sessionId}`)}
                                className="btn-primary px-12 py-4 rounded-full text-lg font-bold animate-pulse group"
                            >
                                View Results <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-6 relative z-10 w-full flex flex-col items-center">
                {!processing ? (
                    <div className="w-full max-w-5xl flex flex-col items-center py-20">
                        {/* Circular Upload/File Zone */}
                        <div className="relative flex items-center justify-center">
                            {/* Concentric Pulsing Rings */}
                            {[1, 2, 3].map((r) => (
                                <div
                                    key={r}
                                    className="absolute border border-primary/20 rounded-full animate-ping"
                                    style={{
                                        width: `${450 + r * 80}px`,
                                        height: `${450 + r * 80}px`,
                                        animationDuration: `${3 + r}s`,
                                        animationDelay: `${r * 0.5}s`
                                    }}
                                />
                            ))}

                            {/* Floating Particles */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -20, 0],
                                        x: [0, Math.sin(i) * 10, 0],
                                        opacity: [0.2, 0.5, 0.2]
                                    }}
                                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute w-2 h-2 bg-primary rounded-full blur-[1px]"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        transform: `translate(${Math.cos(i) * 300}px, ${Math.sin(i) * 300}px)`
                                    }}
                                />
                            ))}

                            <motion.label
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`relative w-[450px] h-[450px] md:w-[500px] md:h-[500px] rounded-full border-2 border-dashed ${file ? 'border-primary/50 animate-[pulse_4s_infinite]' : 'border-primary/30'} bg-surface/20 backdrop-blur-sm flex flex-col items-center justify-center text-center cursor-pointer group transition-all duration-700 hover:border-primary shadow-[0_0_40px_rgba(0,255,135,0.15),_inset_0_0_60px_rgba(0,255,135,0.05)] ${isDragging ? 'scale-105 border-primary bg-primary/5' : ''}`}
                            >
                                <input type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />

                                {/* Radar Sweep Animation */}
                                {!file && (
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-20 pointer-events-none">
                                        <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_350deg,rgba(0,255,135,0.5)_360deg)] animate-[spin_4s_linear_infinite]" />
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {file ? (
                                        <motion.div
                                            key="file"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="z-10 flex flex-col items-center px-10"
                                        >
                                            <Film className="w-20 h-20 text-primary mb-8 animate-pulse" />
                                            <h3 className="text-3xl font-bold tracking-[0.1em] uppercase mb-4 max-w-[300px] truncate">{file.name}</h3>
                                            <p className="text-primary font-mono text-lg tracking-wider">{(file.size / (1024 * 1024)).toFixed(1)} MB READY</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="z-10 flex flex-col items-center"
                                        >
                                            <Upload className="w-16 h-16 text-primary/40 mb-8 group-hover:text-primary transition-colors duration-500" />
                                            <h3 className="text-2xl font-bold tracking-[0.15em] uppercase mb-4 leading-none">
                                                {isDragging ? "RELEASE TO ANALYSE" : "DROP MATCH VIDEO"}
                                            </h3>
                                            <p className="text-[#00FF87] text-[0.75rem] uppercase tracking-[0.2em] font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                                                {isDragging ? "POWERING UP..." : "SUBCONSCIOUS RADAR ACTIVE"}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.label>
                        </div>

                        {!file && (
                            <p className="mt-12 text-muted-foreground/50 text-[10px] uppercase tracking-[0.2em] font-medium">
                                Supports MP4, MOV, AVI • Up to 4GB • HD recommended
                            </p>
                        )}

                        {/* Redesigned Controls Bar */}
                        <AnimatePresence>
                            {file && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-primary/20 p-8 flex items-center justify-center z-[100]"
                                >
                                    <button
                                        onClick={handleProcess}
                                        className="btn-primary rounded-lg px-20 h-[70px] text-xl uppercase tracking-tighter font-black shadow-[0_0_50px_rgba(0,255,135,0.3)] hover:shadow-[0_0_70px_rgba(0,255,135,0.5)] transition-all"
                                    >
                                        Start Process
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Mission Control Screen (Processing State) */
                    <div className="w-full flex flex-col gap-12 items-center justify-center py-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full max-w-6xl">

                            {/* Left: Circular Progress & Stages */}
                            <div className="relative flex items-center justify-center h-[500px]">
                                {/* Progress Ring */}
                                <svg className="absolute w-[400px] h-[400px] -rotate-90">
                                    <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                                    <motion.circle
                                        cx="200" cy="200" r="190" fill="none"
                                        stroke="currentColor" strokeWidth="6"
                                        strokeDasharray="1194"
                                        strokeLinecap="round"
                                        className="text-primary"
                                        animate={{ strokeDashoffset: 1194 - (progress / 100) * 1194 }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                    />
                                </svg>

                                <div className="text-center z-10">
                                    <motion.span
                                        key={progress}
                                        initial={{ scale: 0.9, opacity: 0.8 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-8xl font-black text-white block tracking-tighter"
                                    >
                                        {Math.round(progress)}%
                                    </motion.span>
                                    <span className="text-xs uppercase tracking-[0.4em] text-primary font-bold">Analysing</span>

                                    {/* Event Count Progress */}
                                    {totalEvents > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-3 flex items-center justify-center gap-2"
                                        >
                                            <span className="text-primary text-lg font-black">{verifiedCount}</span>
                                            <span className="text-white/30 text-xs">/</span>
                                            <span className="text-white/50 text-sm font-bold">{totalEvents}</span>
                                            <span className="text-white/30 text-[9px] uppercase tracking-widest">Events</span>
                                        </motion.div>
                                    )}

                                    {/* ETA & Frames */}
                                    <div className="mt-4 flex flex-col gap-2">
                                        {eta !== null && (
                                            <span className="text-muted-foreground text-[10px] tracking-[0.2em] font-mono">
                                                EST. {Math.floor(eta / 60)}:{(eta % 60).toString().padStart(2, '0')} REMAINING
                                            </span>
                                        )}
                                        {frames.total > 0 && (
                                            <span className="text-primary/60 text-[10px] tracking-[0.2em] font-mono">
                                                FRAME {frames.processed} / {frames.total}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Station Nodes — radius=250 to stay outside the SVG arc at r=190 */}
                                {stages.map((stage, i) => {
                                    const angle = (i * 60) - 90;
                                    const radius = 250;
                                    return (
                                        <div
                                            key={stage.name}
                                            className="absolute transition-all duration-700"
                                            style={{
                                                transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`
                                            }}
                                        >
                                            <div className={`w-7 h-7 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${stage.status === "completed" ? "bg-primary border-primary shadow-[0_0_20px_rgba(0,255,135,0.4)]" :
                                                stage.status === "active" ? "bg-primary animate-pulse border-white shadow-[0_0_35px_rgba(0,255,135,0.8)]" :
                                                    "bg-background/80 border-white/40"
                                                }`}>
                                                {stage.status === "completed" && <CheckCircle2 className="w-4 h-4 text-black" />}
                                            </div>
                                            <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                                                <span className={`text-[10px] uppercase tracking-widest font-bold block ${stage.status === "idle" ? "text-white/20" : "text-white"}`}>
                                                    {stage.name}
                                                </span>
                                                {stage.status === "active" && (
                                                    <motion.span
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-[9px] text-primary mt-1 lowercase font-mono block max-w-[110px] leading-tight"
                                                    >
                                                        {stage.detail}
                                                    </motion.span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right: Logs and Live Events */}
                            <div className="flex flex-col gap-8 h-full">
                                {/* Live Processing Log */}
                                <div className="flex-1 glass-card p-10 flex flex-col gap-6 font-mono bg-black/40 border-primary/20 overflow-hidden h-[450px] max-h-[450px]">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Live System Logs</span>
                                        </div>
                                        <div className="text-[10px] text-white/20 font-bold tracking-[0.1em]">CTRL+C TO ABORT</div>
                                    </div>

                                    <div className="flex-1 relative overflow-hidden flex flex-col justify-end">
                                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black via-transparent to-transparent z-10 h-20" />
                                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 hide-scrollbar">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                {logs.map((log, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                                        className="border-l-2 border-primary/20 pl-4 py-1"
                                                    >
                                                        <span className="text-primary/90 font-bold text-xs leading-relaxed">{log}</span>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {/* Blinking cursor always at the bottom */}
                                            <div className="flex items-center gap-1 pl-4 mt-2">
                                                <motion.div
                                                    animate={{ opacity: [1, 0] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, ease: "steps(1)" }}
                                                    className="w-2 h-4 bg-primary shadow-[0_0_10px_rgba(0,255,135,0.5)]"
                                                />
                                            </div>
                                            <div ref={logsEndRef} className="h-px w-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* WHAT WE'RE FINDING (Live Events) */}
                                <div className="glass-card p-8 bg-primary/5 border-primary/20">
                                    <h4 className="text-[10px] uppercase tracking-[0.4em] text-primary font-black mb-6 flex items-center gap-2">
                                        <Zap className="w-3 h-3" /> What we're finding
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        <AnimatePresence>
                                            {detectedEvents.length === 0 ? (
                                                <div className="flex items-center gap-4">
                                                    <motion.div
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="w-1.5 h-1.5 bg-primary rounded-full"
                                                    />
                                                    <p className="text-white/30 text-xs italic tracking-widest font-mono">SCANNING STREAM FOR EVENT SIGNATURES...</p>
                                                </div>
                                            ) : (
                                                detectedEvents.map((event, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3"
                                                    >
                                                        <span className="text-lg">{event.icon}</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-white uppercase">{event.type}</span>
                                                            <span className="text-[8px] text-primary/60 font-mono">at {event.time}</span>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Diagnostic Error Overlay */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0A0A0A] border border-red-500/20 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.1)]"
                        >
                            <div className="bg-red-500/10 p-8 flex items-center gap-4 border-b border-red-500/10">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold uppercase tracking-tighter text-red-500">System Diagnostic Report</h2>
                                    <p className="text-red-500/60 text-[10px] uppercase tracking-widest font-mono">Process Aborted — Error Code 0xCRKT_{activeStage}</p>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Failed Stage</label>
                                        <p className="text-white font-mono text-sm border-l-2 border-red-500 pl-3">
                                            {error?.stage || "Unknown Stage"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Input Context</label>
                                        <p className="text-white font-mono text-sm border-l-2 border-white/10 pl-3 truncate">
                                            {error?.input || file?.name || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Failure Description</label>
                                    <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/10 italic text-red-200/80 leading-relaxed text-sm">
                                        "{error?.message || "Communication lost with the processing engine node."}"
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Suggested Remediation</label>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-xs text-white/60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {error?.details || "Verify media format compatibility and ensure the video stream is not DRM protected."}
                                        </li>
                                        <li className="flex items-center gap-3 text-xs text-white/60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Restarting the engine service can resolve ephemeral memory fragmentation.
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        onClick={() => {
                                            setError(null);
                                            handleProcess();
                                        }}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Zap className="w-4 h-4 fill-current" /> RETRY FAILED STAGE
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setProcessing(false);
                                            setError(null);
                                        }}
                                        className="px-8 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl transition-all uppercase text-[10px] font-bold tracking-widest"
                                    >
                                        Abort
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ControlGroup = ({ label, value, options, onChange }: any) => (
    <div className="flex flex-col gap-3">
        <span className="text-[0.7rem] uppercase tracking-[0.15em] text-[#00FF87] font-black">{label}</span>
        <div className="flex items-center gap-3">
            {options.map((opt: string) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`text-[0.85rem] font-bold px-5 py-2 rounded-md transition-all border ${value === opt
                        ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(0,255,135,0.3)]"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30"
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

export default Dashboard;
