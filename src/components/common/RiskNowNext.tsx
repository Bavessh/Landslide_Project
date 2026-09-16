import React, { useEffect, useState } from 'react';
import { MonitoredLocation, RiskNowNextData } from '../../types';
import { riskService } from '../../services/riskService';
import { RiskBadge } from './RiskBadge';
import { TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  location: MonitoredLocation;
  compact?: boolean;
  onSelectHorizon?: (horizon: '+6H' | '+12H' | '+24H') => void;
  selectedHorizon?: string;
  showPrototypeBadge?: boolean;
}

export const RiskNowNext: React.FC<Props> = ({
  location,
  compact = false,
  onSelectHorizon,
  selectedHorizon,
  showPrototypeBadge = true
}) => {
  const [data, setData] = useState<RiskNowNextData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    riskService.getRiskNowNext(location).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [location.id, location.riskScore, location.riskTrend]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'RISING':
        return <TrendingUp className="w-3.5 h-3.5 text-red-600 inline" />;
      case 'DECREASING':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-600 inline" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-amber-600 inline" />;
    }
  };

  if (loading || !data) {
    return (
      <div className="p-3 bg-white border border-[#DDE2E7] rounded text-xs text-[#5F6877] animate-pulse flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#1D4E89]" />
        Computing temporal risk projection (Now vs +6h, +12h, +24h)...
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white border border-[#DDE2E7] rounded p-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-bold text-[#172033]">
            <Clock className="w-3.5 h-3.5 text-[#1D4E89]" />
            <span>Temporal Risk Assessment</span>
          </div>
          {showPrototypeBadge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              PROTOTYPE FORECAST
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center">
          {/* NOW */}
          <div className="p-1.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <div className="text-[9px] font-bold text-[#5F6877] uppercase tracking-wider">NOW</div>
            <div className="text-xs font-bold text-[#172033] font-mono mt-0.5">
              {data.now.probabilityPct}%
            </div>
            <div className="mt-1">
              <RiskBadge level={data.now.riskLevel} size="sm" showDot={false} />
            </div>
            <div className="text-[9px] text-[#5F6877] mt-1 flex items-center justify-center gap-0.5">
              {getTrendIcon(data.now.trend)}
              <span>{data.now.trend}</span>
            </div>
          </div>

          {/* +6H */}
          <div
            onClick={() => onSelectHorizon && onSelectHorizon('+6H')}
            className={`p-1.5 rounded border transition-colors ${
              selectedHorizon === '+6H'
                ? 'bg-blue-50 border-[#1D4E89] ring-1 ring-[#1D4E89]'
                : 'bg-[#F8F9FA] border-[#DDE2E7] hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <div className="text-[9px] font-bold text-[#1D4E89] uppercase tracking-wider">+6 HOURS</div>
            <div className="text-xs font-bold text-[#172033] font-mono mt-0.5">
              {data.forecast.h6.probabilityPct}%
            </div>
            <div className="mt-1">
              <RiskBadge level={data.forecast.h6.riskLevel} size="sm" showDot={false} />
            </div>
            <div className="text-[9px] text-[#5F6877] mt-1 font-mono">
              Conf: {data.forecast.h6.confidenceScore}%
            </div>
          </div>

          {/* +12H */}
          <div
            onClick={() => onSelectHorizon && onSelectHorizon('+12H')}
            className={`p-1.5 rounded border transition-colors ${
              selectedHorizon === '+12H'
                ? 'bg-blue-50 border-[#1D4E89] ring-1 ring-[#1D4E89]'
                : 'bg-[#F8F9FA] border-[#DDE2E7] hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <div className="text-[9px] font-bold text-[#1D4E89] uppercase tracking-wider">+12 HOURS</div>
            <div className="text-xs font-bold text-[#172033] font-mono mt-0.5">
              {data.forecast.h12.probabilityPct}%
            </div>
            <div className="mt-1">
              <RiskBadge level={data.forecast.h12.riskLevel} size="sm" showDot={false} />
            </div>
            <div className="text-[9px] text-[#5F6877] mt-1 font-mono">
              Conf: {data.forecast.h12.confidenceScore}%
            </div>
          </div>

          {/* +24H */}
          <div
            onClick={() => onSelectHorizon && onSelectHorizon('+24H')}
            className={`p-1.5 rounded border transition-colors ${
              selectedHorizon === '+24H'
                ? 'bg-blue-50 border-[#1D4E89] ring-1 ring-[#1D4E89]'
                : 'bg-[#F8F9FA] border-[#DDE2E7] hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <div className="text-[9px] font-bold text-[#1D4E89] uppercase tracking-wider">+24 HOURS</div>
            <div className="text-xs font-bold text-[#172033] font-mono mt-0.5">
              {data.forecast.h24.probabilityPct}%
            </div>
            <div className="mt-1">
              <RiskBadge level={data.forecast.h24.riskLevel} size="sm" showDot={false} />
            </div>
            <div className="text-[9px] text-[#5F6877] mt-1 font-mono">
              Conf: {data.forecast.h24.confidenceScore}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded Standard View
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#1D4E89]" />
          <h3 className="text-xs font-bold text-[#172033] tracking-wide uppercase">
            Risk Now &amp; Risk Next (Temporal Dynamics)
          </h3>
        </div>
        {showPrototypeBadge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            PROTOTYPE RISK FORECAST
          </span>
        )}
      </div>

      {data.backendRisk && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
          <div><span className="text-[#5F6877] block">Risk Probability</span><strong>{data.backendRisk.probabilityPct}%</strong></div>
          <div><span className="text-[#5F6877] block">Risk Score</span><strong>{data.backendRisk.score}</strong></div>
          <div><span className="text-[#5F6877] block">Risk Level</span><strong>{data.backendRisk.level}</strong></div>
          <div><span className="text-[#5F6877] block">Confidence</span><strong>{data.backendRisk.confidencePct == null ? 'Not available' : `${data.backendRisk.confidencePct}%`}</strong></div>
          <div><span className="text-[#5F6877] block">Model</span><strong>{data.backendRisk.modelVersion}</strong></div>
          <div><span className="text-[#5F6877] block">Window / Time</span><strong>{data.backendRisk.predictionWindow} / {data.backendRisk.timestamp}</strong></div>
        </div>
      )}
      {data.backendRisk && <div className="text-[10px] text-sky-800 font-mono">PROJECT API • AI PREDICTION • AI estimate — not a guaranteed prediction.</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* RISK NOW */}
        <div className="p-3 bg-[#F8F9FA] rounded border border-[#DDE2E7] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#5F6877] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Risk Now</span>
              <span className="bg-slate-200 text-[#172033] text-[9px] px-1.5 py-0.2 rounded font-mono">
                CURRENT
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#172033]">
                {data.now.probabilityPct}%
              </span>
              <RiskBadge level={data.now.riskLevel} size="sm" />
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[#5F6877] text-[11px]">Temporal Trend:</span>
            <span className="font-semibold text-[#172033] flex items-center gap-1">
              {getTrendIcon(data.now.trend)}
              {data.now.trend}
            </span>
          </div>
        </div>

        {/* RISK NEXT +6H */}
        <div
          onClick={() => onSelectHorizon && onSelectHorizon('+6H')}
          className={`p-3 rounded border transition-all flex flex-col justify-between ${
            selectedHorizon === '+6H'
              ? 'bg-blue-50 border-[#1D4E89] ring-2 ring-[#1D4E89]'
              : 'bg-[#F8F9FA] border-[#DDE2E7] hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <div>
            <div className="text-[10px] font-bold text-[#1D4E89] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>+6 Hours</span>
              <span className="text-[9px] font-mono text-[#5F6877]">SHORT TERM</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#1D4E89]">
                {data.forecast.h6.probabilityPct}%
              </span>
              <RiskBadge level={data.forecast.h6.riskLevel} size="sm" />
            </div>
            <p className="text-[10px] text-[#5F6877] mt-1 line-clamp-1">
              {data.forecast.h6.primaryDriver}
            </p>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#5F6877]">
            <span>Model Confidence:</span>
            <span className="font-mono font-bold text-[#172033]">
              {data.forecast.h6.confidenceScore}%
            </span>
          </div>
        </div>

        {/* RISK NEXT +12H */}
        <div
          onClick={() => onSelectHorizon && onSelectHorizon('+12H')}
          className={`p-3 rounded border transition-all flex flex-col justify-between ${
            selectedHorizon === '+12H'
              ? 'bg-blue-50 border-[#1D4E89] ring-2 ring-[#1D4E89]'
              : 'bg-[#F8F9FA] border-[#DDE2E7] hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <div>
            <div className="text-[10px] font-bold text-[#1D4E89] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>+12 Hours</span>
              <span className="text-[9px] font-mono text-[#5F6877]">MID TERM</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#1D4E89]">
                {data.forecast.h12.probabilityPct}%
              </span>
              <RiskBadge level={data.forecast.h12.riskLevel} size="sm" />
            </div>
            <p className="text-[10px] text-[#5F6877] mt-1 line-clamp-1">
              {data.forecast.h12.primaryDriver}
            </p>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#5F6877]">
            <span>Model Confidence:</span>
            <span className="font-mono font-bold text-[#172033]">
              {data.forecast.h12.confidenceScore}%
            </span>
          </div>
        </div>

        {/* RISK NEXT +24H */}
        <div
          onClick={() => onSelectHorizon && onSelectHorizon('+24H')}
          className={`p-3 rounded border transition-all flex flex-col justify-between ${
            selectedHorizon === '+24H'
              ? 'bg-blue-50 border-[#1D4E89] ring-2 ring-[#1D4E89]'
              : 'bg-[#F8F9FA] border-[#DDE2E7] hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <div>
            <div className="text-[10px] font-bold text-[#1D4E89] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>+24 Hours</span>
              <span className="text-[9px] font-mono text-[#5F6877]">DAY OUTLOOK</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#1D4E89]">
                {data.forecast.h24.probabilityPct}%
              </span>
              <RiskBadge level={data.forecast.h24.riskLevel} size="sm" />
            </div>
            <p className="text-[10px] text-[#5F6877] mt-1 line-clamp-1">
              {data.forecast.h24.primaryDriver}
            </p>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#5F6877]">
            <span>Model Confidence:</span>
            <span className="font-mono font-bold text-[#172033]">
              {data.forecast.h24.confidenceScore}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
