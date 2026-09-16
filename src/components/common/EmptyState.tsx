import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<Props> = ({
  title = 'No Monitored Records in Selected Boundary',
  description = 'No active slope sensors or road incidents registered for the current filter criteria.',
  onAction,
  actionLabel
}) => {
  return (
    <div className="w-full p-8 flex flex-col items-center justify-center text-center bg-[#F8F9FA] rounded-md border border-[#DDE2E7] space-y-2">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[#5F6877] mb-1">
        <Database className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-bold text-[#172033]">{title}</h4>
      <p className="text-[11px] text-[#5F6877] max-w-sm">{description}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-3 px-3 py-1.5 bg-[#1D4E89] hover:bg-[#153966] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
