import React, { useState, useEffect } from 'react';
import {
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  TimeHorizon,
  ImpactAnalysis,
  AffectedSettlement,
  GISLayerToggles,
  NavigationTab
} from '../../types';
import { impactService } from '../../services/impactService';
import { NERLeafletMap } from '../gis/NERLeafletMap';
import { RiskBadge } from '../common/RiskBadge';
import {
  Users,
  Building2,
  Route,
  ShieldAlert,
  Hospital,
  GraduationCap,
  Home,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  shelters: ShelterFacility[];
  fieldReports: FieldReport[];
  selectedLocation: MonitoredLocation | null;
  onSelectLocation: (loc: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  selectedSettlement?: AffectedSettlement | null;
  onSelectSettlement?: (settlement: AffectedSettlement | null) => void;
}

export const ImpactAnalysisPage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  roads,
  shelters,
  fieldReports,
  selectedLocation,
  onSelectLocation,
  onNavigateTab,
  selectedSettlement: externalSelectedSettlement,
  onSelectSettlement
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('NOW');
  const [impactData, setImpactData] = useState<ImpactAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<AffectedSettlement | null>(null);

  // Layer toggles for the impact GIS map
  const [layerToggles, setLayerToggles] = useState<GISLayerToggles>({
    osm: true,
    topo: false,
    stateBoundaries: true,
    districtBoundaries: true,
    roads: true,
    settlements: true,
    hospitals: true,
    bridges: true,
    rivers: true,
    currentRisk: true,
    riskHeatmap: true,
    fieldReports: false,
    shelters: true,
    monitoredSlopes: true,
    roadNetwork: true,
    rainfallRadar: false
  });

  const activeLoc = selectedLocation || locations[0];

  useEffect(() => {
    if (!activeLoc) return;
    setIsLoading(true);
    impactService
      .getImpactAnalysis(activeLoc.id, timeHorizon)
      .then((data) => {
        setImpactData(data);
        const restoredSettlement = externalSelectedSettlement
          ? data.affectedSettlements.find((settlement) => settlement.id === externalSelectedSettlement.id)
          : undefined;
        const nextSettlement = restoredSettlement || data.affectedSettlements[0] || null;
        setSelectedSettlement(nextSettlement);
        if (nextSettlement?.id !== externalSelectedSettlement?.id) {
          onSelectSettlement?.(nextSettlement);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeLoc?.id, timeHorizon, externalSelectedSettlement?.id, onSelectSettlement]);

  const handleToggleLayer = (key: keyof GISLayerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const metrics = impactData?.metrics;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F7F9] overflow-hidden">
      {/* Top Context & Horizon Strip */}
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-[#172033] text-sm">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Impact Analysis</span>
          </div>
          <span className="text-[#5F6877]">•</span>
          <span className="font-semibold text-[#172033]">
            Active Hazard Zone: <span className="text-[#1D4E89]">{activeLoc?.name}</span>
          </span>
          <span className="text-slate-400">({activeLoc?.district}, {activeLoc?.state})</span>
          <RiskBadge level={activeLoc?.riskLevel || 'HIGH'} score={activeLoc?.riskScore || 85} size="sm" />
        </div>

        {/* Time Horizon Selector (NOW, +6H, +12H, +24H) */}
        <div className="flex items-center gap-1.5 bg-[#F1F3F5] p-1 rounded border border-[#DDE2E7]">
          <Clock className="w-3.5 h-3.5 text-[#5F6877] ml-1" />
          <span className="text-[10px] font-bold text-[#5F6877] uppercase mr-1">Forecast Horizon:</span>
          {(['NOW', '+6H', '+12H', '+24H'] as TimeHorizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setTimeHorizon(h)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                timeHorizon === h
                  ? 'bg-[#1D4E89] text-white shadow-xs'
                  : 'text-[#5F6877] hover:text-[#172033] hover:bg-white'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Main Impact Operational Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Metrics & Affected Settlements (Scrollable) */}
        <div className="w-full lg:w-[460px] xl:w-[500px] border-r border-[#DDE2E7] bg-white flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* Impact Metric Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Exposure Assessment
                </h3>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {metrics?.dataLabel || 'PROTOTYPE IMPACT ESTIMATE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Potentially Affected Population */}
                <div className="bg-[#FEF2F2] border border-red-200 rounded p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-red-800 font-semibold mb-1">
                    <span>Affected Population</span>
                    <Users className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-red-700">
                    {metrics ? metrics.potentiallyAffectedPopulation.toLocaleString() : '—'}
                  </div>
                  <div className="text-[10px] text-red-600 mt-0.5 flex items-center gap-1">
                    <span>Est. in direct runout zone</span>
                  </div>
                </div>

                {/* Settlements at Risk */}
                <div className="bg-[#FFF7ED] border border-orange-200 rounded p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-orange-800 font-semibold mb-1">
                    <span>Settlements at Risk</span>
                    <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <div className="text-xl font-bold font-mono text-orange-800">
                    {metrics ? metrics.settlementsAtRisk : '—'}
                  </div>
                  <div className="text-[10px] text-orange-700 mt-0.5">
                    Within 3.5km buffer
                  </div>
                </div>

                {/* Roads Exposed */}
                <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#172033] font-semibold mb-1">
                    <span>Road Corridors</span>
                    <Route className="w-3.5 h-3.5 text-[#1D4E89]" />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#172033]">
                    {metrics ? metrics.roadsExposed : 2}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                    1 Arterial Imminent Blockage
                  </div>
                </div>

                {/* Critical Infrastructure */}
                <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#172033] font-semibold mb-1">
                    <span>Critical Infrastructure</span>
                    <Hospital className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-lg font-bold font-mono text-[#172033]">
                    {metrics ? metrics.criticalInfrastructure : 2}
                  </div>
                  <div className="text-[10px] text-[#5F6877] mt-0.5">
                    Bridges &amp; Grid Towers
                  </div>
                </div>
              </div>

              {/* Sub-Metrics Row */}
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-center text-xs">
                <div className="bg-[#F8F9FA] border border-[#DDE2E7] p-1.5 rounded">
                  <span className="text-[10px] text-[#5F6877] block">Hospitals</span>
                  <span className="font-bold text-[#172033] font-mono">
                    {metrics?.hospitalsHealthFacilities || 2}
                  </span>
                </div>
                <div className="bg-[#F8F9FA] border border-[#DDE2E7] p-1.5 rounded">
                  <span className="text-[10px] text-[#5F6877] block">Schools / Halls</span>
                  <span className="font-bold text-[#172033] font-mono">
                    {metrics?.schoolsPublicFacilities || 2}
                  </span>
                </div>
                <div className="bg-[#F8F9FA] border border-[#DDE2E7] p-1.5 rounded">
                  <span className="text-[10px] text-[#5F6877] block">Nearby Shelters</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {metrics?.sheltersInExposureArea || 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Affected Settlements List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Affected Settlements ({impactData?.affectedSettlements.length || 0})
                </h3>
                <span className="text-[9px] text-[#5F6877]">Ranked by Proximity</span>
              </div>

              <div className="space-y-2">
                {impactData?.affectedSettlements.map((settlement) => {
                  const isSelected = selectedSettlement?.id === settlement.id;
                  return (
                    <div
                      key={settlement.id}
                      onClick={() => {
                        setSelectedSettlement(settlement);
                        if (onSelectSettlement) onSelectSettlement(settlement);
                      }}
                      className={`p-3 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EBF3FA] border-[#1D4E89] shadow-xs ring-1 ring-[#1D4E89]'
                          : 'bg-white border-[#DDE2E7] hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#172033]">
                              {settlement.name}
                            </span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
                              {settlement.distanceKm} km away
                            </span>
                          </div>
                          <span className="text-[11px] text-[#5F6877]">
                            {settlement.district}, {settlement.state}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              settlement.impactLevel === 'EXTREME'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : settlement.impactLevel === 'HIGH'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            Impact: {settlement.impactLevel}
                          </span>
                          <span className="text-[9px] font-mono text-[#5F6877]">
                            Pop: {settlement.estimatedPopulation.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 mb-2">
                        <div>
                          <span className="text-[#5F6877]">Hazard Exposure: </span>
                          <strong className={settlement.hazardExposure === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}>
                            {settlement.hazardExposure}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#5F6877]">Road Access: </span>
                          <strong className={settlement.roadAccess === 'SEVERED' || settlement.roadAccess === 'AT RISK' ? 'text-red-700' : 'text-emerald-700'}>
                            {settlement.roadAccess}
                          </strong>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#172033] leading-snug mb-2">
                        <strong>Protocol:</strong> {settlement.recommendedAction}
                      </p>

                      <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-slate-200">
                        <span className="font-mono text-emerald-800 font-semibold">
                          SOURCE: {settlement.sourceLabel}
                        </span>
                        <span className="text-[#1D4E89] font-semibold flex items-center gap-1">
                          Inspect on Map <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {impactData?.backendAffectedAssets && impactData.backendAffectedAssets.length > 0 && (
              <div className="border border-sky-200 bg-sky-50/40 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Backend Affected Assets</h3>
                  <span className="text-[9px] font-bold text-sky-800">PROJECT API</span>
                </div>
                <div className="space-y-1.5">
                  {impactData.backendAffectedAssets.map((asset) => (
                    <div key={asset.id} className="bg-white border border-sky-100 rounded p-2 text-[10px] grid grid-cols-2 gap-x-3 gap-y-1">
                      <strong className="text-[#172033]">{asset.name}</strong><span>{asset.assetType}</span>
                      <span>Distance: {asset.distanceM} m</span><span>Impact: {asset.impactLevel}</span>
                      <span>Priority: {asset.priority}</span><span>Status: {asset.impactStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infrastructure Exposure Details */}
            {impactData?.infrastructureExposure && (
              <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded-md p-3">
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Hospital className="w-3.5 h-3.5 text-indigo-700" />
                  Key Exposed Facilities
                </h4>

                <div className="space-y-1.5 text-xs">
                  {impactData.infrastructureExposure.hospitalsExposed.map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-[#DDE2E7]">
                      <div>
                        <span className="font-semibold text-[#172033] block text-[11px]">{h.name}</span>
                        <span className="text-[10px] text-[#5F6877]">{h.type} • {h.distanceKm} km</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {h.status}
                      </span>
                    </div>
                  ))}

                  {impactData.infrastructureExposure.criticalInfrastructure.map((c, i) => (
                    <div key={i} className="bg-white p-2 rounded border border-[#DDE2E7]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-[#172033] text-[11px]">{c.name}</span>
                        <span className="text-[9px] font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          {c.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-red-700 block">{c.hazardImpact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operational Chain Handoff Actions */}
            <div className="p-3 bg-[#EBF3FA] border border-[#B8D5E5] rounded-md space-y-2">
              <div className="font-bold text-xs text-[#1D4E89] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1D4E89]" />
                Next Chain Actions
              </div>
              <p className="text-[11px] text-[#172033]">
                Transition along the operational chain to check affected road corridors or activate safe shelter evacuations:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onNavigateTab('roads')}
                  className="px-3 py-2 bg-[#1D4E89] hover:bg-[#153966] text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Road Intelligence →</span>
                </button>

                <button
                  onClick={() => onNavigateTab('shelters')}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Evacuation Shelters →</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: GIS Map & Top Impact Ranking */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#E5E9EC] relative">
          {/* GIS Map Canvas */}
          <div className="flex-1 relative min-h-[350px]">
            <NERLeafletMap
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              locations={locations}
              roads={roads}
              shelters={shelters}
              fieldReports={fieldReports}
              layerToggles={layerToggles}
              onToggleLayer={handleToggleLayer}
              selectedLocationId={activeLoc.id}
              onSelectLocation={onSelectLocation}
              timeHorizon={timeHorizon}
              onTimeHorizonChange={setTimeHorizon}
            />

            {/* Selected Settlement Map Overlay Card */}
            {selectedSettlement && (
              <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-[#DDE2E7] shadow-lg rounded-md p-3 max-w-sm pointer-events-auto">
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#DDE2E7] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#1D4E89]" />
                    <span className="font-bold text-xs text-[#172033]">
                      {selectedSettlement.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    {selectedSettlement.impactLevel} IMPACT
                  </span>
                </div>

                <div className="text-[11px] space-y-1 text-[#172033]">
                  <div>Distance from Hazard: <strong>{selectedSettlement.distanceKm} km</strong></div>
                  <div>Estimated Population: <strong>{selectedSettlement.estimatedPopulation.toLocaleString()}</strong></div>
                  <div>Road Accessibility: <strong className="text-red-700">{selectedSettlement.roadAccess}</strong></div>
                  <p className="text-[10px] text-[#5F6877] pt-1">
                    {selectedSettlement.recommendedAction}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Shelf: Top Potentially Affected Locations across NER */}
          <div className="h-44 border-t border-[#DDE2E7] bg-white p-3 flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                <h4 className="font-bold text-xs text-[#172033] uppercase tracking-wider">
                  Top Potentially Affected Locations (NER Priority Index)
                </h4>
              </div>
              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                PROTOTYPE IMPACT RANKING
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[#5F6877] text-[10px] uppercase bg-slate-50">
                    <th className="py-1 px-2">Rank</th>
                    <th className="py-1 px-2">Location</th>
                    <th className="py-1 px-2">Sector</th>
                    <th className="py-1 px-2">Risk Score</th>
                    <th className="py-1 px-2">Population Exposure</th>
                    <th className="py-1 px-2">Road Access</th>
                    <th className="py-1 px-2">Composite Score</th>
                    <th className="py-1 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                  {impactData?.topRankedLocations.map((item) => (
                    <tr
                      key={item.locationId}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.locationId === activeLoc.id ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 font-mono font-bold text-[#1D4E89]">#{item.rank}</td>
                      <td className="py-1.5 px-2 text-[#172033]">{item.name}</td>
                      <td className="py-1.5 px-2 text-[#5F6877]">{item.district}, {item.state}</td>
                      <td className="py-1.5 px-2">
                        <span className="text-red-700 font-mono font-bold">{item.riskSeverityScore}%</span>
                      </td>
                      <td className="py-1.5 px-2 font-mono">{item.populationExposure.toLocaleString()}</td>
                      <td className="py-1.5 px-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          item.roadAccessibilityStatus === 'IMPEDED'
                            ? 'bg-amber-100 text-amber-800'
                            : item.roadAccessibilityStatus === 'SEVERED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.roadAccessibilityStatus}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-mono font-bold text-red-800">{item.compositeImpactScore}</td>
                      <td className="py-1.5 px-2 text-right">
                        <button
                          onClick={() => {
                            const found = locations.find((l) => l.id === item.locationId);
                            if (found) onSelectLocation(found);
                          }}
                          className="px-2 py-0.5 bg-white border border-[#DDE2E7] hover:bg-slate-50 text-[#1D4E89] text-[10px] rounded cursor-pointer font-semibold"
                        >
                          Select Location
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
