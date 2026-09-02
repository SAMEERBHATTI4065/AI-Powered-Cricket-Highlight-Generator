import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Check, Smartphone, Volume2, VolumeX, Video } from "lucide-react";

interface Event {
  event_id: string | number;
  event_type: string;
  timestamp: number;
  current?: string;
  previous?: string;
  runs_added?: string;
  clip_url?: string;
}

interface ClipsGalleryProps {
  events: Event[];
  onOpenStudio: (eventIds: string | number | (string | number)[]) => void;
  videoUrl?: string;
  onSeek?: (time: number, index?: number) => void;
}

import batsman1 from "../assets/covers/batsman_1.png";
import batsman2 from "../assets/covers/batsman_2.png";
import batsman3 from "../assets/covers/batsman_3.png";
import batsman4 from "../assets/covers/batsman_4.png";
import wicket1 from "../assets/covers/wicket_1.png";

const BATSMAN_COVERS = [
  batsman1,
  batsman2,
  batsman3,
  batsman4,
];

const WICKET_COVER = wicket1;

export const ClipsGallery = ({ events, onOpenStudio, videoUrl, onSeek }: ClipsGalleryProps) => {
  const [selectedClips, setSelectedClips] = useState<Set<string | number>>(new Set());
  const [playingClipId, setPlayingClipId] = useState<string | number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  const toggleClip = (id: string | number) => {
    const newSelected = new Set(selectedClips);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClips(newSelected);
  };

  const clearSelection = () => {
    setSelectedClips(new Set());
  };

  const isSelected = (id: string | number) => selectedClips.has(id);

  const handleCardClick = (ev: Event, index: number, clipId: string | number) => {
    if (playingClipId === clipId) {
      // Toggle off / pause
      if (activeVideoRef.current) {
        if (activeVideoRef.current.paused) {
          activeVideoRef.current.play().catch(() => {});
        } else {
          setPlayingClipId(null);
        }
      } else {
        setPlayingClipId(null);
      }
    } else {
      // Start inline clip playback
      setPlayingClipId(clipId);
      // Trigger seek on main video player if available
      if (onSeek) {
        onSeek(ev.timestamp, index);
      }
    }
  };

  return (
    <div className="w-full max-w-[480px] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[720px] mx-auto flex flex-col gap-4 sm:gap-6 mt-8 sm:mt-12 mb-6 sm:mb-8 font-sans">
      {/* Header section */}
      <div className="flex flex-col items-center justify-center text-center mb-1">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          Verified Event Clips & Reels
        </h2>
        <p className="text-white/50 text-xs sm:text-sm mt-1">
          Click any card to play its actual clip moment • Check corner to select for Viral Reel
        </p>
      </div>

      {/* Filmstrip Wrapper */}
      <div className="relative group">
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 snap-x snap-mandatory scrollbar-hide hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {events.map((ev, index) => {
            const clipId = ev.event_id !== undefined && ev.event_id !== null ? ev.event_id : index;
            const isWicket = String(ev.event_type).toUpperCase() === 'WICKET';
            const isSix = String(ev.event_type).toUpperCase() === 'SIX';
            const isFour = String(ev.event_type).toUpperCase() === 'FOUR' || String(ev.event_type).toUpperCase() === 'BOUNDARY';

            const badgeBg = isWicket ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 
                            isSix ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                            isFour ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            'bg-primary/20 text-primary border-primary/30';
            const selected = isSelected(clipId);
            const isPlaying = playingClipId === clipId;
            const coverSrc = isWicket ? WICKET_COVER : BATSMAN_COVERS[index % BATSMAN_COVERS.length];

            // Clip start and end window calculation
            const startTime = Math.max(0, ev.timestamp - 3);
            const endTime = ev.timestamp + 10;

            return (
              <motion.div
                key={String(clipId)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-none w-[130px] sm:w-[145px] aspect-[9/16] rounded-[14px] sm:rounded-[16px] overflow-hidden snap-start cursor-pointer border-2 transition-all duration-300 ${
                  isPlaying 
                    ? 'border-primary shadow-[0_0_30px_rgba(0,255,135,0.7)] ring-2 ring-primary' 
                    : selected 
                    ? 'border-primary/80 shadow-[0_0_20px_rgba(0,255,135,0.3)] ring-1 ring-primary/40' 
                    : 'border-white/10 hover:border-white/30'
                }`}
                onClick={() => handleCardClick(ev, index, clipId)}
              >
                {/* Background Video or Thumbnail Cover */}
                <div className="absolute inset-0 bg-[#0A0D14]">
                  {isPlaying && (ev.clip_url || videoUrl) ? (
                    <video
                      ref={(el) => {
                        if (el && isPlaying) {
                          activeVideoRef.current = el;
                          if (!ev.clip_url && Math.abs(el.currentTime - startTime) > 3) {
                            el.currentTime = startTime;
                          }
                          el.play().catch(() => {});
                        }
                      }}
                      src={ev.clip_url || `${videoUrl}#t=${startTime}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      playsInline
                      loop={!!ev.clip_url}
                      muted={isMuted}
                      onTimeUpdate={(e) => {
                        if (!ev.clip_url) {
                          const v = e.currentTarget;
                          if (v.currentTime >= endTime) {
                            v.currentTime = startTime;
                          }
                        }
                      }}
                    />
                  ) : (
                    <img 
                      src={coverSrc}
                      alt={`Clip ${clipId}`}
                      className="absolute inset-0 w-full h-full object-cover object-center opacity-70 transition-transform duration-500"
                      loading="lazy"
                    />
                  )}
                </div>
                
                {/* Overlay frame gradient */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

                {/* Event Badge / Live Playing Indicator */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                  {isPlaying ? (
                    <div className="px-2 py-0.5 rounded-md border border-primary/50 bg-primary/20 backdrop-blur-md text-[9px] font-black uppercase text-primary flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,135,0.4)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      <span>PLAYING</span>
                    </div>
                  ) : (
                    <div className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border backdrop-blur-md ${badgeBg}`}>
                      {ev.event_type}
                    </div>
                  )}
                </div>

                {/* Audio Mute/Unmute toggle on active playing card */}
                {isPlaying && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="absolute top-2.5 right-10 w-6 h-6 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:border-primary transition-colors z-10"
                    title={isMuted ? "Unmute sound" : "Mute sound"}
                  >
                    {isMuted ? <VolumeX className="w-3 h-3 text-white/60" /> : <Volume2 className="w-3 h-3 text-primary" />}
                  </button>
                )}

                {/* Selection Checkmark Badge */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleClip(clipId);
                  }}
                  title={selected ? "Selected for Reel" : "Click checkmark to select for Reel"}
                  className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center z-10 ${
                    selected ? 'bg-primary border-primary text-[#0A0D14] scale-110 shadow-[0_0_12px_rgba(0,255,135,0.8)]' : 'bg-black/60 border-white/30 text-transparent hover:border-white/60 hover:text-white/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>

                {/* Center Play/Pause Button Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                  <div className={`w-11 h-11 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all ${
                    isPlaying ? 'bg-black/60 text-primary border-primary shadow-[0_0_20px_rgba(0,255,135,0.6)]' : selected ? 'bg-primary/90 text-black border-primary shadow-[0_0_15px_rgba(0,255,135,0.6)]' : 'bg-black/50 text-white border-white/20 hover:scale-110'
                  }`}>
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    )}
                  </div>
                </div>

                {/* Event Metadata at bottom */}
                <div className="absolute bottom-3 left-2.5 right-2.5">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight mb-1 drop-shadow-md">
                    {ev.current || `Event #${index + 1}`}
                  </div>
                  <div className="text-[10px] text-white/60 font-mono font-bold flex items-center justify-between">
                    <span>{Math.floor(ev.timestamp)}s</span>
                    {ev.runs_added && parseInt(ev.runs_added) > 0 && (
                      <span className="text-primary font-black">+{ev.runs_added} Runs</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex flex-col items-center mt-2 relative z-20">
        <button
          onClick={() => {
            if (selectedClips.size > 0) {
              onOpenStudio(Array.from(selectedClips));
            } else {
              onOpenStudio('top_montage');
            }
          }}
          className="group relative w-full sm:w-auto h-11 sm:h-12 px-8 sm:px-12 bg-[#00FF87] text-[#080B0F] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center transition-all duration-300 hover:brightness-110 shadow-[0_0_25px_rgba(0,255,135,0.35)] hover:shadow-[0_0_35px_rgba(0,255,135,0.55)] active:scale-95 overflow-hidden text-[12px] sm:text-[14px]"
        >
          <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] pointer-events-none" />
          <span>CREATE REEL</span>
        </button>
      </div>
    </div>
  );
};

