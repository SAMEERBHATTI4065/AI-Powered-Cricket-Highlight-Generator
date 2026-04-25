import { motion, AnimatePresence } from "framer-motion";
import { Download, Clock, Target, Trophy, Zap, ChevronRight, ArrowLeft, FileText, Share2, FileJson, Video, Play, Pause, Maximize2, MessageCircle, Twitter, Facebook, Copy, Youtube, X, RotateCcw, RotateCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";

const StatItem = ({ label, value, delay }: any) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;

    let totalDuration = 2000;
    let incrementTime = (totalDuration / (end || 1));

    let timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center px-4"
    >
      <div className="text-[42px] font-black text-white leading-none tracking-tighter drop-shadow-sm">{displayValue}</div>
      <div className="text-[10px] uppercase tracking-[4px] text-primary/70 font-black mt-2">{label}</div>
    </motion.div>
  );
};

const ExportCard = ({ icon, label, format, size, onClick, glowColor }: any) => (
  <button
    onClick={onClick}
    className={`w-full p-[16px] flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-[16px] transition-all duration-300 group hover:bg-white/[0.05] ${glowColor ? `hover:shadow-[0_0_20px_${glowColor}]` : ''}`}
  >
    <div className="flex items-center gap-[12px]">
      <div className="shrink-0 transition-transform duration-500 group-hover:scale-110">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-sm font-bold uppercase tracking-tight text-white mb-0.5">{label}</div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{format} — {size}</div>
      </div>
    </div>
    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#00ff80] group-hover:border-[#00ff80]/30 transition-colors">
      <Download className="w-4 h-4" />
    </div>
  </button>
)

const ShareModal = ({ isOpen, onClose, url, videoUrl }: { isOpen: boolean, onClose: () => void, url: string, videoUrl?: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { name: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, color: '#25D366', action: () => window.open(`https://wa.me/?text=Check+out+this+cricket+analysis+${encodeURIComponent(url)}`) },
    { name: 'Twitter/X', icon: <Twitter className="w-5 h-5" />, color: '#1DA1F2', action: () => window.open(`https://twitter.com/intent/tweet?text=Check+out+this+cricket+analysis&url=${encodeURIComponent(url)}`) },
    { name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: '#1877F2', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`) },
    {
      name: 'YouTube',
      icon: <Youtube className="w-5 h-5" />,
      color: '#FF0000',
      action: () => {
        if (videoUrl) {
          navigator.clipboard.writeText(window.location.origin + videoUrl);
          alert("MANUAL UPLOAD MODE:\n1. Highlight URL copied to clipboard.\n2. We are redirecting you to YouTube Creator Studio.\n3. Paste the URL in the 'Description' field so viewers can access the full analysis.");
        }
        window.open('https://studio.youtube.com/channel/upload', '_blank');
      }
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-md p-[32px] bg-[#0B1525]/90 border-white/10 flex flex-col gap-[24px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
          <h3 className="text-xs uppercase tracking-[6px] text-white/40 font-bold mb-3">Share Results</h3>
          <p className="text-3xl font-black tracking-tighter text-white mb-0 drop-shadow-sm">DISPATCH <span className="text-primary italic">ANALYSIS</span></p>
        </div>

        <div className="grid grid-cols-2 gap-[12px]">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-[16px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00ff80]/20 group-hover:text-[#00ff80] transition-colors">
              <Copy className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {shareOptions.map((opt) => (
            <button
              key={opt.name}
              onClick={() => { opt.action(); onClose(); }}
              className="flex flex-col items-center justify-center gap-4 p-8 rounded-[24px] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all group hover:border-primary/30 hover:shadow-[0_0_30px_rgba(0,255,128,0.05)]"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-white/10 transition-all duration-300 group-hover:scale-110" style={{ color: opt.color }}>
                {opt.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{opt.name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// --- Types ---
interface Event {
  event_id: string;
  event_type: string;
  timestamp: number;
  current: string;
  previous: string;
  runs_added: string;
}

const eventIcons: Record<string, { icon: React.ReactNode; color: string; border: string }> = {
  boundary: { icon: <Target className="w-4 h-4" />, color: "text-primary", border: "border-primary" },
  six: { icon: <Trophy className="w-4 h-4" />, color: "text-accent", border: "border-accent" },
  wicket: { icon: <Zap className="w-4 h-4" />, color: "text-danger", border: "border-danger" },
};

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlayerHovered, setIsPlayerHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState<number | null>(null);
  const [flashingEventId, setFlashingEventId] = useState<number | null>(null);
  const [hoveredEventIndex, setHoveredEventIndex] = useState<number | null>(null);
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const seekbarRef = useRef<HTMLDivElement>(null);
  const progressBeforeDrag = useRef(0);
  const [hoverTooltip, setHoverTooltip] = useState<{x: number, time: number} | null>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVideoTap = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/results/${sessionId}/`);
        if (!response.ok) throw new Error("Failed to fetch results");
        const resultData = await response.json();
        setData(resultData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Fix: Immediately load video on mount to avoid delay
    video.load();

    const handleTimeUpdate = () => {
      // Don't update state from video time while user is actively dragging the seeker
      if (!isDragging) {
        setCurrentTime(video.currentTime);
      }
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [data]);

  const getClientX = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number => {
    if ('touches' in e && e.touches.length > 0) return e.touches[0].clientX;
    if ('changedTouches' in e && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return (e as MouseEvent | React.MouseEvent).clientX;
  };

  const applySeek = (clientX: number) => {
    if (!videoRef.current || !seekbarRef.current) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const safeDuration = videoRef.current.duration || duration || 1;
    
    // Defensive check
    if (isNaN(safeDuration) || safeDuration <= 0) {
      console.warn("[DEBUG] Seek failed: duration is invalid", safeDuration);
      return;
    }

    const newTime = (clampedX / rect.width) * safeDuration;
    
    console.log(`[DEBUG] Applying Seek: ${newTime.toFixed(2)}s (Duration: ${safeDuration.toFixed(2)}s)`);
    
    try {
      if (isFinite(newTime)) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    } catch (err) {
      console.error("[DEBUG] Failed to set currentTime:", err);
    }
  };

  const handleSeekbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    applySeek(e.clientX);

    const onMouseMove = (ev: MouseEvent) => applySeek(ev.clientX);
    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSeekbarTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    applySeek(e.touches[0].clientX);

    const onTouchMove = (ev: TouchEvent) => { if (ev.touches[0]) applySeek(ev.touches[0].clientX); };
    const onTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  // Keyboard shortcuts for seeking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); skipTime(-5); }
      if (e.key === 'ArrowRight') { e.preventDefault(); skipTime(5); }
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-primary font-display text-2xl uppercase tracking-[0.5em] animate-pulse">
      Initialising Assembly...
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="w-20 h-20 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
        <X className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-bold uppercase tracking-tighter">Mission Failure</h2>
      <p className="text-muted-foreground font-mono text-sm">{error}</p>
      <Link to="/dashboard" className="btn-ghost px-10">Return to Base</Link>
    </div>
  );

  const events = data?.verified_events || [];
  const summaryText = data?.summary_text || "";

  const normalizeEventType = (backendType: string) => {
    switch (backendType?.toUpperCase()) {
      case 'FOUR': return 'boundary';
      case 'SIX': return 'six';
      case 'WICKET': return 'wicket';
      default: return 'unknown';
    }
  };

  const stats = {
    totalRuns: events.reduce((acc: number, e: any) => acc + (parseInt(e.runs_added) || 0), 0),
    totalWickets: events.filter((e: any) => e.event_type?.toUpperCase() === 'WICKET').length,
    four: events.filter((e: any) => e.event_type?.toUpperCase() === 'FOUR').length,
    six: events.filter((e: any) => e.event_type?.toUpperCase() === 'SIX').length,
    events: events.length
  };

  const parseScore = (raw: string) => {
    if (!raw) return null;
    const m = raw.match(/(\d+)\s*[- \/]\s*(\d+)\s*(\(([^)]+)\))?/);
    if (!m) return null;
    return { runs: parseInt(m[1]), wickets: parseInt(m[2]), overs: m[4] || "" };
  };

  const getEventDescription = (event: any) => {
    const curr = parseScore(event.current);

    if (curr) {
      return `Score: ${curr.runs}/${curr.wickets} • Over ${curr.overs || '0.0'}`;
    }

    // Fallback: strip any jargon if present in raw string
    let raw = event.current || "";
    // Remove "Verified via..." and anything in brackets [S1_S4]
    raw = raw.replace(/•?\s*Verified via.*$/i, "").replace(/\[.*?\]/g, "").trim();

    return raw || event.event_type || "Key Moment Detected";
  };

  const handleSeek = (time: number, index?: number) => {
    if (videoRef.current) {
      if (index !== undefined) {
        // Jump to the event's precise timestamp
        console.log(`🎬 EVENT JUMP: ${time}s`);
        videoRef.current.currentTime = time;
        setActiveEventIndex(index);
        setFlashingEventId(data?.verified_events[index]?.event_id);
      } else {
        videoRef.current.currentTime = time;
      }

      videoRef.current.play().catch(() => { });
      setIsPlaying(true);

      setIsPulseActive(true);
      setTimeout(() => setIsPulseActive(false), 1000);
    }
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      const video = videoRef.current;
      const safeDuration = video.duration || duration || 1;
      
      if (isNaN(safeDuration)) return;

      const newTime = Math.max(0, Math.min(safeDuration, video.currentTime + amount));
      
      console.log(`[DEBUG] Skipping to: ${newTime.toFixed(2)}s (Amount: ${amount}s)`);
      
      video.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Ensure smooth playback if it was already playing
      if (isPlaying) {
        video.play().catch(() => {});
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.error("Play failed:", e));
    } else {
      videoRef.current.pause();
    }
  };

  const handleCopyLink = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/results/${sessionId}/share/`, { method: 'POST' });
      const { share_url } = await response.json();
      setShareUrl(share_url);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch share link:", err);
    }
  };

  const handleDownloadVideo = () => {
    if (!sessionId) return;
    const downloadUrl = `/api/results/${sessionId}/download/highlight/`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `CricketAI_Highlights_${sessionId}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#05080F] relative selection:bg-primary/30 scroll-smooth">
      <Navbar />

      {/* --- Main Content Container --- */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.2 } }
        }}
        className="container mx-auto px-6 pt-32 pb-40 max-w-[1000px] flex flex-col gap-12 text-center"
      >

        {/* Assembly Header */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="space-y-6 flex flex-col items-center"
        >

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(0,255,128,0.8)]" />
            <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Automated Intel Extraction</span>
          </div>
          <h1 className="text-5xl md:text-[5.5rem] font-black leading-tight tracking-[0.02em] uppercase mb-8 flex flex-wrap items-center justify-center gap-x-6">
            <span style={{ WebkitTextStroke: '2px white', paintOrder: 'stroke fill', color: 'transparent' }}>MATCH</span>
            <span style={{ WebkitTextStroke: '2px hsl(var(--primary))', paintOrder: 'stroke fill', color: 'transparent' }}>RESULTS.</span>
          </h1>

          {/* Centered Stats Bar */}
          <div className="flex items-center justify-center gap-12 bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-8 rounded-[32px] shadow-2xl">
            <StatItem label="Wkts" value={stats.totalWickets} delay={0.4} />
            <div className="w-px h-16 bg-white/5" />
            <StatItem label="Sixes" value={stats.six} delay={0.5} />
            <div className="w-px h-16 bg-white/5" />
            <StatItem label="Fours" value={stats.four} delay={0.6} />
          </div>
        </motion.div>

        {/* Massive Video Player */}
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.95, y: 40 },
            visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 1.2, ease: [0.23, 1, 0.32, 1] } }
          }}
          className="relative group rounded-[40px] overflow-hidden bg-black aspect-video border-2 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] w-full max-w-[1000px] mx-auto"
          onClick={handleVideoTap}
        >
          {data?.video_url ? (
            <video
              ref={videoRef}
              src={data.video_url}
              className="w-full h-full object-cover"
              controls={false}
              preload="auto"
              onClick={togglePlay}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/10 bg-[#080B12]">
              <Video className="w-24 h-24 mb-4" />
              <span className="uppercase tracking-[0.5em] text-xs font-black">Link Restricted</span>
            </div>
          )}

          {/* Premium Player Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 transition-opacity duration-700 flex flex-col justify-between p-10 md:opacity-0 group-hover:opacity-100 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between">
              <div className="px-5 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <span className="text-[11px] font-black tracking-widest text-white uppercase">High Fidelity Stream</span>
              </div>
            </div>

            {/* Controls UI */}
            <div className="flex flex-col gap-4 mt-auto w-full">
              {/* Seekbar Row */}
              <div className="flex flex-col gap-2">
                <div
                  ref={seekbarRef}
                  className={`relative h-2 rounded-full cursor-pointer group/seek transition-all duration-150 ${isDragging ? 'h-3' : 'hover:h-3'}`}
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  onMouseDown={handleSeekbarMouseDown}
                  onTouchStart={handleSeekbarTouchStart}
                  onMouseMove={(e) => {
                    if (!seekbarRef.current) return;
                    const rect = seekbarRef.current.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const safeDuration = duration || 1;
                    const hoverTime = (x / rect.width) * safeDuration;
                    setHoverTooltip({ x, time: hoverTime });
                  }}
                  onMouseLeave={() => setHoverTooltip(null)}
                >
                  {/* Hover Tooltip */}
                  {hoverTooltip && (
                    <div 
                      className="absolute bottom-full mb-3 -translate-x-1/2 bg-black/90 border border-white/20 text-white text-[10px] font-mono font-bold px-2 py-1 rounded pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-sm z-50"
                      style={{ left: `${hoverTooltip.x}px` }}
                    >
                      {Math.floor(hoverTooltip.time / 60)}:{String(Math.floor(hoverTooltip.time % 60)).padStart(2, '0')}
                    </div>
                  )}
                  {/* Buffered/progress fill */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[#00FF87] shadow-[0_0_16px_rgba(0,255,128,0.55)] transition-all"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                  {/* Draggable Thumb */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(0,255,128,0.9)] border-2 border-primary transition-all duration-100 ${isDragging ? 'scale-125' : 'scale-0 group-hover/seek:scale-100'}`}
                    style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono font-black text-white/40 tracking-widest px-0.5">
                  <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '00')}</span>
                  <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '00')}</span>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="flex items-center gap-3">
                {/* Skip Back 10s */}
                <button
                  onClick={() => skipTime(-10)}
                  title="Rewind 10 seconds (←)"
                  className="group relative w-12 h-12 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white/60 hover:text-primary hover:border-primary/40 hover:bg-primary/10 active:scale-90 transition-all outline-none"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="absolute -bottom-0.5 text-[7px] font-black tracking-tight text-white/30 group-hover:text-primary/60">10</span>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 shrink-0 rounded-full bg-primary flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,255,128,0.5)] hover:scale-105 active:scale-95 transition-all outline-none"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
                </button>

                {/* Skip Forward 10s */}
                <button
                  onClick={() => skipTime(10)}
                  title="Skip forward 10 seconds (→)"
                  className="group relative w-12 h-12 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white/60 hover:text-primary hover:border-primary/40 hover:bg-primary/10 active:scale-90 transition-all outline-none"
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="absolute -bottom-0.5 text-[7px] font-black tracking-tight text-white/30 group-hover:text-primary/60">10</span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Time display */}
                <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-white/30 tracking-wider">
                  <span className="text-white/60">{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                  <span>/</span>
                  <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                </div>

                {/* Fullscreen */}
                <button
                  className="w-10 h-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all outline-none"
                  onClick={() => videoRef.current?.requestFullscreen()}
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6 mt-[-30px] z-20 relative"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="relative"
          >
            <button
              onClick={handleDownloadVideo}
              className="group relative h-[56px] px-10 bg-[#00FF87] text-[#080B0F] font-semibold uppercase tracking-[3px] rounded-[14px] flex items-center justify-center gap-4 transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_35px_rgba(0,255,135,0.6)] overflow-hidden"
              style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px' }}
            >
              {/* Scanline Overlay */}
              <div className="absolute inset-0 hud-noise-overlay group-hover:opacity-30 transition-opacity" />

              {/* Inner Glow (Simulated) */}
              <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] pointer-events-none" />

              <div className="relative flex items-center gap-3">
                <Download className="w-5 h-5 stroke-[3px]" />
                <span className="mt-0.5">Download Highlight Reel</span>
              </div>
            </button>

            {/* Soft Outer Glow Pulse (Visible on hover) */}
            <div className="absolute inset-0 rounded-[14px] animate-glow-pulse-hud opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10" />
          </motion.div>

          <button
            onClick={handleCopyLink}
            className="group relative h-[56px] px-10 bg-[#111820] text-white border border-white/12 hover:border-[#00FF87] hover:text-[#00FF87] font-bold uppercase tracking-[3px] rounded-[14px] transition-all duration-300 flex items-center justify-center gap-4 overflow-hidden"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px' }}
          >
            {/* Scan Sweep Animation */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#00FF87]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            <div className="relative flex items-center gap-3">
              <Share2 className="w-5 h-5 transition-colors" />
              <span className="mt-0.5">Share Intel</span>
            </div>
          </button>
        </motion.div>

        {/* AI Journal - Expansive Layout */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.6 } }
          }}
          className="p-16 bg-[#080B12]/80 backdrop-blur-3xl border border-white/5 rounded-[48px] relative group text-left w-full max-w-[1000px] mx-auto mt-8 shadow-2xl"
        >
          <div className="absolute top-0 right-1/4 w-[30%] h-1.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(0,255,135,0.02),transparent_40%)] pointer-events-none rounded-[48px]" />

          <div className="flex flex-col items-center justify-center gap-12 mb-20 relative z-10 border-b border-white/5 pb-12 text-center">
            <div className="flex-1">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                <span className="text-[14px] font-black tracking-[0.4em] text-primary uppercase">Elite Match Intelligence</span>
              </div>
              <h2 className="text-4xl md:text-[5.5rem] font-bold tracking-tight uppercase leading-[1] text-white">
                MATCH <span className="text-primary">SUMMARY.</span>
              </h2>
            </div>
          </div>

          <div className="columns-1 md:columns-2 gap-16 font-serif text-white/60 text-[1.4rem] leading-[2.2] tracking-normal pt-4 relative z-10">
            {summaryText ? (
              summaryText.split('\n').filter(p => p.trim() !== '').slice(0, 10).map((para, i) => (
                <p key={i} className={`mb-10 ${i === 0 ? 'first-letter:text-[9rem] first-letter:font-black first-letter:text-primary first-letter:mr-8 first-letter:float-left first-letter:leading-[0.75] first-letter:font-sans' : ''}`}>
                  {para}
                </p>
              ))
            ) : (
              <p className="first-letter:text-[9rem] first-letter:font-black first-letter:text-primary first-letter:mr-8 first-letter:float-left first-letter:leading-[0.75] first-letter:font-sans">
                The engine identifies a masterclass in progress. Analysis reveals surgical precision in the batting department, with boundary frequencies surging in the second powerplay. Wickets fell at critical junctures, disrupting the momentum just as the run rate began to spiral.
              </p>
            )}
          </div>
        </motion.div>

      </motion.main>

      {/* Share UI */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={shareUrl}
        videoUrl={data?.video_url}
      />

      {/* Atmospheric Background */}
      <div className="fixed inset-0 -z-10 bg-[#05080F]">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[200px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>
    </div >
  );
};

export default ResultsPage;
