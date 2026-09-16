import React from 'react';
import { MonitoredLocation, RoadSegment, ShelterFacility } from '../../types';
import { DataTruthfulnessBadge } from '../common/DataTruthfulnessBadge';
import {
  AlertTriangle,
  Mountain,
  CloudRain,
  Activity,
  Users,
  Waypoints,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';

interface Props {
  location: MonitoredLocation;
  allRoads: RoadSegment[];
  allShelters: ShelterFacility[];
  onClose: () => void;
  onSelectShelter?: (shelterId: string) => void;
}

export const LocationIntelligencePanel: React.FC<Props> = ({
  location,
  allRoads,
  allShelters,
  onClose
}) => {
  const nearbyRoad = allRoads.find(
    (r) => r.state === location.state && (r.district === location.district || r.district === 'ALL')
  );

  const nearbyShelters = allShelters.filter(
    (s) => s.state === location.state && s.district === location.district
  );

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'MODERATE':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="bg-[#FFFFFF] border-l border-[#DDE2E7] h-full flex flex-col w-full max-w-md shadow-lg overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#DDE2E7] bg-[#F8F9FA] sticky top-0 z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${getRiskColor(
                location.riskLevel
              )}`}
            >
              {location.riskLevel} RISK ({location.riskScore}%)
            </span>
            <DataTruthfulnessBadge provenance={location.dataProvenance} size="sm" />
          </div>
          <h3 className="text-base font-bold text-[#172033] leading-tight">{location.name}</h3>
          <p className="text-xs text-[#5F6877] mt-0.5">
            {location.district} District, {location.state} • Station ID: {location.id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-5 text-xs text-[#172033]">
        {/* OPERATIONAL 6-STAGE PIPELINE TRACKER */}
        <div className="bg-[#F1F3F5] p-3 rounded border border-[#DDE2E7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6877] mb-2">
            Disaster Intelligence Pipeline
          </div>
          <div className="grid grid-cols-6 gap-1 text-center font-mono text-[9px] font-bold">
            <div className="bg-white p-1 rounded border border-slate-300 text-slate-700">1. TERRAIN</div>
            <div className="bg-white p-1 rounded border border-slate-300 text-slate-700">2. WEATHER</div>
            <div className="bg-amber-100 p-1 rounded border border-amber-400 text-amber-900">3. AI RISK</div>
            <div className="bg-orange-100 p-1 rounded border border-orange-400 text-orange-900">4. IMPACT</div>
            <div className="bg-red-100 p-1 rounded border border-red-400 text-red-900">5. ROADS</div>
            <div className="bg-blue-100 p-1 rounded border border-blue-400 text-blue-900">6. ACTION</div>
          </div>
        </div>

        {/* 1. TERRAIN & SLOPE PHYSICAL FINGERPRINT */}
        <div>
          <div className="flex items-center gap-1.5 font-bold text-[#1D4E89] text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            <Mountain className="w-4 h-4 text-[#1D4E89]" />
            1. Terrain & Slope Fingerprint
          </div>
          <div className="grid grid-cols-2 gap-2 bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7]">
            <div>
              <span className="text-[#5F6877] block text-[11px]">Slope Inclination:</span>
              <span className="font-bold text-sm text-[#172033]">{location.slopeAngleDeg}°</span>
              <span className="text-[10px] text-red-600 block">(Critical if &gt;35°)</span>
            </div>
            <div>
              <span className="text-[#5F6877] block text-[11px]">Altitude / Elevation:</span>
              <span className="font-bold text-sm text-[#172033]">{location.elevationM} m MSL</span>
            </div>
            <div>
              <span className="text-[#5F6877] block text-[11px]">Soil Moisture Saturation:</span>
              <span className="font-bold text-sm text-[#172033]">{location.soilMoisturePct}%</span>
              <span className="text-[10px] text-amber-700 block">Status: {location.soilMoistureTrend}</span>
            </div>
            <div>
              <span className="text-[#5F6877] block text-[11px]">Natural Drainage:</span>
              <span
                className={`font-bold text-xs ${
                  location.drainageDisrupted ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {location.drainageDisrupted ? 'Blocked / Choked' : 'Operational'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. WEATHER & RAINFALL MEMORY */}
        <div>
          <div className="flex items-center gap-1.5 font-bold text-[#1D4E89] text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            <CloudRain className="w-4 h-4 text-[#1D4E89]" />
            2. Weather & Rainfall Memory Model
          </div>
          <div className="space-y-2 bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5F6877]">Recent Hourly Rain:</span>
              <span className="font-bold font-mono text-[#172033]">{location.rainfallCurrentMm} mm/h</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5F6877]">Cumulative 24h Rain:</span>
              <span className="font-bold font-mono text-[#172033]">{location.rainfall24hMm} mm</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5F6877]">Cumulative 72h Rain:</span>
              <span className="font-bold font-mono text-[#172033]">{location.rainfall72hMm} mm</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="font-semibold text-blue-900 flex items-center gap-1">
                Decaying Rainfall Memory:
              </span>
              <span className="font-bold font-mono text-blue-900">{location.rainfallDecayMemoryMm} mm</span>
            </div>
            <p className="text-[10px] text-[#5F6877] italic mt-1">
              *The Rainfall Memory Model captures delayed groundwater percolation and pore-pressure buildup.
            </p>
          </div>
        </div>

        {/* 3. EXPLAINABLE AI (XAI) - WHY IS RISK HIGH? */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-[#1D4E89] text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              3. Explainable AI: Factor Contributions
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Model Conf: {location.confidenceScore}%
            </span>
          </div>

          <div className="space-y-2 bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7]">
            {location.keyContributingFactors.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-[#172033]">{item.factor}</span>
                  <span className="font-mono font-bold text-indigo-900">+{item.contributionPct}%</span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1D4E89] h-full rounded-full"
                    style={{ width: `${item.contributionPct * 2}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-[#5F6877]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. EXPOSURE & POPULATION IMPACT */}
        <div>
          <div className="flex items-center gap-1.5 font-bold text-[#1D4E89] text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            <Users className="w-4 h-4 text-[#1D4E89]" />
            4. Exposure & Population Impact
          </div>
          <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#5F6877]">Estimated Exposed Population:</span>
              <span className="font-bold text-sm text-[#172033]">
                {location.vulnerablePopulationEst.toLocaleString('en-IN')} persons
              </span>
            </div>
            <div>
              <span className="text-[#5F6877] block text-[11px] mb-1">Threatened Critical Assets:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#172033]">
                {location.nearbyInfrastructure.map((infra, idx) => (
                  <li key={idx} className="font-medium">
                    {infra}
                  </li>
                ))}
              </ul>
            </div>
            {location.cascadingHazard && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-[11px]">
                <strong className="block font-bold mb-0.5">Cascading Secondary Hazard:</strong>
                {location.cascadingHazard}
              </div>
            )}
          </div>
        </div>

        {/* 5. ROAD CONNECTIVITY & SAFE ALTERNATIVE ROUTES */}
        <div>
          <div className="flex items-center gap-1.5 font-bold text-[#1D4E89] text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            <Waypoints className="w-4 h-4 text-[#1D4E89]" />
            5. Road Connectivity & Evacuation Corridor
          </div>
          {nearbyRoad ? (
            <div className="bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#1D4E89]">
                  {nearbyRoad.code} — {nearbyRoad.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    nearbyRoad.status === 'BLOCKED'
                      ? 'bg-red-100 text-red-800'
                      : nearbyRoad.status === 'CAUTION'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {nearbyRoad.status}
                </span>
              </div>
              <p className="text-[11px] text-[#5F6877]">{nearbyRoad.cause || 'No active blockages reported.'}</p>
              {nearbyRoad.bypassAvailable ? (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px]">
                  <strong>Recommended Safe Bypass:</strong> {nearbyRoad.bypassRouteName}
                  <span className="block text-[10px] text-emerald-700 mt-0.5">
                    Estimated detour: +{nearbyRoad.bypassAdditionalKm} km (Verified passable for light response vehicles)
                  </span>
                </div>
              ) : (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-900 text-[11px]">
                  <strong>Critical Severance:</strong> No viable bypass. Immediate road engineering clearance required.
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#5F6877] italic text-xs">No immediate arterial corridor affected directly.</p>
          )}
        </div>

        {/* 6. RECOMMENDED EVACUATION SHELTERS */}
        <div>
          <div className="flex items-center gap-1.5 font-bold text-[#1D4E89] text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            <ShieldCheck className="w-4 h-4 text-[#1D4E89]" />
            6. Designated Community Shelters
          </div>
          <div className="space-y-2">
            {nearbyShelters.map((shl) => (
              <div key={shl.id} className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7] space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#1D4E89]">{shl.name}</strong>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    {shl.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#5F6877]">
                  Capacity: {shl.currentOccupancy} / {shl.capacity} persons (
                  {Math.round((shl.currentOccupancy / shl.capacity) * 100)}% occupied)
                </div>
                <div className="text-[10px] text-[#5F6877]">
                  Officer in Charge: {shl.officerInCharge} ({shl.contactNumber})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
