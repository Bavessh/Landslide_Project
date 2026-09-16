import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface Props {
  isOnline?: boolean;
  latencyMs?: number;
}

export const ConnectivityIndicator: React.FC<Props> = ({
  isOnline = true,
  latencyMs = 38
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-[#5F6877] select-none">
      {isOnline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="font-semibold text-emerald-800">SEOC Live Ingestion</span>
          <span className="text-[10px] text-slate-400 font-mono">({latencyMs}ms)</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span className="font-semibold text-amber-800">Local Cached Mode</span>
        </>
      )}
    </div>
  );
};
