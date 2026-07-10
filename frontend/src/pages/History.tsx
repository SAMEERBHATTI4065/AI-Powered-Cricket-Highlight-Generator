import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import Navbar from '@/components/Navbar';
import cricketHero from '@/assets/cricket-hero.jpg';
import {
    Clock,
    Star,
    List,
    Search,
    Calendar,
    ChevronDown,
    CheckCircle2,
    Bell,
    User,
    LogIn,
    LogOut,
    Video,
    TrendingUp,
    Zap,
    Play,
    SlidersHorizontal,
    X,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HistorySession {
    session_id: string;
    video_title: string;
    summary_preview: string;
    video_url: string | null;
    share_token: string;
    created_at: string;
    thumbnail?: string;
    stats?: {
        wickets: number;
        sixes: number;
        fours: number;
        boundaries: number;
    };
}

const MOCK_SESSIONS: HistorySession[] = [];

export default function History() {
    const { user, loading, logout } = useAuth();
    const [sessions, setSessions] = useState<HistorySession[]>([]);
    const [fetching, setFetching] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"ALL" | "RECENT" | "STARRED">("ALL");
    const [starredIds, setStarredIds] = useState<string[]>([]);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
    const navigate = useNavigate();

    // Load starred status from local storage
    useEffect(() => {
        const stored = localStorage.getItem("cricketai_starred_sessions");
        if (stored) {
            try {
                setStarredIds(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse starred sessions", e);
            }
        }
    }, []);

    // Save starred status to local storage
    const toggleStar = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent card click navigation
        const updated = starredIds.includes(id)
            ? starredIds.filter(x => x !== id)
            : [...starredIds, id];
        setStarredIds(updated);
        localStorage.setItem("cricketai_starred_sessions", JSON.stringify(updated));
    };

    useEffect(() => {
        if (!user) return;
        setFetching(true);
        fetch('/api/auth/history/', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                const dbSessions = data.sessions || [];
                // Combine real database sessions with our mock demo matches (demo shown at bottom)
                setSessions([...dbSessions, ...MOCK_SESSIONS]);
            })
            .catch(err => {
                console.error("Error fetching history:", err);
                setSessions(MOCK_SESSIONS);
            })
            .finally(() => setFetching(false));
    }, [user]);

    const formatDate = (iso: string) => {
        if (!iso) return "N/A";
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Filter sessions
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            // 1. Text Search Filter
            const matchesSearch = session.video_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (session.summary_preview && session.summary_preview.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            // 2. Sidebar Tab Filter
            if (activeFilter === "STARRED" && !starredIds.includes(session.session_id)) {
                return false;
            }
            if (activeFilter === "RECENT") {
                // Show items from the last 7 days
                const sessionDate = new Date(session.created_at);
                const diffTime = Math.abs(new Date().getTime() - sessionDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 7) return false;
            }

            // 3. Date Range Filter
            if (dateRange !== "all") {
                const sessionDate = new Date(session.created_at);
                const diffTime = Math.abs(new Date().getTime() - sessionDate.getTime());
                const diffHours = diffTime / (1000 * 60 * 60);

                if (dateRange === "today" && diffHours > 24) return false;
                if (dateRange === "week" && diffHours > 168) return false;
                if (dateRange === "month" && diffHours > 720) return false;
            }

            return true;
        });
    }, [sessions, searchQuery, activeFilter, starredIds, dateRange]);

    const statsCounts = useMemo(() => {
        // Count for sidebar display
        const totalCount = sessions.length;
        const starredCount = sessions.filter(s => starredIds.includes(s.session_id)).length;

        // Count recent items (last 7 days)
        const recentCount = sessions.filter(s => {
            const sessionDate = new Date(s.created_at);
            const diffTime = Math.abs(new Date().getTime() - sessionDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
        }).length;

        return { total: totalCount, recent: recentCount, starred: starredCount };
    }, [sessions, starredIds]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b1114]">
                <div className="text-primary text-sm font-mono tracking-widest animate-pulse flex items-center gap-3">
                    <Zap className="w-5 h-5 animate-spin" /> LOADING DASHBOARD...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1114] text-center px-4 relative overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md bg-[#10181d] border border-white/5 rounded-3xl p-10 shadow-[0_0_50px_rgba(43,216,115,0.05)] z-10"
                    >
                        <div className="mb-6 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary text-4xl shadow-[0_0_20px_rgba(43,216,115,0.1)]">
                            <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-wide">Analysis History</h2>
                        <p className="text-white/40 mb-8 max-w-sm leading-relaxed text-sm">
                            Access secure logs of all previously analyzed matches, highlight clips, and AI commentary. Please sign in to authenticate.
                        </p>
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest py-4 px-6 rounded-2xl transition-all shadow-[0_0_25px_rgba(43,216,115,0.25)] hover:shadow-[0_0_35px_rgba(43,216,115,0.4)] active:scale-98"
                        >
                            <LogIn size={18} />
                            Login / Register
                        </button>
                    </motion.div>
                </div>
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b1114] text-white flex flex-col pt-24 font-sans selection:bg-primary selection:text-black">
            {/* Top Navbar */}
            <Navbar />

            {/* Main Application Interface */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Sidebar */}
                <aside className="w-full lg:w-[280px] bg-[#10181d] border border-white/5 rounded-2xl p-6 flex flex-col gap-6 shrink-0 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
                    <div>
                        <h3 className="text-xs font-black tracking-[0.2em] text-white/40 mb-2 flex items-center gap-2">
                            <SlidersHorizontal size={14} className="text-primary" /> ANALYSIS HISTORY
                        </h3>
                        <p className="text-primary font-mono text-sm font-bold">
                            {statsCounts.total} Total Matches
                        </p>
                    </div>

                    <div className="border-t border-white/5 my-1" />

                    <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 hide-scrollbar">
                        <button
                            onClick={() => setActiveFilter("ALL")}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-300 w-full shrink-0 lg:shrink ${activeFilter === "ALL"
                                ? "bg-primary/15 text-primary border border-primary/20 shadow-[inset_0_0_15px_rgba(43,216,115,0.05)]"
                                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <List size={16} /> All Analyses
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeFilter === "ALL" ? "bg-primary text-black" : "bg-white/10 text-white/50"
                                }`}>
                                {statsCounts.total}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveFilter("RECENT")}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-300 w-full shrink-0 lg:shrink ${activeFilter === "RECENT"
                                ? "bg-primary/15 text-primary border border-primary/20 shadow-[inset_0_0_15px_rgba(43,216,115,0.05)]"
                                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <Clock size={16} /> Recent (7d)
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeFilter === "RECENT" ? "bg-primary text-black" : "bg-white/10 text-white/50"
                                }`}>
                                {statsCounts.recent}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveFilter("STARRED")}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-300 w-full shrink-0 lg:shrink ${activeFilter === "STARRED"
                                ? "bg-primary/15 text-primary border border-primary/20 shadow-[inset_0_0_15px_rgba(43,216,115,0.05)]"
                                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            <span className="flex items-center gap-2.5">
                                <Star size={16} /> Starred Match
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeFilter === "STARRED" ? "bg-primary text-black" : "bg-white/10 text-white/50"
                                }`}>
                                {statsCounts.starred}
                            </span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 w-full flex flex-col gap-6">

                    {/* Header Controls: Title & Filters */}
                    <div className="bg-[#10181d] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                        <div>
                            <h2 className="text-xl font-display font-bold text-white tracking-widest mb-1">
                                Past Analyses
                            </h2>
                            <p className="text-xs text-white/40 uppercase tracking-wider font-mono">
                                Filtered {filteredSessions.length} of {sessions.length} matches
                            </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Search box with green border focus */}
                            <div className="relative group flex-1 sm:w-64">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search match..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#0b1114] text-white border border-[#2a363d] focus:border-primary px-10 py-3 rounded-full text-xs font-medium placeholder-white/30 transition-all focus:shadow-[0_0_15px_rgba(43,216,115,0.1)] outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Date-range dropdown button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                    className="w-full sm:w-auto flex items-center justify-between gap-3 bg-transparent hover:bg-white/5 border border-[#2a363d] hover:border-primary/50 text-white/70 hover:text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    <span className="flex items-center gap-2">
                                        <Calendar size={14} className="text-primary" />
                                        Date: {dateRange.toUpperCase()}
                                    </span>
                                    <ChevronDown size={14} />
                                </button>

                                <AnimatePresence>
                                    {showDateDropdown && (
                                        <>
                                            {/* Backdrop Clicker */}
                                            <div className="fixed inset-0 z-40" onClick={() => setShowDateDropdown(false)} />

                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 mt-2 w-48 bg-[#10181d] border border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden"
                                            >
                                                <div className="p-1 flex flex-col gap-1">
                                                    {(["all", "today", "week", "month"] as const).map((r) => (
                                                        <button
                                                            key={r}
                                                            onClick={() => {
                                                                setDateRange(r);
                                                                setShowDateDropdown(false);
                                                            }}
                                                            className={`text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${dateRange === r
                                                                ? "bg-primary text-black font-black"
                                                                : "text-white/60 hover:text-white hover:bg-white/5"
                                                                }`}
                                                        >
                                                            {r === "all" ? "All Time" : r === "today" ? "Last 24 Hours" : r === "week" ? "Last 7 Days" : "Last 30 Days"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Grid List */}
                    {fetching ? (
                        <div className="w-full flex py-24 flex-col items-center justify-center gap-4 bg-[#10181d] border border-white/5 rounded-2xl">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Fetching highlighted summaries...</p>
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-20 bg-[#10181d] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-4 text-white/30">
                                🏏
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">No Analyses Found</h3>
                            <p className="text-white/40 text-sm max-w-sm mb-6 leading-relaxed">
                                {searchQuery || dateRange !== "all" || activeFilter !== "ALL"
                                    ? "No matches match your current query. Try adjusting your active filters or clear search query."
                                    : "You haven't generated any cricket highlights yet. Upload and analyze custom matches today!"}
                            </p>
                            {(searchQuery || dateRange !== "all" || activeFilter !== "ALL") ? (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setDateRange("all");
                                        setActiveFilter("ALL");
                                    }}
                                    className="bg-primary/20 hover:bg-primary/30 border border-primary/20 text-primary px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Clear Filters
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-primary hover:bg-primary/95 text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(43,216,115,0.2)] transition-all active:scale-98"
                                >
                                    Analyze Custom Match Video
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                            <AnimatePresence mode="popLayout">
                                {filteredSessions.map((s) => {
                                    const wickets = s.stats?.wickets ?? 0;
                                    const sixes = s.stats?.sixes ?? 0;
                                    const fours = s.stats?.fours ?? 0;
                                    const boundaries = s.stats?.boundaries ?? 0;

                                    return (
                                        <motion.div
                                            key={s.session_id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => navigate(`/results?session_id=${s.session_id}`)}
                                            className="group relative bg-[#161e23] border border-white/5 hover:border-primary/40 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start duration-300 hover:shadow-[0_0_30px_rgba(43,216,115,0.06)] hover:-translate-y-0.5 cursor-pointer transition-all"
                                        >
                                            {/* Star Action */}
                                            <button
                                                onClick={(e) => toggleStar(s.session_id, e)}
                                                className="absolute top-4 right-4 z-20 text-white/30 hover:text-yellow-400 p-1 hover:bg-white/5 rounded-full transition-colors duration-200"
                                            >
                                                <Star
                                                    size={16}
                                                    className={starredIds.includes(s.session_id) ? "fill-yellow-400 text-yellow-400" : "text-white/30"}
                                                />
                                            </button>

                                            {/* Thumbnail Representation */}
                                            <div className="relative w-full sm:w-[150px] aspect-[4/3] sm:aspect-auto sm:h-[105px] rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/5 flex items-center justify-center">
                                                <img
                                                    src={s.thumbnail || cricketHero}
                                                    alt="Match Thumbnail"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (target.src !== cricketHero) {
                                                            target.src = cricketHero;
                                                        }
                                                    }}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                {/* Play Button Overlay */}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/45 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        <Play size={12} className="fill-current ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Info Section */}
                                            <div className="flex-1 w-full flex flex-col justify-between min-w-0 self-stretch py-0.5">
                                                <div className="pr-6">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <h4 className="text-sm font-bold text-white truncate max-w-[200px] leading-tight uppercase group-hover:text-primary transition-colors">
                                                            {s.video_title}
                                                        </h4>
                                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                                    </div>
                                                    <p className="text-[10px] text-white/35 font-mono mb-2 font-medium flex items-center gap-1">
                                                        <Clock size={10} /> {formatDate(s.created_at)}
                                                    </p>

                                                    {/* Summary preview */}
                                                    {s.summary_preview && (
                                                        <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mb-3">
                                                            {s.summary_preview}...
                                                        </p>
                                                    )}

                                                    {/* Dynamic Stats Row matches user's mockup stats */}
                                                    <div className="bg-black/20 border border-white/5 rounded-lg py-2 px-2.5 mb-4 w-full flex flex-wrap items-center justify-between gap-1.5 text-[9px] sm:text-[10px] font-mono text-white/60">
                                                        <span className="flex items-center gap-0.5">
                                                            Wkts: <strong className="text-white font-bold">{wickets}</strong>
                                                        </span>
                                                        <span className="hidden sm:inline w-px h-3 bg-white/5" />
                                                        <span className="flex items-center gap-0.5">
                                                            Sixes: <strong className="text-white font-bold">{sixes}</strong>
                                                        </span>
                                                        <span className="hidden sm:inline w-px h-3 bg-white/5" />
                                                        <span className="flex items-center gap-0.5">
                                                            Fours: <strong className="text-white font-bold">{fours}</strong>
                                                        </span>
                                                        <span className="hidden sm:inline w-px h-3 bg-white/5" />
                                                        <span className="flex items-center gap-0.5">
                                                            Boundaries: <strong className="text-white font-bold">{boundaries}</strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/results?session_id=${s.session_id}`)}
                                                    className="w-full flex items-center justify-center gap-1 border border-white/10 hover:border-primary/80 hover:bg-primary hover:text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300"
                                                >
                                                    View Analysis & Summary
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
}
