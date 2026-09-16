import React, { useState, useEffect } from 'react';
import {
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  GISLayerToggles,
  LiveWeatherData,
  NavigationTab,
  TimeHorizon
} from '../../types';
import { NER_STATES_META } from '../../data/nerGeography';
import { weatherService } from '../../services/weatherService';
import { riskService } from '../../services/riskService';
import { NERLeafletMap } from '../gis/NERLeafletMap';
import { LocationIntelligenceDrawer } from '../gis/LocationIntelligenceDrawer';
import { WhatIfSimulationModal } from './WhatIfSimulationModal';
import { RiskBadge } from '../common/RiskBadge';
import { RiskNowNext } from '../common/RiskNowNext';
import {
  AlertTriangle,
  Sliders,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  CloudRain,
  ShieldCheck,
  Waypoints,
  Megaphone,
  RefreshCw,
  Layers,
  MapPin,
  CheckCircle2,
  Table,
  Home,
  FileSpreadsheet,
  BrainCircuit,
  Clock,
  Compass,
  ExternalLink,
  Info,
  ShieldAlert,
  Route,
  Building2
} from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  shelters: ShelterFacility[];
  fieldReports: FieldReport[];
  selectedLocation: MonitoredLocation | null;
  onSelectLocation: (loc: MonitoredLocation | null) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const AuthorityOverview: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  roads,
  shelters,
  fieldReports,
  selectedLocation,
  onSelectLocation,
  onNavigateTab
}) => {
  // Layer Toggles
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
    fieldReports: true,
    shelters: true,
    monitoredSlopes: true,
    roadNetwork: true,
    rainfallRadar: false
  });

  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [whatIfTargetLoc, setWhatIfTargetLoc] = useState<MonitoredLocation | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'map_centric' | 'dashboard'>('split');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('NOW');

  // Regional Risk Summary Data (Prototype for 8 NER States)
  const REGIONAL_STATE_SUMMARIES: {
    state: NERState;
    name: string;
    riskNow: number;
    riskNext: number;
    trend: 'RISING' | 'STEADY' | 'FALLING';
    criticalZones: number;
  }[] = [
    { state: 'Meghalaya', name: 'Meghalaya', riskNow: 85, riskNext: 91, trend: 'RISING', criticalZones: 5 },
    { state: 'Assam', name: 'Assam', riskNow: 82, riskNext: 88, trend: 'RISING', criticalZones: 4 },
    { state: 'Sikkim', name: 'Sikkim', riskNow: 81, riskNext: 86, trend: 'RISING', criticalZones: 4 },
    { state: 'Nagaland', name: 'Nagaland', riskNow: 79, riskNext: 83, trend: 'RISING', criticalZones: 3 },
    { state: 'Arunachal Pradesh', name: 'Arunachal Pradesh', riskNow: 78, riskNext: 84, trend: 'RISING', criticalZones: 3 },
    { state: 'Manipur', name: 'Manipur', riskNow: 74, riskNext: 77, trend: 'STEADY', criticalZones: 2 },
    { state: 'Mizoram', name: 'Mizoram', riskNow: 68, riskNext: 72, trend: 'RISING', criticalZones: 2 },
    { state: 'Tripura', name: 'Tripura', riskNow: 45, riskNext: 48, trend: 'STEADY', criticalZones: 1 }
  ];

  // Fetch Weather for current sector
  const fetchWeather = async () => {
    setIsWeatherLoading(true);
    let lat = 25.8;
    let lng = 93.2;

    if (selectedState !== 'ALL') {
      const meta = NER_STATES_META[selectedState];
      if (meta) {
        lat = meta.center[0];
        lng = meta.center[1];
      }
    }

    try {
      const data = await weatherService.getLiveWeatherForCoordinates(lat, lng);
      setLiveWeather(data);
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [selectedState, selectedDistrict]);

  const handleToggleLayer = (key: keyof GISLayerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenWhatIf = (loc: MonitoredLocation) => {
    setWhatIfTargetLoc(loc);
    setIsWhatIfOpen(true);
  };

  const triggerNotice = (text: string) => {
    setActionNotice(text);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Filtered Critical Slopes
  const criticalLocations = locations
    .filter((l) => l.riskLevel === 'CRITICAL' || l.riskLevel === 'HIGH')
    .sort((a, b) => b.riskScore - a.riskScore);

  const blockedRoads = roads.filter((r) => r.status === 'BLOCKED');
  const priorityLoc = selectedLocation || criticalLocations[0] || locations[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F7F9] relative overflow-hidden">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-[#1D4E89] text-white px-3 py-1.5 text-xs flex items-center justify-between z-40 sticky top-0 shadow-md">
          <span className="font-medium flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            {actionNotice}
          </span>
          <button onClick={() => setActionNotice(null)} className="text-blue-200 hover:text-white text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Status & View Mode Command Strip (Compact 30px) */}
      <div className="bg-white border-b border-[#DDE2E7] px-3 py-1 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#172033] uppercase tracking-wider text-[10px]">
            GIS Operational Command:
          </span>
          <span className="text-[#5F6877] text-[11px]">
            {selectedState === 'ALL'
              ? 'All 8 North Eastern States'
              : `Sector: ${selectedState} • ${selectedDistrict === 'ALL' ? 'All Districts' : selectedDistrict}`}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
            AI ESTIMATE (SUSCEPTIBILITY MODEL)
          </span>
        </div>

        {/* View Mode Switcher: Split Command, Full GIS Map, Analytics Desk */}
        <div className="flex items-center bg-[#F1F3F5] p-0.5 rounded border border-[#DDE2E7] text-[11px]">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
              viewMode === 'split' ? 'bg-white text-[#1D4E89] shadow-2xs' : 'text-[#5F6877] hover:text-[#172033]'
            }`}
            title="Side-by-side GIS map and operational priority cards"
          >
            Split Command
          </button>
          <button
            onClick={() => setViewMode('map_centric')}
            className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
              viewMode === 'map_centric' ? 'bg-white text-[#1D4E89] shadow-2xs' : 'text-[#5F6877] hover:text-[#172033]'
            }`}
            title="Maximized full-screen GIS map view"
          >
            Full GIS Map
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
              viewMode === 'dashboard' ? 'bg-white text-[#1D4E89] shadow-2xs' : 'text-[#5F6877] hover:text-[#172033]'
            }`}
            title="Reduced map with comprehensive analytics tables"
          >
            Analytics Desk
          </button>
        </div>
      </div>

      {/* Phase 2 Operational Metrics Strip */}
      <div className="bg-white border-b border-[#DDE2E7] px-3 py-1.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs select-none">
        <div className="bg-[#F8F9FA] p-1.5 rounded border border-[#DDE2E7]">
          <div className="flex justify-between items-center text-[9px] font-bold text-[#5F6877] uppercase">
            <span>Regional AI Risk</span>
            <span className="text-[8px] bg-red-100 text-red-800 px-1 py-0.1 rounded font-mono">NER-AVG</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <strong className="text-sm font-mono font-bold text-red-700">76%</strong>
            <span className="text-[10px] text-red-800 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 text-red-600 mr-0.5" /> High
            </span>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-1.5 rounded border border-[#DDE2E7]">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block truncate">
            Risk Now ({priorityLoc?.name ? priorityLoc.name.slice(0, 10) : 'Sector'})
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <strong className="text-sm font-mono font-bold text-red-700">
              {priorityLoc ? `${priorityLoc.riskScore}%` : '82%'}
            </strong>
            <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase bg-red-100 text-red-800">
              {priorityLoc ? priorityLoc.riskLevel : 'CRITICAL'}
            </span>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-1.5 rounded border border-[#DDE2E7]">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Risk Next (+6h)</span>
          <div className="flex items-center gap-1 mt-0.5">
            <strong className="text-sm font-mono font-bold text-red-800">
              {priorityLoc
                ? `${Math.min(99, priorityLoc.riskScore + (priorityLoc.riskTrend === 'RISING' ? 7 : -3))}%`
                : '88%'}
            </strong>
            <span className="text-[9px] text-red-700 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 text-red-600 mr-0.5" /> +7% Surge
            </span>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-1.5 rounded border border-[#DDE2E7]">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Critical Zones</span>
          <div className="flex items-center gap-1 mt-0.5">
            <strong className="text-sm font-mono font-bold text-[#172033]">{criticalLocations.length}</strong>
            <span className="text-[10px] text-amber-800 font-medium">Slopes in Hazard</span>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-1.5 rounded border border-[#DDE2E7]">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Roads at Risk</span>
          <div className="flex items-center gap-1 mt-0.5">
            <strong className="text-sm font-mono font-bold text-red-700">{blockedRoads.length} Blocked</strong>
            <span className="text-[10px] text-[#5F6877]">/ {roads.length} NHs</span>
          </div>
        </div>

        <div className="bg-[#F8F9FA] p-1.5 rounded border border-[#DDE2E7]">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Active Warnings</span>
          <div className="flex items-center gap-1 mt-0.5">
            <strong className="text-sm font-mono font-bold text-[#1D4E89]">5 Warnings</strong>
            <span className="text-[9px] font-semibold text-blue-900 bg-blue-50 px-1 rounded">CAP Live</span>
          </div>
        </div>
      </div>

      {/* Main Command Workspace */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* VIEW MODE: ANALYTICS DESK (Reduced map + full operational tables) */}
        {viewMode === 'dashboard' ? (
          <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3">
            {/* Contextual Reduced GIS Map Banner */}
            <div className="bg-white border border-[#DDE2E7] rounded-md overflow-hidden shadow-2xs">
              <div className="px-3 py-1.5 bg-[#F8F9FA] border-b border-[#DDE2E7] flex justify-between items-center text-xs">
                <span className="font-bold text-[#172033] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Contextual GIS Visualizer ({selectedState === 'ALL' ? 'NER Region' : `${selectedState}, ${selectedDistrict}`})
                </span>
                <span className="text-[10px] text-[#5F6877]">Reduced Viewport Mode</span>
              </div>
              <div className="h-60 relative">
                <NERLeafletMap
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  locations={locations}
                  roads={roads}
                  shelters={shelters}
                  fieldReports={fieldReports}
                  layerToggles={layerToggles}
                  onToggleLayer={handleToggleLayer}
                  selectedLocationId={selectedLocation?.id || null}
                  onSelectLocation={(loc) => onSelectLocation(loc)}
                  timeHorizon={timeHorizon}
                  onTimeHorizonChange={setTimeHorizon}
                />
              </div>
            </div>

            {/* Operational Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                <span className="text-[10px] text-[#5F6877] uppercase font-bold block">Monitored Slopes</span>
                <div className="text-xl font-bold text-[#172033] mt-1">{locations.length}</div>
                <div className="text-[10px] text-amber-700 mt-0.5">
                  {criticalLocations.length} Under Elevated Alert
                </div>
              </div>

              <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                <span className="text-[10px] text-[#5F6877] uppercase font-bold block">Lifeline Corridors</span>
                <div className="text-xl font-bold text-[#172033] mt-1">{roads.length} Arterials</div>
                <div className="text-[10px] text-red-700 mt-0.5">
                  {blockedRoads.length} Critical Blockages
                </div>
              </div>

              <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                <span className="text-[10px] text-[#5F6877] uppercase font-bold block">Evacuation Shelters</span>
                <div className="text-xl font-bold text-emerald-800 mt-1">{shelters.length} Designated</div>
                <div className="text-[10px] text-[#5F6877] mt-0.5">
                  Avg Occupancy: 34%
                </div>
              </div>

              <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                <span className="text-[10px] text-[#5F6877] uppercase font-bold block">Live Weather Feed</span>
                <div className="text-xl font-bold text-blue-900 mt-1">
                  {liveWeather?.precipitationMm ?? 12.4} mm/h
                </div>
                <div className="text-[10px] text-[#5F6877] mt-0.5">
                  Soil Saturation: {liveWeather?.soilMoistureEstPct ?? 78}%
                </div>
              </div>
            </div>

            {/* Comprehensive Operational Slopes Table */}
            <div className="bg-white border border-[#DDE2E7] rounded-md shadow-2xs overflow-hidden">
              <div className="px-3 py-2 bg-[#F8F9FA] border-b border-[#DDE2E7] flex justify-between items-center text-xs">
                <div className="font-bold text-[#172033] flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Monitored Slope Hazard Inventory (Ranked by Risk Score)
                </div>
                <span className="text-[10px] text-[#5F6877]">Showing {locations.length} Stations</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#DDE2E7] text-[10px] text-[#5F6877] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-1.5 px-3">Slope Station</th>
                      <th className="py-1.5 px-3">State &amp; District</th>
                      <th className="py-1.5 px-3">Risk Level</th>
                      <th className="py-1.5 px-3">Slope Angle</th>
                      <th className="py-1.5 px-3">24h Rainfall</th>
                      <th className="py-1.5 px-3">Antecedent Decay</th>
                      <th className="py-1.5 px-3">Soil Saturation</th>
                      <th className="py-1.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE2E7] text-[11px]">
                    {locations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-[#172033]">{loc.name}</td>
                        <td className="py-2 px-3 text-[#5F6877]">{loc.district}, {loc.state}</td>
                        <td className="py-2 px-3">
                          <RiskBadge level={loc.riskLevel} score={loc.riskScore} size="sm" />
                        </td>
                        <td className="py-2 px-3 font-mono">{loc.slopeAngleDeg}°</td>
                        <td className="py-2 px-3 font-mono">{loc.rainfall24hMm} mm</td>
                        <td className="py-2 px-3 font-mono">{loc.rainfallDecayMemoryMm} mm</td>
                        <td className="py-2 px-3 font-mono">{loc.soilMoisturePct}%</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => {
                              onSelectLocation(loc);
                              setViewMode('split');
                            }}
                            className="text-[#1D4E89] hover:underline font-semibold text-[10px] cursor-pointer"
                          >
                            Inspect in GIS
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE: SPLIT COMMAND & FULL GIS MAP */
          <div className="flex-1 flex flex-col lg:flex-row relative min-h-0">
            {/* GIS Map Viewport */}
            <div className="flex-1 relative flex flex-col min-h-0">
              <div className="flex-1 relative min-h-[380px]">
                <NERLeafletMap
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  locations={locations}
                  roads={roads}
                  shelters={shelters}
                  fieldReports={fieldReports}
                  layerToggles={layerToggles}
                  onToggleLayer={handleToggleLayer}
                  selectedLocationId={selectedLocation?.id || null}
                  onSelectLocation={(loc) => onSelectLocation(loc)}
                  timeHorizon={timeHorizon}
                  onTimeHorizonChange={setTimeHorizon}
                />

                {/* Over-the-map Location Intelligence Drawer */}
                {selectedLocation && (
                  <LocationIntelligenceDrawer
                    location={selectedLocation}
                    allRoads={roads}
                    allShelters={shelters}
                    onClose={() => onSelectLocation(null)}
                    onNavigateTab={onNavigateTab}
                    onOpenWhatIf={(locId) => {
                      const loc = locations.find((l) => l.id === locId) || selectedLocation;
                      handleOpenWhatIf(loc);
                    }}
                  />
                )}
              </div>

              {/* Regional Situation Brief Ticker Below Map (Truthful Demarcation) */}
              <div className="bg-white border-t border-[#DDE2E7] px-3 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis flex-1 min-w-[280px]">
                  <span className="font-bold text-red-700 flex items-center gap-1 uppercase text-[9px] bg-red-50 border border-red-200 px-1.5 py-0.2 rounded flex-shrink-0">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    SEOC BRIEF (DEMO FEED):
                  </span>
                  <span className="text-[#172033] font-medium text-[11px] truncate">
                    Active hazard in {criticalLocations[0]?.district || 'Dima Hasao'} ({criticalLocations[0]?.name || 'Jatinga Slopes'}) — 24h rainfall memory exceeding slope critical threshold.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-[10px] text-[#5F6877] flex-shrink-0">
                  <span>FIELD TEAMS: <strong>14 ACTIVE (SIMULATED)</strong></span>
                  <span>•</span>
                  <span>SATELLITE PASS: <strong>14:20 IST</strong></span>
                </div>
              </div>
            </div>

            {/* Split Command Operations Sidebar (Hidden in Full GIS Map mode) */}
            {viewMode === 'split' && (
              <div className="w-full lg:w-[380px] xl:w-[410px] bg-[#F8F9FA] border-l border-[#DDE2E7] flex flex-col overflow-y-auto p-2.5 space-y-2.5 flex-shrink-0 select-none">
                {/* Phase 2: Active Slope Intelligence Preview */}
                <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE2E7] mb-2">
                    <div className="flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-[#1D4E89]" />
                      <span className="font-bold text-xs text-[#172033]">
                        Active Slope Intelligence
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-[#1D4E89] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      AI INFERENCE
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-xs text-[#172033] block truncate font-bold">
                            {priorityLoc.name}
                          </strong>
                          <span className="text-[10px] text-[#5F6877]">
                            {priorityLoc.district}, {priorityLoc.state} • Elev {priorityLoc.elevationM}m • {priorityLoc.slopeAngleDeg}° Slope
                          </span>
                        </div>
                        <RiskBadge level={priorityLoc.riskLevel} score={priorityLoc.riskScore} size="sm" />
                      </div>
                    </div>

                    {/* Risk Now + Risk Next Quick Grid */}
                    <div className="grid grid-cols-2 gap-1.5 bg-[#F8F9FA] p-2 rounded border border-[#DDE2E7]">
                      <div>
                        <span className="text-[9px] text-[#5F6877] font-bold uppercase block">Risk Now</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <strong className="text-sm font-mono font-bold text-red-700">
                            {priorityLoc.riskScore}%
                          </strong>
                          <span className="text-[9px] font-semibold text-red-700">Current</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#5F6877] font-bold uppercase block">Risk Next (+6h)</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <strong className="text-sm font-mono font-bold text-red-800">
                            {Math.min(99, priorityLoc.riskScore + (priorityLoc.riskTrend === 'RISING' ? 7 : -3))}%
                          </strong>
                          <span className="text-[9px] font-semibold text-red-800 flex items-center">
                            {priorityLoc.riskTrend === 'RISING' ? (
                              <TrendingUp className="w-2.5 h-2.5 text-red-600 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-2.5 h-2.5 text-emerald-600 mr-0.5" />
                            )}
                            {priorityLoc.riskTrend}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 pt-1.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[#5F6877]">Rainfall 24h:</span>{' '}
                          <strong className="text-[#172033] font-mono">{priorityLoc.rainfall24hMm} mm</strong>
                        </div>
                        <div>
                          <span className="text-[#5F6877]">Rainfall Memory:</span>{' '}
                          <strong className="text-blue-900 font-mono">{priorityLoc.rainfallDecayMemoryMm} mm</strong>
                        </div>
                        <div>
                          <span className="text-[#5F6877]">Soil Saturation:</span>{' '}
                          <strong className="text-[#172033] font-mono">{priorityLoc.soilMoisturePct}%</strong>
                        </div>
                        <div>
                          <span className="text-[#5F6877]">AI Confidence:</span>{' '}
                          <strong className="text-emerald-800 font-mono">89.4%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Top Risk Driver & Recommended Action */}
                    <div className="bg-amber-50/70 border border-amber-200 rounded p-1.5 text-[10px] text-amber-900">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        Top Risk Driver:
                      </div>
                      <p className="mt-0.5 text-slate-700 leading-tight">
                        {priorityLoc.cascadingHazard || 'Prolonged rainfall decay memory with steep gradient and saturated regolith.'}
                      </p>
                      <div className="mt-1 pt-1 border-t border-amber-200/60 flex items-center justify-between text-[9px] font-semibold text-amber-900">
                        <span>STATUS: SENTINEL PATROL</span>
                        <span>DRONE RECON READY</span>
                      </div>
                    </div>

                    {/* Navigation Buttons to Phase 2 Tabs */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => onNavigateTab?.('risk_intelligence')}
                        className="p-1.5 bg-[#1D4E89] text-white font-semibold rounded hover:bg-[#153966] transition-colors cursor-pointer text-[10px] flex items-center justify-center gap-1"
                      >
                        <BrainCircuit className="w-3 h-3" />
                        Full Intelligence
                      </button>
                      <button
                        onClick={() => onNavigateTab?.('weather')}
                        className="p-1.5 bg-white border border-[#DDE2E7] text-[#1D4E89] font-semibold rounded hover:bg-slate-50 transition-colors cursor-pointer text-[10px] flex items-center justify-center gap-1"
                      >
                        <CloudRain className="w-3 h-3" />
                        Weather &amp; Memory
                      </button>
                    </div>
                  </div>
                </div>

                {/* Regional Risk Summary Table (8 NER States) */}
                <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE2E7] mb-1.5">
                    <div className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#1D4E89]" />
                      <span className="font-bold text-xs text-[#172033]">
                        NER Regional Risk Summary
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      PROTOTYPE REGIONAL RISK SUMMARY
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs max-h-44 overflow-y-auto">
                    {REGIONAL_STATE_SUMMARIES.map((s) => {
                      const isCurrent = selectedState === s.state;
                      return (
                        <div
                          key={s.state}
                          className={`py-1.5 px-1 flex items-center justify-between text-[11px] ${
                            isCurrent ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="truncate pr-1">
                            <span className="text-[#172033] block truncate">{s.name}</span>
                            <span className="text-[9px] text-[#5F6877]">
                              {s.criticalZones} Active Watchpoints
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono">
                            <span className="text-red-700 font-bold">Now: {s.riskNow}%</span>
                            <span className="text-red-800">Next: {s.riskNext}%</span>
                            <span
                              className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                                s.trend === 'RISING'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.trend}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sector Weather & Soil Moisture Snapshot */}
                <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE2E7] mb-2">
                    <div className="flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-[#1D4E89]" />
                      <span className="font-bold text-xs text-[#172033]">
                        Live Weather &amp; Soil Moisture
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        LIVE WEATHER (Open-Meteo)
                      </span>
                      <button
                        onClick={fetchWeather}
                        disabled={isWeatherLoading}
                        className="text-[#5F6877] hover:text-[#1D4E89] p-0.5 cursor-pointer"
                        title="Refresh Live Weather"
                      >
                        <RefreshCw className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {liveWeather ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDE2E7]">
                          <span className="text-[9px] text-[#5F6877] block">Temp</span>
                          <strong className="text-xs text-[#172033] font-mono">
                            {liveWeather.temperatureC}°C
                          </strong>
                        </div>
                        <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDE2E7]">
                          <span className="text-[9px] text-[#5F6877] block">Humidity</span>
                          <strong className="text-xs text-[#172033] font-mono">
                            {liveWeather.relativeHumidityPct}%
                          </strong>
                        </div>
                        <div className="bg-[#F8F9FA] p-1 rounded border border-[#DDE2E7]">
                          <span className="text-[9px] text-[#5F6877] block">Soil Sat</span>
                          <strong className="text-xs text-blue-900 font-mono">
                            {liveWeather.soilMoistureEstPct}%
                          </strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100">
                        <span className="text-[#5F6877] truncate">{liveWeather.weatherDescription}</span>
                        <span className="font-mono font-bold text-blue-900 flex-shrink-0">
                          {liveWeather.precipitationMm} mm/h
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#5F6877] italic py-1">
                      Acquiring meteorological feed...
                    </div>
                  )}
                </div>

                {/* Phase 3 Operational Chain Hub */}
                <div className="bg-[#F0F4F8] border border-[#CBD5E1] rounded-md p-2.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-[#172033] uppercase tracking-wider flex items-center gap-1">
                      <Route className="w-3.5 h-3.5 text-[#1D4E89]" />
                      Operational Chain (Phase 3)
                    </span>
                    <span className="text-[9px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded">
                      AI → SHELTER
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {/* Impact Link */}
                    <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#5F6877] font-bold block uppercase">Impact Analysis:</span>
                        <span className="font-semibold text-[#172033] text-[11px]">Sechü Zubza (~4.8k at risk)</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('impact');
                        }}
                        className="text-[10px] font-bold text-[#1D4E89] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Inspect <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Road Link */}
                    <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#5F6877] font-bold block uppercase">Threatened Arterial:</span>
                        <span className="font-semibold text-red-700 text-[11px]">NH-29 (88% Blockage Prob.)</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('roads');
                        }}
                        className="text-[10px] font-bold text-[#1D4E89] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Reroute <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Shelter Link */}
                    <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#5F6877] font-bold block uppercase">Safe Evacuation Shelter:</span>
                        <span className="font-semibold text-emerald-800 text-[11px]">Kohima High School (390 beds)</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('shelters');
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Shelters <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Emergency Operations Actions Hub */}
                <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                  <span className="font-bold text-[11px] text-[#172033] uppercase tracking-wider block mb-1.5">
                    Emergency Command Actions
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => triggerNotice('CAP Warning Bulletin broadcast initiated for active sector.')}
                      className="p-1.5 bg-[#1D4E89] text-white font-semibold rounded hover:bg-[#153966] transition-colors cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Megaphone className="w-3 h-3" />
                      Broadcast Alert
                    </button>

                    <button
                      onClick={() => triggerNotice('Sector Evacuation Protocol flagged for DDMA review.')}
                      className="p-1.5 bg-red-700 text-white font-semibold rounded hover:bg-red-800 transition-colors cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Evacuate Sector
                    </button>

                    <button
                      onClick={() => {
                        const target = criticalLocations[0] || locations[0];
                        if (target) handleOpenWhatIf(target);
                      }}
                      className="p-1.5 bg-white border border-[#DDE2E7] text-[#172033] font-semibold rounded hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1 col-span-2 text-[11px]"
                    >
                      <Sliders className="w-3 h-3 text-indigo-700" />
                      Open What-If Simulation on Priority Slope
                    </button>
                  </div>
                </div>

                {/* Top Critical Slopes Priority Watchlist */}
                <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE2E7] mb-1.5">
                    <h3 className="font-bold text-[11px] text-[#172033] uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Priority Slope Hazards ({criticalLocations.length})
                    </h3>
                    <span className="text-[9px] text-[#5F6877]">Ranked by Risk</span>
                  </div>

                  <div className="space-y-1.5">
                    {criticalLocations.slice(0, 4).map((loc) => {
                      const isSelected = selectedLocation?.id === loc.id;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => onSelectLocation(loc)}
                          className={`p-2 rounded border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#1D4E89] bg-blue-50/50 shadow-2xs'
                              : loc.riskLevel === 'CRITICAL'
                              ? 'border-red-200 bg-red-50/30 hover:border-red-400'
                              : 'border-orange-200 bg-orange-50/30 hover:border-orange-400'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <strong className="text-xs text-[#172033] font-bold block truncate">
                              {loc.name}
                            </strong>
                            <RiskBadge level={loc.riskLevel} score={loc.riskScore} size="sm" />
                          </div>

                          <div className="text-[10px] text-[#5F6877] mt-0.5 flex justify-between">
                            <span>
                              {loc.district}, {loc.state}
                            </span>
                            <span>Sat: {loc.soilMoisturePct}%</span>
                          </div>

                          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-[#1D4E89] font-medium">
                            <span>Inspect in GIS Drawer</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Arterial Road Network Status */}
                <div className="bg-white border border-[#DDE2E7] rounded-md p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE2E7] mb-1.5">
                    <div className="flex items-center gap-1">
                      <Waypoints className="w-3.5 h-3.5 text-[#1D4E89]" />
                      <span className="font-bold text-[11px] text-[#172033]">
                        Lifeline Highway Status
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-red-700">
                      {blockedRoads.length} Blocked
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {roads.slice(0, 3).map((road) => (
                      <div
                        key={road.id}
                        className="p-1.5 rounded bg-[#F8F9FA] border border-[#DDE2E7] flex items-center justify-between"
                      >
                        <div className="truncate pr-1">
                          <strong className="text-[#172033] block truncate text-[11px]">
                            {road.code} - {road.name}
                          </strong>
                          <span className="text-[9px] text-[#5F6877]">
                            {road.state} • Risk {road.blockageProbabilityPct}%
                          </span>
                        </div>

                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase flex-shrink-0 ${
                            road.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : road.status === 'CAUTION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {road.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* What-If Simulation Modal */}
      {whatIfTargetLoc && (
        <WhatIfSimulationModal
          location={whatIfTargetLoc}
          roads={roads}
          isOpen={isWhatIfOpen}
          onClose={() => {
            setIsWhatIfOpen(false);
            setWhatIfTargetLoc(null);
          }}
        />
      )}
    </div>
  );
};
