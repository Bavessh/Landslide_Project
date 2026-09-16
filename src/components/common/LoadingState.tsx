import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<Props> = ({
  message = 'Loading GIS & Meteorological Telemetry...',
  minHeight = 'min-h-[220px]'
}) => {
  return (
    <div
      className={`w-full ${minHeight} flex flex-col items-center justify-center p-6 bg-[#F8F9FA] rounded-md border border-[#DDE2E7] text-center`}
    >
      <Loader2 className="w-7 h-7 text-[#1D4E89] animate-spin mb-3" />
      <span className="text-xs font-semibold text-[#172033] tracking-wide">{message}</span>
      <span className="text-[11px] text-[#5F6877] mt-1">
        Synchronizing with State Emergency Operations Center data layer...
      </span>
    </div>
  );
};
