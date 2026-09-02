import React from 'react';
import { AspectRatio } from './types';

interface AspectRatioControlProps {
  selected: AspectRatio;
  onChange: (val: AspectRatio) => void;
}

export const AspectRatioControl: React.FC<AspectRatioControlProps> = ({ selected, onChange }) => {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="text-[13px] font-bold text-[#2FE88A]" style={{ fontFamily: "'Archivo Expanded', sans-serif" }}>02</span>
        <span className="text-[13px] font-bold text-[#F2F5F3]">Aspect ratio</span>
      </div>
      <div className="flex bg-[#121615] border border-[#262E2C] rounded-[10px] p-[3px] gap-[3px]">
        {[
          { id: '9:16', label: '9:16 Vertical' },
          { id: '1:1', label: '1:1 Square' },
          { id: '4:5', label: '4:5 Portrait' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id as AspectRatio)}
            className={`flex-1 border-none bg-transparent font-semibold text-[13px] px-2.5 py-2 rounded-[7px] cursor-pointer transition-all duration-150 ${
              selected === opt.id ? 'bg-[#2FE88A] text-[#06180F]' : 'text-[#8C9895] hover:text-[#F2F5F3]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
