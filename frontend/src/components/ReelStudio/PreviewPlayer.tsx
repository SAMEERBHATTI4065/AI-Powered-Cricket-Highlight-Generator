import React, { useRef, useEffect } from 'react';
import { AspectRatio, CameraLayout, CaptionStyle } from './types';
import { Play } from 'lucide-react';

interface PreviewPlayerProps {
  aspectRatio: AspectRatio;
  cameraLayout: CameraLayout;
  captionStyle: CaptionStyle;
  hypeSoundTrack: boolean;
  videoUrl?: string;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  aspectRatio,
  cameraLayout,
  captionStyle,
  hypeSoundTrack,
  videoUrl
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Apply sound setting
  useEffect(() => {
    if (videoRef.current) {
      // In a real scenario, this might cross-fade an external audio track.
      // For now, we simulate it by toggling mute on the preview video.
      videoRef.current.muted = !hypeSoundTrack;
    }
  }, [hypeSoundTrack]);

  const aspectStyles = {
    '9:16': 'aspect-[9/16] w-[220px]',
    '1:1': 'aspect-square w-[280px]',
    '4:5': 'aspect-[4/5] w-[260px]',
  };

  const getLayoutStyles = () => {
    switch (cameraLayout) {
      case 'smart_focus':
        return 'scale-125 origin-center object-cover';
      case 'split_stack':
        return 'h-1/2 object-cover object-top';
      case 'ambient':
        return 'scale-90 object-contain drop-shadow-2xl';
      default:
        return 'object-cover';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3.5">
      <div 
        className={`relative rounded-[26px] border-[6px] border-[#1A1F1D] overflow-hidden shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${aspectStyles[aspectRatio]}`}
        style={{
          background: 'linear-gradient(180deg, #16382A 0%, #0E2119 45%, #1a1210 100%)'
        }}
      >
        {/* Ambient Blur Background (visible in ambient mode) */}
        {cameraLayout === 'ambient' && videoUrl && (
          <video 
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110"
            autoPlay loop muted playsInline
          />
        )}

        {/* Pitch strip aesthetic element */}
        <div className="absolute left-0 right-0 top-[52%] h-[22%] bg-gradient-to-b from-[#c94f6e] to-[#a83552] opacity-90 z-0" />

        {/* Main Video */}
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className={`absolute inset-0 w-full h-full z-10 transition-all duration-500 ${getLayoutStyles()}`}
            autoPlay loop playsInline
            muted={!hypeSoundTrack}
          />
        ) : (
          <div className={`absolute inset-0 w-full h-full z-10 bg-black/40 transition-all duration-500 ${getLayoutStyles()}`} />
        )}

        {/* Split Stack Bottom (simulated replay) */}
        {cameraLayout === 'split_stack' && (
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/80 z-10 flex items-center justify-center border-t border-white/10">
            <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">Alt Angle</span>
          </div>
        )}

        {/* Caption Overlay */}
        {captionStyle !== 'off' && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className={`text-center px-4 ${
              captionStyle === 'bold' 
                ? 'text-white font-black text-2xl uppercase italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] [text-shadow:_-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000]'
                : 'text-white font-medium text-lg bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5'
            }`}>
              <span className="animate-pulse">WHAT A SHOT!</span>
            </div>
          </div>
        )}

        {/* Top bar / Safe area simulation */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-30" />

        {/* Caption bar at bottom */}
        <div className="absolute left-3 right-3 bottom-4 bg-black/55 backdrop-blur-[6px] rounded-[10px] p-2.5 z-30 border border-white/5">
          <div className="text-[12.5px] font-bold leading-[1.3] text-white">
            <span className="text-[#2FE88A] mr-1">🔥</span>Top viral match moments!
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 text-[12.5px] text-[#5C6B67]">
        <button className="hover:text-white transition-colors">Play preview</button>
        <button className="hover:text-white transition-colors">Hide overlay</button>
      </div>
    </div>
  );
};
