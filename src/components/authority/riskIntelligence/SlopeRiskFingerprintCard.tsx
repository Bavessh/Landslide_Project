import React from 'react';
import { SlopeRiskFingerprint, SensitivityLevel } from '../../../types';
import { Fingerprint, Mountain } from 'lucide-react';

interface Props {
  fingerprint: SlopeRiskFingerprint;
}

export const SlopeRiskFingerprintCard: React.FC<Props> = ({ fingerprint }) => {
  const getBadgeStyle = (level: SensitivityLevel) => {
    switch (level) {
      case 'VERY HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 65) return 'bg-orange-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  const items = [
    { label: 'Terrain Susceptibility', level: fingerprint.terrainSusceptibility, score: fingerprint.scores.terrain },
    { label: 'Rainfall Sensitivity', level: fingerprint.rainfallSensitivity, score: fingerprint.scores.rainfall },
    { label: 'Historical Instability', level: fingerprint.historicalInstability, score: fingerprint.scores.history },
    { label: 'Moisture Sensitivity', level: fingerprint.moistureSensitivity, score: fingerprint.scores.moisture },
    { label: 'Drainage Sensitivity', level: fingerprint.drainageSensitivity, score: fingerprint.scores.drainage },
    { label: 'Road-Cut Sensitivity', level: fingerprint.roadCutSensitivity, score: fingerprint.scores.roadCut }
  ];

  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-4 h-4 text-[#1D4E89]" />
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Slope Risk Fingerprint
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
            PROTOTYPE FINGERPRINT
          </span>
        </div>

        <p className="text-[11px] text-[#5F6877] mb-3">
          Unique morpho-geological vulnerability baseline for {fingerprint.locationName}
        </p>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#172033]">{item.label}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getBadgeStyle(item.level)}`}>
                  {item.level} ({item.score}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#DDE2E7] bg-slate-50 p-2 rounded text-[10px] text-[#5F6877]">
        <div className="flex items-center gap-1 font-semibold text-[#172033] mb-0.5">
          <Mountain className="w-3 h-3 text-[#1D4E89]" />
          <span>Geological Strata Profile:</span>
        </div>
        <p className="leading-tight">{fingerprint.geologicalProfile}</p>
      </div>
    </div>
  );
};
