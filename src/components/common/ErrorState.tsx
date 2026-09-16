import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<Props> = ({
  title = 'Telemetry Synchronization Error',
  message = 'Unable to reach the meteorological or GIS layer server. Displaying verified local cached state.',
  onRetry
}) => {
  return (
    <div className="w-full p-4 bg-amber-50 border border-amber-300 rounded-md text-amber-900 flex items-start gap-3 text-xs">
      <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="font-bold text-xs text-amber-950">{title}</h4>
        <p className="text-[11px] text-amber-800 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-950 rounded font-semibold text-[11px] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    </div>
  );
};
