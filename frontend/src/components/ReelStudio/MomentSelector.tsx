import React from 'react';

// Using a simplified Event type matching what is passed from Results
interface Event {
  event_id: string | number;
  event_type: string;
  runs_added?: string;
  current?: string;
}

interface MomentSelectorProps {
  events: Event[];
  selectedId: string | number;
  onChange: (id: string | number) => void;
}

export const MomentSelector: React.FC<MomentSelectorProps> = ({ events, selectedId, onChange }) => {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="text-[13px] font-bold text-[#2FE88A]" style={{ fontFamily: "'Archivo Expanded', sans-serif" }}>01</span>
        <span className="text-[13px] font-bold text-[#F2F5F3]">Highlight moment</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => onChange('top_montage')}
          className={`flex-none px-3.5 py-2.5 rounded-[10px] border text-[13px] font-semibold whitespace-nowrap transition-all duration-150 ${
            selectedId === 'top_montage'
              ? 'bg-[rgba(47,232,138,0.1)] border-[#2FE88A] text-[#2FE88A]'
              : 'bg-[#121615] border-[#262E2C] text-[#8C9895]'
          }`}
        >
          ★ Top montage <span className={`ml-1.5 font-normal text-[11.5px] ${selectedId === 'top_montage' ? 'text-[#1B7A4E]' : 'text-[#5C6B67]'}`}>35s</span>
        </button>
        {events.map((ev) => (
          <button
            key={ev.event_id}
            onClick={() => onChange(ev.event_id)}
            className={`flex-none px-3.5 py-2.5 rounded-[10px] border text-[13px] font-semibold whitespace-nowrap transition-all duration-150 ${
              selectedId === ev.event_id
                ? 'bg-[rgba(47,232,138,0.1)] border-[#2FE88A] text-[#2FE88A]'
                : 'bg-[#121615] border-[#262E2C] text-[#8C9895]'
            }`}
          >
            {ev.event_type} <span className={`ml-1.5 font-normal text-[11.5px] ${selectedId === ev.event_id ? 'text-[#1B7A4E]' : 'text-[#5C6B67]'}`}>{ev.current || ev.runs_added || '0/0'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
