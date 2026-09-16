import React, { useEffect, useState } from 'react';
import {
  MonitoredLocation,
  NERState,
  RiskTrendPoint,
  RiskExplanation,
  SlopeRiskFingerprint,
  AdaptiveThreshold,
  PredictionReliability,
  SlopeDeteriorationStatus,
  NavigationTab
} from '../../types';
import { riskService } from '../../services/riskService';
import { RiskNowNext } from '../common/RiskNowNext';
import { RiskBadge } from '../common/RiskBadge';
import { RiskTrendChart } from './riskIntelligence/RiskTrendChart';
import { SHAPContributionChart } from './riskIntelligence/SHAPContributionChart';
import { SlopeRiskFingerprintCard } from './riskIntelligence/SlopeRiskFingerprintCard';
import { AdaptiveThresholdCard } from './riskIntelligence/AdaptiveThresholdCard';
import { PredictionReliabilityCard } from './riskIntelligence/PredictionReliabilityCard';
import { SlopeDeteriorationCard } from './riskIntelligence/SlopeDeteriorationCard';
import {
  BrainCircuit,
  MapPin,
  ChevronDown,
  ArrowLeft,
  CloudRain,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Clock,
  Droplets
} from 'lucide-react';

interface Props {
  selectedLocation: MonitoredLocation | null;
  locations: MonitoredLocation[];
  selectedState: NERState;
  selectedDistrict: string;
  onSelectLocation: (loc: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

export const RiskIntelligencePage: React.FC<Props> = ({
  selectedLocation,
  locations,
  selectedState,
  selectedDistrict,
  onSelectLocation,
  onNavigateTab
}) => {
  // If no location is currently selected, pick the highest risk one from the filtered list
  const activeLocation =
    selectedLocation ||
    locations.filter(
      (l) =>
        l.state === selectedState &&
        (selectedDistrict === 'ALL' || l.district.toLowerCase() === selectedDistrict.toLowerCase())
    )[0] ||
    locations[0];

  const [trendData, setTrendData] = useState<RiskTrendPoint[]>([]);
  const [explanation, setExplanation] = useState<RiskExplanation | null>(null);
  const [fingerprint, setFingerprint] = useState<SlopeRiskFingerprint | null>(null);
  const [threshold, setThreshold] = useState<AdaptiveThreshold | null>(null);
  const [reliability, setReliability] = useState<PredictionReliability | null>(null);
  const [deterioration, setDeterioration] = useState<SlopeDeteriorationStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load all intelligence data when activeLocation changes
  useEffect(() => {
    if (!activeLocation) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      riskService.getRiskTrend(activeLocation),
      riskService.getRiskExplanation(activeLocation),
      riskService.getSlopeFingerprint(activeLocation),
      riskService.getAdaptiveThreshold(activeLocation),
      riskService.getPredictionReliability(activeLocation),
      riskService.getDeteriorationStatus(activeLocation)
    ]).then(([trend, expl, fp, thresh, rel, det]) => {
      if (isMounted) {
        setTrendData(trend);
        setExplanation(expl);
        setFingerprint(fp);
        setThreshold(thresh);
        setReliability(rel);
        setDeterioration(det);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeLocation?.id]);

  if (!activeLocation) {
    return (
      <div className="p-8 text-center text-[#5F6877]">
        <p>No monitored slope location available for the active sector.</p>
      </div>
    );
  }

  // Filter available slopes for location switch dropdown
  const availableLocations = locations.filter(
    (l) => l.state === selectedState && (selectedDistrict === 'ALL' || l.district.toLowerCase() === selectedDistrict.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F4F6F8] overflow-y-auto">
      {/* Top Context & Switcher Bar */}
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Back Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('overview')}
              className="p-1.5 rounded text-[#5F6877] hover:text-[#172033] hover:bg-[#F1F3F5] transition-colors cursor-pointer"
              title="Return to Command Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#1D4E89]" />
                <h1 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Explainable Risk Intelligence &amp; Prognosis
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#1D4E89] border border-blue-200">
                  SLOPE SECTOR AUDIT
                </span>
              </div>
              <p className="text-[11px] text-[#5F6877]">
                Multi-horizon probability forecasting, SHAP explainability drivers, and empirical stability metrics
              </p>
            </div>
          </div>

          {/* Location Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5F6877] font-semibold">Inspecting Slope:</span>
            <div className="relative">
              <select
                value={activeLocation.id}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) onSelectLocation(found);
                }}
                className="bg-white border border-[#DDE2E7] rounded px-3 py-1.5 text-xs font-semibold text-[#172033] shadow-xs cursor-pointer focus:outline-hidden focus:border-[#1D4E89] pr-8"
              >
                {availableLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.district}, {l.riskLevel} {l.riskScore}%)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6877] absolute right-2 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={() => onNavigateTab('weather')}
              className="px-2.5 py-1.5 bg-white border border-[#DDE2E7] text-[#172033] rounded text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
              title="View Detailed Rainfall & Hydrology"
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-600" />
              <span>Hydrology Telemetry</span>
            </button>

            <button
              onClick={() => onNavigateTab('overview')}
              className="px-2.5 py-1.5 bg-[#1D4E89] text-white rounded text-xs font-semibold hover:bg-[#153966] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>View On GIS Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Selected Location Metadata Strip */}
        <div className="mt-3 pt-2 border-t border-[#DDE2E7] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#172033]">{activeLocation.name}</span>
            <RiskBadge level={activeLocation.riskLevel} score={activeLocation.riskScore} size="sm" />
            <span className="text-[#5F6877] font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              Sector ID: {activeLocation.id}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[#5F6877] text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1D4E89]" />
              {activeLocation.district}, {activeLocation.state}
            </span>
            <span>•</span>
            <span className="font-mono">
              {activeLocation.lat.toFixed(4)}°N, {activeLocation.lng.toFixed(4)}°E
            </span>
            <span>•</span>
            <span>
              Elevation: <strong className="text-[#172033] font-mono">{activeLocation.elevationM} m</strong>
            </span>
            <span>•</span>
            <span>
              Slope Angle: <strong className="text-[#172033] font-mono">{activeLocation.slopeAngleDeg}°</strong>
            </span>
            <span>•</span>
            <span>
              24h Influx: <strong className="text-blue-700 font-mono">{activeLocation.rainfall24hMm} mm</strong>
            </span>
            <span>•</span>
            <span>
              Soil Moisture: <strong className="text-[#172033] font-mono">{activeLocation.soilMoisturePct}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="p-4 space-y-4">
        {/* 1. TOP: Risk Now & Risk Next component */}
        <RiskNowNext location={activeLocation} />

        {/* 2. CENTER: 2-Column Core Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* CENTER LEFT: Risk Trend Trajectory Chart (7 Cols) */}
          <div className="lg:col-span-7">
            <RiskTrendChart
              data={trendData}
              locationName={activeLocation.name}
              adaptiveThreshold={activeLocation.thresholdValue || 61}
            />
          </div>

          {/* CENTER RIGHT: SHAP Explainable AI Attributions (5 Cols) */}
          <div className="lg:col-span-5">
            {explanation ? (
              <SHAPContributionChart explanation={explanation} />
            ) : (
              <div className="bg-white border border-[#DDE2E7] rounded p-6 text-center text-xs text-[#5F6877]">
                Loading feature attributions...
              </div>
            )}
          </div>
        </div>

        {/* 3. BOTTOM: 4-Card Analytical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Slope Risk Fingerprint */}
          {fingerprint && <SlopeRiskFingerprintCard fingerprint={fingerprint} />}

          {/* Card 2: Adaptive Threshold */}
          {threshold && <AdaptiveThresholdCard threshold={threshold} />}

          {/* Card 3: Prediction Reliability */}
          {reliability && <PredictionReliabilityCard reliability={reliability} />}

          {/* Card 4: Slope Deterioration Detector */}
          {deterioration && <SlopeDeteriorationCard status={deterioration} />}
        </div>
      </div>
    </div>
  );
};
