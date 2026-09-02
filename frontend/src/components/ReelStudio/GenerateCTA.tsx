import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ReelStudioState } from './types';

interface GenerateCTAProps {
  state: ReelStudioState;
  onShare: () => void;
}

export const GenerateCTA: React.FC<GenerateCTAProps> = ({ state, onShare }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const handleGenerate = () => {
    if (status === 'done') {
      // Logic to actually trigger a download
      alert("Downloading " + state.aspectRatio + " reel...");
      return;
    }
    
    setStatus('processing');
    // Mocking an export pipeline progress
    setTimeout(() => {
      setStatus('done');
    }, 5000);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleGenerate}
        disabled={status === 'processing'}
        className={`flex-1 rounded-xl font-bold text-[14.5px] p-[14px] transition-all duration-150 ${
          status === 'processing'
            ? 'bg-[#1B7A4E] text-[#06180F] cursor-wait'
            : status === 'done'
            ? 'bg-white text-black'
            : 'bg-[#2FE88A] text-[#06180F] hover:bg-[#3CFF9F] active:scale-[0.99]'
        }`}
      >
        {status === 'idle' && 'Generate reel'}
        {status === 'processing' && 'Rendering AI Reel...'}
        {status === 'done' && 'Download Reel'}
      </button>
      <button
        onClick={onShare}
        className="w-[52px] rounded-xl border border-[#262E2C] bg-[#121615] text-[#8C9895] flex items-center justify-center transition-all duration-150 hover:text-white hover:border-[#3a4441]"
        aria-label="Share"
      >
        <Share2 className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
};
