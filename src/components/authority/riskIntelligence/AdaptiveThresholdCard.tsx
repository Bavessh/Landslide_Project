import React from 'react';
import { AdaptiveThreshold } from '../../../types';
import { Sliders, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Props {
  threshold: AdaptiveThreshold;
}

export const AdaptiveThresholdCard: React.FC<Props> = ({ threshold }) => {
  const isExceeded = threshold.status === 'EXCEEDED';
  const isWarning = threshold.status === 'WARNING_WINDOW';

  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#1D4E89]" />
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Location-Specific Adaptive Threshold
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
            PROTOTYPE ALGORITHM
          </span>
        </div>

        <p className="text-[11px] text-[#5F6877] mb-3">
          Calibrated against local slope geometry and historical rupture events
        </p>

        {/* Comparative Bars */}
        <div className="space-y-3">
          {/* Generic Regional Baseline */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#5F6877]">Generic Regional Threshold:</span>
              <span className="font-mono font-bold text-[#172033]">{threshold.regionalGenericThresholdPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-slate-400 h-full rounded-full"
                style={{ width: `${threshold.regionalGenericThresholdPct}%` }}
              />
            </div>
            <span className="text-[9px] text-[#5F6877] block">Standard fixed benchmark across all NER terrain</span>
          </div>

          {/* Adaptive Specific Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-[#1D4E89]">Adaptive Local Trigger Threshold:</span>
              <span className="font-mono font-bold text-[#1D4E89]">
                {threshold.locationSpecificThresholdPct}% ({threshold.deltaPct > 0 ? `+${threshold.deltaPct}` : threshold.deltaPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#1D4E89] h-full rounded-full"
                style={{ width: `${threshold.locationSpecificThresholdPct}%` }}
              />
            </div>
            <span className="text-[9px] text-[#1D4E89] font-medium block">
              Sensitive trigger adjusted to high slope angle &amp; weathered rock
            </span>
          </div>

          {/* Current Risk Level */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-[#172033]">Current AI Evaluated Risk:</span>
              <span className={`font-mono font-bold ${isExceeded ? 'text-red-700' : 'text-amber-700'}`}>
                {threshold.currentRiskPct}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isExceeded ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${threshold.currentRiskPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#DDE2E7] space-y-2">
        {/* Status Pill */}
        <div className={`p-2 rounded border flex items-center justify-between text-xs ${
          isExceeded
            ? 'bg-red-50 border-red-200 text-red-800'
            : isWarning
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {isExceeded ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {isExceeded ? 'Adaptive Threshold EXCEEDED' : isWarning ? 'Within Warning Window' : 'Below Threshold'}
            </span>
          </div>
          <span className="text-[10px] font-mono">
            {isExceeded ? `+${threshold.currentRiskPct - threshold.locationSpecificThresholdPct}% Over` : 'Safe Margin'}
          </span>
        </div>

        <p className="text-[10px] text-[#5F6877] leading-relaxed flex items-start gap-1">
          <Info className="w-3 h-3 text-[#1D4E89] flex-shrink-0 mt-0.5" />
          <span>{threshold.justification}</span>
        </p>
      </div>
    </div>
  );
};
