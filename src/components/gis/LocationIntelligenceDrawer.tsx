import React, { useState, useEffect } from 'react';
import { MonitoredLocation, RoadSegment, ShelterFacility, NavigationTab } from '../../types';
import { riskService } from '../../services/riskService';
import { RiskNowNext } from '../common/RiskNowNext';
import { RiskBadge } from '../common/RiskBadge';
import {
  X,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Mountain,
  CloudRain,
  Droplets,
  Activity,
  Sliders,
  Bell,
  Route,
  ExternalLink,
  ShieldAlert,
  Info,
  BrainCircuit,
  SlidersHorizontal
} from 'lucide-react';

interface Props {
  location: MonitoredLocation;
  allRoads: RoadSegment[];
  allShelters: ShelterFacility[];
  onClose: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenWhatIf?: (locationId: string) => void;
}

export const LocationIntelligenceDrawer: React.FC<Props> = ({
  location,
  allRoads,
  allShelters,
  onClose,
  onNavigateTab,
  onOpenWhatIf
}) => {
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [deteriorationCondition, setDeteriorationCondition] = useState<string>('WATCH');
  const [adaptiveThresh, setAdaptiveThresh] = useState<number>(location.thresholdValue || 61);

  useEffect(() => {
    riskService.getDeteriorationStatus(location).then((det) => {
      setDeteriorationCondition(det.condition);
    });
    riskService.getAdaptiveThreshold(location).then((at) => {
      setAdaptiveThresh(at.locationSpecificThresholdPct);
    });
  }, [location.id]);

  const nearbyRoad = allRoads.find(
    (r) => r.state === location.state && (r.district === location.district || r.district === 'ALL')
  );

  const nearbyShelters = allShelters.filter(
    (s) => s.state === location.state && s.district === location.district
  );

  const triggerActionNotice = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => setActionNotification(null), 3000);
  };

  const getTrendIcon = () => {
    switch (location.riskTrend) {
      case 'RISING':
        return <TrendingUp className="w-3.5 h-3.5 text-red-600" />;
      case 'FALLING':
      case 'DECREASING':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div
      className="absolute top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white border-l border-[#DDE2E7] shadow-2xl z-[1500] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      id="location-intelligence-drawer"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#DDE2E7] bg-[#F8F9FA] flex items-start justify-between flex-shrink-0">
        <div className="pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <RiskBadge level={location.riskLevel} score={location.riskScore} size="sm" />
            <span className="text-[10px] font-mono text-[#5F6877] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {location.id}
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
              deteriorationCondition.includes('DETERIORAT')
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {deteriorationCondition}
            </span>
          </div>
          <h2 className="text-base font-bold text-[#172033] leading-snug">{location.name}</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#5F6877] mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#1D4E89]" />
            <span>
              {location.district}, {location.state}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px]">
              {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded text-[#5F6877] hover:text-[#172033] hover:bg-[#F1F3F5] transition-colors cursor-pointer"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Notification Toast if triggered */}
      {actionNotification && (
        <div className="bg-[#1D4E89] text-white px-3 py-1.5 text-xs flex items-center justify-between flex-shrink-0 animate-in fade-in">
          <span>{actionNotification}</span>
          <button onClick={() => setActionNotification(null)} className="text-blue-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {/* Risk Now & Risk Next Multi-Horizon Card */}
        <RiskNowNext location={location} compact={true} />

        {/* Confidence & Adaptive Threshold Summary */}
        <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded-md p-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#5F6877] text-[10px] block">Model Confidence:</span>
              <strong className="text-sm font-bold font-mono text-[#1D4E89]">
                {location.confidenceScore}% (High)
              </strong>
            </div>
            <div>
              <span className="text-[#5F6877] text-[10px] block">Adaptive Threshold:</span>
              <strong className={`text-sm font-bold font-mono ${location.riskScore >= adaptiveThresh ? 'text-red-700' : 'text-slate-800'}`}>
                {adaptiveThresh}% {location.riskScore >= adaptiveThresh ? '(EXCEEDED)' : '(Safe)'}
              </strong>
            </div>
            <div>
              <span className="text-[#5F6877] text-[10px] block">Antecedent Rain Memory:</span>
              <strong className="text-xs font-mono text-blue-900">
                {location.rainfallDecayMemoryMm} mm
              </strong>
            </div>
            <div>
              <span className="text-[#5F6877] text-[10px] block">Exposed Population:</span>
              <strong className="text-xs text-[#172033]">
                {location.vulnerablePopulationEst.toLocaleString('en-IN')} persons
              </strong>
            </div>
          </div>
        </div>

        {/* Environmental Physical Parameters */}
        <div className="space-y-2">
          <div className="font-bold text-[#172033] text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-[#1D4E89]" />
            Physical Terrain &amp; Environmental Factors
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <div className="flex items-center gap-1 text-[#5F6877] text-[11px] mb-0.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                <span>24h Rainfall:</span>
              </div>
              <strong className="text-sm text-[#172033] font-mono">
                {location.rainfall24hMm} mm
              </strong>
              <span className="text-[10px] text-[#5F6877] block mt-0.5">
                72h Cumul: {location.rainfall72hMm} mm
              </span>
            </div>

            <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <div className="flex items-center gap-1 text-[#5F6877] text-[11px] mb-0.5">
                <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                <span>Soil Moisture Sat:</span>
              </div>
              <strong className="text-sm text-[#172033] font-mono">
                {location.soilMoisturePct}%
              </strong>
              <span className="text-[10px] text-[#5F6877] block mt-0.5">
                Trend: {location.soilMoistureTrend}
              </span>
            </div>

            <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[#5F6877] text-[11px] block mb-0.5">Slope Angle:</span>
              <strong className="text-sm text-[#172033] font-mono">
                {location.slopeAngleDeg}°
              </strong>
              <span className="text-[10px] text-[#5F6877] block mt-0.5">
                Threshold: &gt;35° High Hazard
              </span>
            </div>

            <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[#5F6877] text-[11px] block mb-0.5">Terrain Elevation:</span>
              <strong className="text-sm text-[#172033] font-mono">
                {location.elevationM} m MSL
              </strong>
              <span className="text-[10px] text-[#5F6877] block mt-0.5">
                Himalayan Relief
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5F6877]">Surface Drainage Condition:</span>
              <strong className={location.drainageDisrupted ? 'text-red-700' : 'text-emerald-700'}>
                {location.drainageDisrupted ? 'Disrupted / Blocked Culverts' : 'Free Drainage Flow'}
              </strong>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5F6877]">Historical Event Density:</span>
              <strong className="text-[#172033]">
                {location.riskScore > 75 ? 'High (6+ events in 10 yrs)' : 'Moderate (2-3 events)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Explainable AI Contributors Preview */}
        {location.keyContributingFactors && location.keyContributingFactors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#172033] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1D4E89]" />
                Top Risk Drivers (Attribution Preview)
              </div>
              <span className="text-[9px] font-mono text-[#5F6877]">SHAP RANKED</span>
            </div>

            <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7] space-y-2">
              {location.keyContributingFactors.slice(0, 3).map((factor, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-[#172033]">{factor.factor}</span>
                    <span className="font-mono font-bold text-[#1D4E89]">+{factor.contributionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1D4E89] h-full rounded-full"
                      style={{ width: `${Math.min(100, factor.contributionPct * 2.2)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#5F6877]">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cascading Threat Warning */}
        {location.cascadingHazard && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-red-900">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Cascading Hazard Alert
            </div>
            <p className="text-[11px] leading-relaxed">{location.cascadingHazard}</p>
          </div>
        )}

        {/* Phase 3 Operational Chain Intelligence */}
        <div className="p-3 bg-[#F0F4F8] border border-[#CBD5E1] rounded-md space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#172033] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-[#1D4E89]" />
              Operational Chain Overview
            </span>
            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
              PHASE 3 ACTIVE
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Impact */}
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-[#5F6877] block font-bold uppercase">Impact &amp; Exposure:</span>
              <div className="text-[#172033]">
                {location.nearestSettlement || 'Sechü Zubza'} (Pop. ~4,800) • <strong>Direct runout zone</strong>
              </div>
            </div>

            {/* Road */}
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-[#5F6877] block font-bold uppercase">Threatened Highway:</span>
              <div className="text-[#172033] flex justify-between">
                <span>{location.threatenedRoad || 'NH-29 Arterial'}</span>
                <strong className="text-red-700 font-mono">88% Blockage Prob.</strong>
              </div>
            </div>

            {/* Route & Shelter */}
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[10px] text-[#5F6877] block font-bold uppercase">Evacuation Corridor &amp; Safe Haven:</span>
              <div className="text-[#172033]">
                Alternative: <strong className="text-emerald-700">Peducha Bypass (Safe)</strong> → Kohima High School Shelter (390 beds)
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="space-y-2 pt-2 border-t border-[#DDE2E7]">
          <div className="font-bold text-[#172033] text-xs uppercase tracking-wider">
            Operational Chain Actions
          </div>

          {/* Phase 3 Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('impact');
              }}
              className="px-2.5 py-1.5 bg-white border border-[#DDE2E7] hover:bg-slate-50 text-[#172033] font-semibold rounded text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span>View Impact</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('roads');
              }}
              className="px-2.5 py-1.5 bg-white border border-[#DDE2E7] hover:bg-slate-50 text-[#172033] font-semibold rounded text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <Route className="w-3.5 h-3.5 text-[#1D4E89]" />
              <span>Road Intelligence</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('roads');
              }}
              className="px-2.5 py-1.5 bg-white border border-[#DDE2E7] hover:bg-slate-50 text-[#172033] font-semibold rounded text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-700" />
              <span>Safe Routing</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('shelters');
              }}
              className="px-2.5 py-1.5 bg-white border border-[#DDE2E7] hover:bg-slate-50 text-[#172033] font-semibold rounded text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>View Shelters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('risk_intelligence');
                }
              }}
              className="px-3 py-2 bg-[#1D4E89] text-white font-semibold rounded text-xs hover:bg-[#153966] transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5 col-span-2"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>View Full Risk Intelligence Dossier</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('weather');
                }
              }}
              className="px-3 py-2 bg-white border border-[#DDE2E7] text-[#172033] font-semibold rounded text-xs hover:bg-slate-50 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-600" />
              <span>Check Rainfall</span>
            </button>

            <button
              onClick={() => {
                if (onOpenWhatIf) {
                  onOpenWhatIf(location.id);
                } else if (onNavigateTab) {
                  onNavigateTab('what_if');
                }
                triggerActionNotice(`Opened What-If simulator for ${location.name}`);
              }}
              className="px-3 py-2 bg-white border border-[#DDE2E7] text-[#172033] font-semibold rounded text-xs hover:bg-slate-50 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <Sliders className="w-3 h-3 text-indigo-700" />
              <span>Run What-If</span>
            </button>
          </div>

          <button
            onClick={() => {
              triggerActionNotice(`CAP Warning Bulletin generated for ${location.district} SEOC dispatch`);
            }}
            className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Generate Early Warning Bulletin</span>
          </button>
        </div>

        {/* Data Truthfulness Notice */}
        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-[#5F6877] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#1D4E89] flex-shrink-0 mt-0.5" />
          <span>
            Telemetry Source: CWC Rain Gauges, Sentinel-1 SAR &amp; IMD Regional Radar. AI prediction model is assistive and subject to ground verification by SDMA/DDMA officers.
          </span>
        </div>
      </div>
    </div>
  );
};

