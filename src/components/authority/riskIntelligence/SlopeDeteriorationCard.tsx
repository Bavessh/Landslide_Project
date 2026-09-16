import React from 'react';
import { SlopeDeteriorationStatus } from '../../../types';
import { AlertTriangle, Clock, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  status: SlopeDeteriorationStatus;
}

export const SlopeDeteriorationCard: React.FC<Props> = ({ status }) => {
  const isSevere = status.condition === 'RAPID DETERIORATION' || status.condition === 'DETERIORATING';

  const getConditionStyle = () => {
    switch (status.condition) {
      case 'RAPID DETERIORATION':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'DETERIORATING':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'WATCH':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#1D4E89]" />
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Slope Deterioration Status
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
            DETERIORATION DETECTOR
          </span>
        </div>

        <p className="text-[11px] text-[#5F6877] mb-3">
          Early progressive structural weakening indicator tracking rate of risk escalation
        </p>

        {/* Status Badge */}
        <div className={`p-2.5 rounded border mb-3 flex items-center justify-between ${getConditionStyle()}`}>
          <div className="flex items-center gap-2">
            {isSevere ? (
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">{status.condition}</div>
              <div className="text-[10px] opacity-90 mt-0.5 font-medium">
                Protocol: {status.urgencyLevel}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded border border-current">
            {status.condition === 'RAPID DETERIORATION' ? '+8%/6h' : status.condition === 'DETERIORATING' ? '+5%/6h' : 'Stable'}
          </span>
        </div>

        {/* Trajectory progression */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between items-center text-[10px] text-[#5F6877]">
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3 h-3 text-[#1D4E89]" />
              Risk Escalation Velocity:
            </span>
            <span>-12h → -6h → NOW</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            {status.riskTrajectory.map((step, idx) => (
              <div key={idx} className="p-1.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="text-[9px] text-[#5F6877] uppercase font-bold">{step.label}</div>
                <div className="text-xs font-bold font-mono text-[#172033] mt-0.5">
                  {step.score}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contributing Dynamics */}
        <div className="space-y-1 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
          <div className="flex justify-between">
            <span className="text-[#5F6877]">Antecedent Memory:</span>
            <span className="font-semibold text-[#172033] flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3 text-red-600" />
              {status.rainfallMemoryTrend}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5F6877]">Drainage Obstruction:</span>
            <span className="font-semibold text-[#172033]">{status.drainageCondition}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#DDE2E7] text-[10px]">
        <span className="font-bold text-[#172033] block mb-0.5">Action Directive:</span>
        <p className="text-[#5F6877] leading-tight">{status.recommendation}</p>
      </div>
    </div>
  );
};
