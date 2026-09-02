import React from 'react';
import { CameraLayout } from './types';

interface CameraLayoutControlProps {
  selected: CameraLayout;
  onChange: (val: CameraLayout) => void;
}

export const CameraLayoutControl: React.FC<CameraLayoutControlProps> = ({ selected, onChange }) => {
  const layouts = [
    { id: 'smart_focus', label: 'Smart focus', desc: 'AI keeps the ball and batsman centred.' },
    { id: 'split_stack', label: 'Split stack', desc: 'Live action on top, ambient replay below.' },
    { id: 'ambient', label: 'Ambient', desc: 'Centred wide shot with motion blur.' },
  ];

  const activeLayout = layouts.find(l => l.id === selected);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="text-[13px] font-bold text-[#2FE88A]" style={{ fontFamily: "'Archivo Expanded', sans-serif" }}>03</span>
        <span className="text-[13px] font-bold text-[#F2F5F3]">Camera layout</span>
      </div>
      <div className="flex bg-[#121615] border border-[#262E2C] rounded-[10px] p-[3px] gap-[3px]">
        {layouts.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id as CameraLayout)}
            className={`flex-1 border-none bg-transparent font-semibold text-[13px] px-2.5 py-2 rounded-[7px] cursor-pointer transition-all duration-150 ${
              selected === opt.id ? 'bg-[#2FE88A] text-[#06180F]' : 'text-[#8C9895] hover:text-[#F2F5F3]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="mt-2 text-[12px] text-[#5C6B67]">
        {activeLayout?.desc}
      </div>
    </div>
  );
};
