import React from 'react';
import { RiskExplanation } from '../../../types';
import { Sparkles, HelpCircle, AlertCircle } from 'lucide-react';

interface Props {
  explanation: RiskExplanation;
}

export const SHAPContributionChart: React.FC<Props> = ({ explanation }) => {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'RAINFALL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TERRAIN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ANTECEDENT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'GEOLOGY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DRAINAGE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#1D4E89]" />
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Why Is Risk High? (Explainable AI Attribution)
            </h3>
          </div>
          <p className="text-[11px] text-[#5F6877] mt-0.5">
            Feature importance ranking quantifying physical &amp; meteorological drivers
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#1D4E89] border border-blue-200">
          {explanation.isModelExplanation ? 'MODEL EXPLANATION' : 'PROTOTYPE EXPLANATION'}
        </span>
      </div>

      {/* Plain Language Summary Box */}
      <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7] mb-3 flex-shrink-0">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-[#1D4E89] flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-[#172033]">Operational Synthesis: </span>
            <span className="text-[#172033]">{explanation.summary}</span>
          </div>
        </div>
      </div>

      {/* Ranked Factors List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {explanation.contributions.map((c, index) => (
          <div key={index} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1D4E89] text-white flex items-center justify-center font-bold text-[10px]">
                  {index + 1}
                </span>
                <span className="font-bold text-[#172033]">{c.feature}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getCategoryBadge(
                    c.category
                  )}`}
                >
                  {c.category}
                </span>
              </div>
              <span className="font-mono font-bold text-[#1D4E89] text-xs">
                +{c.relativeImportancePct}% attribution
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-1">
              <div
                className="bg-[#1D4E89] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, c.relativeImportancePct * 2.8)}%` }}
              />
            </div>

            <p className="text-[11px] text-[#5F6877] mt-0.5 leading-tight">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="mt-3 pt-2.5 border-t border-[#DDE2E7] flex items-start gap-1.5 text-[10px] text-[#5F6877] flex-shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <span>{explanation.disclaimer}</span>
      </div>
    </div>
  );
};
