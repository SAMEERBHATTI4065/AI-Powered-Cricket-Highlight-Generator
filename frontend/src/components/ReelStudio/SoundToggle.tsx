import React from 'react';

interface SoundToggleProps {
  isOn: boolean;
  onToggle: (val: boolean) => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ isOn, onToggle }) => {
  return (
    <div className="flex items-center justify-between pt-1">
      <div>
        <div className="text-[13.5px] font-semibold text-[#F2F5F3]">Hype soundtrack</div>
        <div className="text-[12px] text-[#5C6B67] mt-0.5">Trending bass beat + crowd roar</div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!isOn)}
        className={`relative w-10 h-[22px] rounded-full border transition-all duration-200 shrink-0 ${
          isOn ? 'bg-[rgba(47,232,138,0.1)] border-[#2FE88A]' : 'bg-[#181D1C] border-[#262E2C]'
        }`}
      >
        <span
          className={`absolute top-[1px] w-4 h-4 rounded-full transition-all duration-150 ${
            isOn ? 'left-[20px] bg-[#2FE88A]' : 'left-[1px] bg-[#5C6B67]'
          }`}
        />
      </button>
    </div>
  );
};
