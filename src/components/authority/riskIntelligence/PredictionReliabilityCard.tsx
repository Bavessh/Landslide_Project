import React from 'react';
import { PredictionReliability } from '../../../types';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  reliability: PredictionReliability;
}

export const PredictionReliabilityCard: React.FC<Props> = ({ reliability }) => {
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1D4E89]" />
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Confidence &amp; Warning Reliability
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
            CONFIDENCE AUDIT
          </span>
        </div>

        <p className="text-[11px] text-[#5F6877] mb-3">
          Statistical integrity evaluation of input sensors and empirical evidence
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Model Confidence:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-bold font-mono text-[#1D4E89]">
                {reliability.confidencePct}%
              </strong>
              <span className="text-[9px] text-emerald-700 font-semibold">High Credibility</span>
            </div>
          </div>

          <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Evidence Strength:</span>
            <div className="flex items-center gap-1 font-bold text-[#172033] mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{reliability.evidenceStrength}</span>
            </div>
          </div>

          <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Data Completeness:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-bold font-mono text-[#172033]">
                {reliability.dataCompletenessPct}%
              </strong>
              <span className="text-[9px] text-[#5F6877]">4 / 4 feeds</span>
            </div>
          </div>

          <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Warning Reliability:</span>
            <div className="flex items-center gap-1 font-bold text-[#1D4E89] mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{reliability.warningReliability}</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded space-y-1 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-[#5F6877]">False-Alarm Likelihood:</span>
            <span className="font-bold text-emerald-700 font-mono">LOW (&lt;8% historical)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#5F6877]">Telemetry Redundancy:</span>
            <span className="text-[#172033] font-medium">Dual CWC + IMD verification</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#DDE2E7] text-[10px] text-[#5F6877] flex items-start gap-1">
        <AlertCircle className="w-3 h-3 text-[#1D4E89] flex-shrink-0 mt-0.5" />
        <p className="leading-tight">{reliability.explanation}</p>
      </div>
    </div>
  );
};
