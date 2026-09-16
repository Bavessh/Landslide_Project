import React, { useState } from 'react';
import { Info } from 'lucide-react';

export const PrototypeBadge: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-300 cursor-help select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        PROTOTYPE MODE
        <Info className="w-2.5 h-2.5 text-slate-500" />
      </span>

      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 p-2 bg-[#172033] text-white text-[11px] rounded shadow-lg border border-slate-700 pointer-events-none leading-tight">
          Environmental inputs may include historical, cached or simulated data during demonstration.
        </div>
      )}
    </div>
  );
};
