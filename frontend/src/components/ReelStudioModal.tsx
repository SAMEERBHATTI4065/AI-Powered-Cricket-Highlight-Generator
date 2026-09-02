import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Sparkles,
  Download,
  Share2,
  Play,
  Pause,
  Music,
  Layers,
  Type,
  Check,
  Copy,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Flame,
  Trophy,
  Zap,
  Target,
  Send,
  Sliders,
  Eye,
  Video
} from "lucide-react";

interface ReelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  shareToken?: string;
  videoUrl?: string;
  events: Array<{
    event_id: string | number;
    event_type: string;
    timestamp: number;
    current?: string;
    previous?: string;
    runs_added?: string;
  }>;
  initialEventId?: string | number | (string | number)[];
}

const PRESET_PUNCHLINES = [
  "⚡ WHAT A MONSTER SIX!",
  "💥 TIMBER! CLEAN BOWLED!",
  "🚀 102 METER MASSIVE HIT!",
  "🔥 ABSOLUTE CRICKET MASTERCLASS!",
  "👑 UNSTOPPABLE SHOT!",
  "🎯 SURGICAL PRECISION!"
];

export const ReelStudioModal = ({
  isOpen,
  onClose,
  sessionId,
  shareToken,
  videoUrl,
  events,
  initialEventId
}: ReelStudioModalProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string | number | (string | number)[]>(
    initialEventId !== undefined ? initialEventId : (events.length > 0 ? events[0].event_id : "top_montage")
  );
  const [editingStyle, setEditingStyle] = useState<"hyper_viral" | "cinematic" | "raw_action">("hyper_viral");
  const [layout, setLayout] = useState<"smart_crop" | "split_stack" | "ambient_blur">("smart_crop");
  const [captionStyle, setCaptionStyle] = useState<"kinetic_bold" | "minimal" | "none">("kinetic_bold");
  const [customCaption, setCustomCaption] = useState<string>("⚡ WHAT A MONSTER HIT!");
  const [hypeAudio, setHypeAudio] = useState(true);
  const [showMockUI, setShowMockUI] = useState(true);

  // Playback & Generation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // audio ON by default for merged reel
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedReel, setRenderedReel] = useState<{
    stream_url: string;
    download_url: string;
    reel_filename: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAutoTriggered = useRef(false);

  // When modal opens: reset rendered reel so phone starts blank
  useEffect(() => {
    if (isOpen) {
      setRenderedReel(null);
      setErrorMsg(null);
      setIsPlaying(false);
      setRenderProgress(0);
    }
  }, [isOpen]);

  // Synchronize when initialEventId changes
  useEffect(() => {
    if (initialEventId !== undefined) {
      setSelectedEventId(initialEventId);
      // Reset auto-trigger so new selections can auto-generate
      hasAutoTriggered.current = false;
    }
  }, [initialEventId]);



  // Set default punchline based on selected event
  useEffect(() => {
    if (Array.isArray(selectedEventId)) {
      setCustomCaption(`🔥 ${selectedEventId.length} SELECTED VIRAL MOMENTS!`);
      return;
    }
    if (selectedEventId === "top_montage") {
      setCustomCaption("🔥 TOP 3 VIRAL MATCH MOMENTS!");
      return;
    }
    const currentEv = events.find(e => String(e.event_id) === String(selectedEventId));
    if (currentEv) {
      const type = String(currentEv.event_type).toUpperCase();
      if (type === "SIX") setCustomCaption("⚡ WHAT A MONSTER SIX!");
      else if (type === "WICKET") setCustomCaption("💥 TIMBER! CLEAN BOWLED!");
      else if (type === "FOUR") setCustomCaption("🎯 SURGICAL BOUNDARY!");
      else setCustomCaption("🔥 UNBELIEVABLE ACTION!");
    }
  }, [selectedEventId, events]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle Play
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Generate Reel Handler (accepts optional overrides for instant re-rendering)
  const handleGenerateReel = async (overrides?: {
    editing_style?: string;
    layout?: string;
    event_id?: any;
  }) => {
    const targetEventId = overrides?.event_id !== undefined ? overrides.event_id : selectedEventId;
    const targetStyle = overrides?.editing_style || editingStyle;
    const targetLayout = overrides?.layout || layout;

    setIsRendering(true);
    setErrorMsg(null);
    setRenderProgress(10);

    const progressTimer = setInterval(() => {
      setRenderProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 600);

    try {
      const response = await fetch(`/api/results/${sessionId}/reels/generate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_id: targetEventId,
          aspect_ratio: "9:16",
          editing_style: targetStyle,
          layout: targetLayout,
          caption_style: captionStyle,
          custom_caption: customCaption,
          hype_audio: hypeAudio
        })
      });

      clearInterval(progressTimer);
      setRenderProgress(100);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to render viral reel");
      }

      const resData = await response.json();
      setRenderedReel({
        stream_url: resData.stream_url,
        download_url: resData.download_url,
        reel_filename: resData.reel_filename
      });

      // Automatically play the newly rendered reel
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during rendering.");
    } finally {
      setIsRendering(false);
    }
  };

  // Download Handler
  const handleDownload = () => {
    if (!renderedReel) {
      handleGenerateReel();
      return;
    }
    const a = document.createElement("a");
    a.href = renderedReel.download_url;
    a.download = `CricketAI_Reel_${selectedEventId}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy Link Handler
  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/results?session_id=${sessionId}${shareToken ? `&token=${shareToken}` : ""}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedEvent = events.find(e => String(e.event_id) === String(selectedEventId));
  const isSelectedMontage = selectedEventId === "top_montage";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-[#080D1A]/95 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative flex flex-col gap-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all z-20 border border-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-white/5 pb-6 text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold uppercase leading-[1] text-white flex justify-center items-center gap-2" style={{ letterSpacing: '0.06em' }}>
            <span>REELS & SHORTS</span> <span className="text-primary">GENERATOR.</span>
          </h2>
        </div>

        {/* Main Grid: Left (Phone Mockup) | Right (Controls) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: 9:16 Mobile Phone Mockup Simulator (Cols 5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            
            {/* Phone Case Container */}
            <div className="relative w-full max-w-[240px] sm:max-w-[260px] aspect-[9/16] bg-black rounded-[36px] p-1.5 sm:p-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] border-[6px] border-[#222] ring-1 ring-white/10 flex flex-col justify-between overflow-hidden group">
              
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/90 rounded-full border border-white/10 z-30 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-900/40 border border-blue-400/20" />
              </div>

              {/* Video Player Display Container */}
              <div
                className={`relative w-full h-full rounded-[28px] overflow-hidden bg-neutral-950 flex items-center justify-center ${
                  layout === "split_stack" ? "flex-col" : ""
                }`}
                onClick={() => { if (renderedReel) togglePlay(); }}
              >
                {renderedReel ? (
                  <>
                    {/* Main Video Element — displays clean rendered MP4 video without artificial CSS blur */}
                    <video
                      ref={videoRef}
                      src={renderedReel.stream_url}
                      className="relative z-10 w-full h-full object-cover cursor-pointer"
                      playsInline
                      loop
                      muted={isMuted}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                          videoRef.current.volume = 1.0;
                          videoRef.current.play().catch(() => {
                            if (videoRef.current) {
                              videoRef.current.muted = true;
                              setIsMuted(true);
                              videoRef.current.play().catch(() => {});
                            }
                          });
                        }
                      }}
                    />

                    {/* Overlaid Scorecard HUD (Bottom Bar) */}
                    {selectedEvent?.current && (
                      <div className="absolute bottom-11 left-3 right-3 z-20 flex justify-center pointer-events-none">
                        <div className="px-2.5 py-0.5 rounded-md bg-[#111820]/90 backdrop-blur-md border border-white/10 text-white/80 text-[8px] font-mono tracking-widest">
                          {selectedEvent.current}
                        </div>
                      </div>
                    )}

                    {/* Mute toggle top-right of phone */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted; }}
                      className="absolute top-8 right-2 z-40 w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:border-primary transition-all"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/60" /> : <Volume2 className="w-3.5 h-3.5 text-primary" />}
                    </button>

                    {/* Big Center Play/Pause Overlay */}
                    {!isPlaying && !isRendering && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-primary/90 text-black flex items-center justify-center shadow-[0_0_25px_rgba(0,255,135,0.8)]">
                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Placeholder Poster State before user clicks Generate */
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070A11] select-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,135,0.12),transparent_70%)] pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-primary shadow-[0_0_25px_rgba(0,255,135,0.25)]">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-black uppercase tracking-wider text-white mb-1.5">
                      {Array.isArray(selectedEventId)
                        ? `${selectedEventId.length} Clips Selected`
                        : selectedEventId === "top_montage"
                        ? "Top Moments Reel"
                        : "1 Event Selected"}
                    </div>
                    <p className="text-[10px] text-white/50 mb-5 max-w-[200px] font-mono leading-relaxed">
                      Select your AI Style & Layout, then click <span className="text-primary font-bold">MERGE REEL</span> below to render
                    </p>
                    <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,135,0.15)]">
                      <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                      <span>Ready to Render</span>
                    </div>
                  </div>
                )}

                {/* Rendering Progress Indicator Bar */}
                {isRendering && (
                  <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                      {Array.isArray(selectedEventId) 
                        ? `Merging ${selectedEventId.length} Clips (${renderProgress}%)`
                        : `Rendering 9:16 Reel (${renderProgress}%)`
                      }
                    </span>
                    <span className="text-[9px] text-white/60 font-mono">
                      Applying AI Pan & Scan + Layout Filters...
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-1" />
            </div>

          </div>

          {/* RIGHT: Creator Studio Controls (Cols 7) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Selected Clips Indicator & Toolbar */}
            <div className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {Array.isArray(selectedEventId)
                      ? `MERGING ${selectedEventId.length} SELECTED VERIFIED EVENTS`
                      : selectedEventId === "top_montage"
                      ? "TOP MATCH MOMENTS REEL"
                      : "SINGLE EVENT REEL"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const nextId = "top_montage";
                    setSelectedEventId(nextId);
                    if (renderedReel) {
                      handleGenerateReel({ event_id: nextId });
                    }
                  }}
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border transition-all ${
                    selectedEventId === "top_montage"
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-white/5 text-white/50 border-white/10 hover:text-white"
                  }`}
                >
                  Top 3 Montage
                </button>
              </div>

              {/* Event Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {events.map((ev, idx) => {
                  const clipId = ev.event_id !== undefined && ev.event_id !== null ? ev.event_id : idx;
                  const isSelected = Array.isArray(selectedEventId)
                    ? selectedEventId.some(id => String(id) === String(clipId))
                    : String(selectedEventId) === String(clipId);

                  const toggleInModal = () => {
                    let nextSelected: any;
                    if (Array.isArray(selectedEventId)) {
                      const exists = selectedEventId.some(id => String(id) === String(clipId));
                      if (exists) {
                        const next = selectedEventId.filter(id => String(id) !== String(clipId));
                        nextSelected = next.length > 0 ? next : "top_montage";
                      } else {
                        nextSelected = [...selectedEventId, clipId];
                      }
                    } else {
                      if (String(selectedEventId) === String(clipId)) {
                        nextSelected = "top_montage";
                      } else {
                        nextSelected = [selectedEventId, clipId].filter(id => id !== "top_montage");
                      }
                    }
                    setSelectedEventId(nextSelected);
                    if (renderedReel) {
                      handleGenerateReel({ event_id: nextSelected });
                    }
                  };

                  return (
                    <button
                      key={String(clipId)}
                      onClick={toggleInModal}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-primary text-black border-primary shadow-[0_0_10px_rgba(0,255,135,0.4)]"
                          : "bg-white/[0.04] text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-black ${
                        isSelected ? "bg-black text-primary" : "border border-white/30"
                      }`}>
                        {isSelected ? "✓" : idx + 1}
                      </span>
                      <span>{ev.event_type} • {ev.current || `Event #${idx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. AI Editing Style Selector */}
            <div className="space-y-3">
              <label className="text-sm sm:text-base font-black uppercase tracking-wider text-white/90 flex items-center gap-2">
                <span>AI EDITING STYLE</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "hyper_viral", label: "Hyper Viral", sub: "Fast cuts & meme SFX" },
                  { id: "cinematic", label: "Cinematic", sub: "Slow-mo & epic music" },
                  { id: "raw_action", label: "Raw Action", sub: "Unfiltered match vibe" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const nextStyle = item.id as any;
                      setEditingStyle(nextStyle);
                      if (renderedReel) {
                        handleGenerateReel({ editing_style: nextStyle });
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      editingStyle === item.id
                        ? "bg-primary/15 border-primary text-white shadow-[0_0_15px_rgba(0,255,135,0.2)]"
                        : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold uppercase">{item.label}</div>
                    <div className="text-[10px] text-white/40 mt-1">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Layout Engine */}
            <div className="space-y-3">
              <label className="text-sm sm:text-base font-black uppercase tracking-wider text-white/90 flex items-center gap-2">
                <span>AI CAMERA LAYOUT</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "smart_crop", title: "Smart Action\nFocus", desc: "AI center-tracks ball & batsman" },
                  { id: "split_stack", title: "Split-Stack\nDual", desc: "Action top + ambient replay" },
                  { id: "ambient_blur", title: "Ambient\nCanvas", desc: "Centered 16:9 with motion blur" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const nextLayout = item.id as any;
                      setLayout(nextLayout);
                      if (renderedReel) {
                        handleGenerateReel({ layout: nextLayout });
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      layout === item.id
                        ? "bg-primary/15 border-primary text-white"
                        : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold text-white whitespace-pre-line text-left leading-tight">{item.title}</div>
                    <div className="text-[10px] text-white/40 leading-tight mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>



            {/* 4. Audio Hype Engine Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm sm:text-base font-black uppercase text-white/90">AUDIO HYPE ENGINE</div>
                  <div className="text-xs text-white/50">Mix trending cricket bass beats with crowd roar</div>
                </div>
              </div>
              <button
                onClick={() => setHypeAudio(!hypeAudio)}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  hypeAudio ? "bg-primary" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    hypeAudio ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleGenerateReel}
                disabled={isRendering}
                className="flex-1 h-11 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,135,0.4)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {isRendering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering HD Reel ({renderProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>{renderedReel ? "RE-RENDER REEL" : "CREATE REEL"}</span>
                  </>
                )}
              </button>

              {/* Download MP4 Button */}
              {renderedReel && (
                <button
                  onClick={handleDownload}
                  className="h-11 px-5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Download MP4</span>
                </button>
              )}

              {/* Copy Share Link */}
              <button
                onClick={handleCopyLink}
                className="h-11 px-3.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs rounded-xl border border-white/5 flex items-center justify-center gap-1.5 transition-all"
                title="Copy shareable link"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px]">{copied ? "Copied" : "Share"}</span>
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReelStudioModal;
