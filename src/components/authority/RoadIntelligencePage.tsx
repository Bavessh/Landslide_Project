import React, { useState, useEffect } from 'react';
import {
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  RoadRisk,
  AffectedSettlement,
  RoadStatus,
  RouteComparisonData,
  RouteOption,
  GISLayerToggles,
  NavigationTab
} from '../../types';
import { roadService } from '../../services/roadService';
import { routingService } from '../../services/routingService';
import { NERLeafletMap } from '../gis/NERLeafletMap';
import {
  Route,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  MapPin,
  Building2,
  ChevronRight,
  Sliders,
  ExternalLink,
  Zap,
  Home
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
  selectedRoad?: RoadRisk | null;
  selectedRoute?: RouteOption | null;
  onSelectRoad?: (road: RoadRisk) => void;
  onSelectRoute?: (route: RouteOption | null) => void;
}

export const RoadIntelligencePage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  roads,
  shelters,
  fieldReports,
  selectedLocation,
  onSelectLocation,
  onNavigateTab,
  selectedSettlement,
  selectedRoad: externalSelectedRoad,
  selectedRoute: externalSelectedRoute,
  onSelectRoad,
  onSelectRoute
}) => {
  const [roadRisks, setRoadRisks] = useState<RoadRisk[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<RoadRisk | null>(null);
  const [routeComparison, setRouteComparison] = useState<RouteComparisonData | null>(null);
  const [activeRouteTab, setActiveRouteTab] = useState<'A' | 'B'>('B');
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [simulationState, setSimulationState] = useState<'IDLE' | 'INVALIDATING' | 'RECALCULATING' | 'COMPLETED'>('IDLE');
  const [hasLiveRoutingKey, setHasLiveRoutingKey] = useState(false);

  // Map layer toggles
  const [layerToggles, setLayerToggles] = useState<GISLayerToggles>({
    osm: true,
    topo: false,
    stateBoundaries: true,
    districtBoundaries: true,
    roads: true,
    settlements: true,
    hospitals: false,
    bridges: true,
    rivers: false,
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
    setHasLiveRoutingKey(routingService.hasLiveRouting());

    roadService
      .getRoadRisks(
        selectedState === 'ALL' ? undefined : selectedState,
        selectedDistrict === 'ALL' ? undefined : selectedDistrict
      )
      .then((risks) => {
        setRoadRisks(risks);
        if (risks.length > 0) {
          const selectedRoadIsValid = externalSelectedRoad && risks.some((road) => road.roadId === externalSelectedRoad.roadId);
          const locationRoad = risks.find((road) => road.nearestHighRiskSlope.id === activeLoc?.id);
          const settlementRoad = selectedSettlement
            ? risks.find((road) => road.nearbySettlement.toLowerCase() === selectedSettlement.name.toLowerCase())
            : undefined;
          const match = selectedRoadIsValid
            ? externalSelectedRoad
            : locationRoad || settlementRoad || risks[0];
          setSelectedRoad(match);
          onSelectRoad?.(match);
          loadRouteComparison(match);
        }
      });
  }, [selectedState, selectedDistrict, activeLoc?.id, externalSelectedRoad?.roadId, selectedSettlement?.id]);

  const loadRouteComparison = async (road: RoadRisk) => {
    const origin = road.coordinates[0] || [25.684, 94.048];
    const destination = road.coordinates[road.coordinates.length - 1] || [25.667, 94.112];

    const comp = await routingService.getAlternativeRoutes(
      origin,
      destination,
      road.nearbySettlement,
      'Sector Designated Safe Haven',
      activeLoc
    );
    setRouteComparison(comp);
    const restoredRoute = externalSelectedRoute && [comp.primaryRoute, comp.alternativeRoute]
      .find((route) => route.id === externalSelectedRoute.id);
    const activeRoute = restoredRoute ||
      (comp.primaryRoute.isRecommended ? comp.primaryRoute : comp.alternativeRoute);
    setActiveRouteTab(activeRoute.id === comp.primaryRoute.id ? 'A' : 'B');
    onSelectRoute?.(activeRoute);
    setSimulationState('IDLE');
  };

  const handleSelectRoad = (road: RoadRisk) => {
    setSelectedRoad(road);
    onSelectRoad?.(road);
    onSelectRoute?.(null);
    loadRouteComparison(road);
  };

  const handleSelectRoute = (route: RouteOption, tab: 'A' | 'B') => {
    setActiveRouteTab(tab);
    onSelectRoute?.(route);
  };

  const handleToggleLayer = (key: keyof GISLayerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Run dynamic evacuation route failure simulation
  const handleSimulateFailure = () => {
    if (!routeComparison) return;

    setIsSimulatingFailure(true);
    setSimulationState('INVALIDATING');
    setActiveRouteTab('A'); // Show failing route first

    // Step 1: Invalidate Route A after 1.2s
    setTimeout(() => {
      setSimulationState('RECALCULATING');

      // Step 2: Recalculating safer route after 1.8s
      setTimeout(() => {
        setSimulationState('COMPLETED');
        setActiveRouteTab('B'); // Switch to Route B
        onSelectRoute?.(routeComparison.alternativeRoute);
        setIsSimulatingFailure(false);

        // Mark road as blocked in roadService
        if (selectedRoad) {
          roadService.setSimulatedFailure(selectedRoad.roadId, true);
        }
      }, 1600);
    }, 1400);
  };

  const handleResetSimulation = () => {
    setSimulationState('IDLE');
    if (selectedRoad) {
      roadService.setSimulatedFailure(selectedRoad.roadId, false);
      loadRouteComparison(selectedRoad);
    }
  };

  // Active route line to display on map
  const activeRouteObj =
    activeRouteTab === 'A' ? routeComparison?.primaryRoute : routeComparison?.alternativeRoute;

  const mapRouteLine = activeRouteObj
    ? {
        coordinates: activeRouteObj.coordinates,
        isRecommended: activeRouteObj.isRecommended && simulationState !== 'INVALIDATING',
        label: `${activeRouteObj.name} • ${activeRouteObj.distanceKm} km`
      }
    : null;

  const mapFailedLine =
    simulationState === 'INVALIDATING' || simulationState === 'COMPLETED'
      ? {
          coordinates: routeComparison?.primaryRoute.coordinates || [],
          label: 'Direct corridor segment invalidated by predicted landslide'
        }
      : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F7F9] overflow-hidden">
      {/* Top Banner & Operational Chain Title */}
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-[#172033] text-sm">
            <Route className="w-4 h-4 text-[#1D4E89]" />
            <span>Road &amp; Connectivity Intelligence</span>
          </div>
          <span className="text-[#5F6877]">•</span>
          <span className="font-semibold text-[#172033]">
            Question: <span className="text-red-700">Which roads may become unsafe?</span>
          </span>
          <span className="text-slate-400">
            ({selectedState === 'ALL' ? 'All NER Corridors' : `${selectedState} Sector`})
          </span>
        </div>

        {/* Live ORS API Key Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
              hasLiveRoutingKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-[#5F6877] border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasLiveRoutingKey ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {hasLiveRoutingKey
              ? 'LIVE ROUTING (OpenRouteService API Connected)'
              : 'MAPPED CORRIDOR WAYPOINTS (Live Routing API Optional)'}
          </span>
        </div>
      </div>

      {/* Main Workspace: Left Intelligence Column + Right GIS & Comparison */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Road Risk Inventory & Intelligence Panel */}
        <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-[#DDE2E7] bg-white flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* Road Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Monitored Arterials &amp; Lifelines ({roadRisks.length})
                </h3>
                <span className="text-[9px] font-mono text-[#5F6877]">
                  REAL GIS CORRIDORS
                </span>
              </div>

              <div className="border border-[#DDE2E7] rounded-md overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#5F6877] text-[10px] uppercase bg-slate-50">
                      <th className="py-1.5 px-2.5">Road</th>
                      <th className="py-1.5 px-2">District</th>
                      <th className="py-1.5 px-2">Hazard Risk</th>
                      <th className="py-1.5 px-2">Blockage Prob.</th>
                      <th className="py-1.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                    {roadRisks.map((road) => {
                      const isSelected = selectedRoad?.roadId === road.roadId;
                      return (
                        <tr
                          key={road.roadId}
                          onClick={() => handleSelectRoad(road)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80 font-semibold text-[#1D4E89]'
                              : 'hover:bg-slate-50 text-[#172033]'
                          }`}
                        >
                          <td className="py-2 px-2.5">
                            <div className="font-bold">{road.code}</div>
                            <div className="text-[10px] text-[#5F6877] truncate max-w-[140px]">
                              {road.name}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-[#5F6877]">{road.district}</td>
                          <td className="py-2 px-2 font-mono font-bold text-red-700">
                            {road.hazardRiskPct}%
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {road.blockageProbabilityPct}%
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                                road.currentStatus === 'BLOCKED'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : road.currentStatus === 'LIKELY BLOCKED'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                  : road.currentStatus === 'AT RISK'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {road.currentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Road Intelligence Dossier */}
            {selectedRoad && (
              <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded-md p-3 space-y-3">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#DDE2E7]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#172033]">
                        {selectedRoad.code}: {selectedRoad.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5F6877]">
                      {selectedRoad.district}, {selectedRoad.state} • Sector ID: {selectedRoad.roadId}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedRoad.currentStatus === 'BLOCKED'
                        ? 'bg-red-100 text-red-800'
                        : selectedRoad.currentStatus === 'LIKELY BLOCKED'
                        ? 'bg-orange-100 text-orange-800'
                        : selectedRoad.currentStatus === 'AT RISK'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    STATUS: {selectedRoad.currentStatus}
                  </span>
                </div>

                {/* Quantitative Indicators */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-[#DDE2E7]">
                    <span className="text-[10px] text-[#5F6877] block">Landslide Risk Exposure</span>
                    <span className="text-lg font-bold font-mono text-red-700">
                      {selectedRoad.hazardRiskPct}%
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-[#DDE2E7]">
                    <span className="text-[10px] text-[#5F6877] block">Blockage Probability</span>
                    <span className="text-lg font-bold font-mono text-orange-700">
                      {selectedRoad.blockageProbabilityPct}%
                    </span>
                  </div>
                </div>

                {/* Specific Segment & Threat Description */}
                <div className="text-xs space-y-1 bg-white p-2.5 rounded border border-[#DDE2E7]">
                  <div>
                    <strong className="text-[#172033]">Threatened Segment:</strong>{' '}
                    <span className="text-[#5F6877]">{selectedRoad.affectedSegmentDescription}</span>
                  </div>
                  <div>
                    <strong className="text-[#172033]">Nearest High-Risk Slope:</strong>{' '}
                    <span className="text-red-700 font-semibold">
                      {selectedRoad.nearestHighRiskSlope.name} ({selectedRoad.nearestHighRiskSlope.distanceM}m away, Risk: {selectedRoad.nearestHighRiskSlope.riskScore}%)
                    </span>
                  </div>
                  <div>
                    <strong className="text-[#172033]">Nearby Settlement:</strong>{' '}
                    <span className="text-[#172033]">{selectedRoad.nearbySettlement}</span>
                  </div>
                  {selectedRoad.alternativeAvailable && (
                    <div>
                      <strong className="text-emerald-800">Alternative Bypass:</strong>{' '}
                      <span className="text-emerald-700 font-semibold">
                        {selectedRoad.alternativeRouteName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recommended Operational Action */}
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Recommended Highway Action
                  </div>
                  <p className="text-[11px] leading-snug">{selectedRoad.recommendedAction}</p>
                </div>
              </div>
            )}

            {/* Next Chain Action Card */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md space-y-2">
              <div className="font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-700" />
                Next Chain Step: Shelters
              </div>
              <p className="text-[11px] text-emerald-900">
                Confirm shelter vacancies and match safe access routes for affected populations:
              </p>
              <button
                onClick={() => onNavigateTab('shelters')}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Proceed to Shelter Allocation →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: GIS Route Map & Dynamic Route Comparison Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#E5E9EC] relative">
          {/* Top Half: GIS Map with Route Polylines */}
          <div className="flex-1 relative min-h-[300px]">
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
              activeRouteLine={mapRouteLine}
              activeRouteFailedLine={mapFailedLine}
            />

            {/* Map Legend Overlay for Routes */}
            <div className="absolute top-2.5 right-2.5 z-[1000] bg-white/95 backdrop-blur-xs border border-[#DDE2E7] shadow-md rounded p-2 text-[10px] space-y-1">
              <div className="font-bold text-[#172033] uppercase">Route Status Legend</div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-[#1D4E89] rounded"></span>
                <span>Recommended Safe Bypass</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-red-600 rounded"></span>
                <span>Unsafe / High Hazard Segment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 border-t-2 border-dashed border-slate-400"></span>
                <span>Simulated Invalidation</span>
              </div>
            </div>
          </div>

          {/* Bottom Half: Hazard-Aware Route Comparison & Dynamic Evacuation Failure Simulator */}
          <div className="h-64 sm:h-72 border-t border-[#DDE2E7] bg-white p-3.5 flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#DDE2E7]">
              <div>
                <h4 className="font-bold text-xs text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Hazard-Aware Route Comparison: {routeComparison?.originName} → {routeComparison?.destinationName}
                </h4>
                <div className="text-[10px] text-[#5F6877] mt-0.5">
                  Principle: <strong className="text-[#172033]">Safety &gt; Shortest Distance</strong>. A route is NOT safe simply because a routing engine returned it.
                </div>
              </div>

              {/* Simulation Trigger Controls */}
              <div className="flex items-center gap-2">
                {simulationState === 'IDLE' ? (
                  <button
                    onClick={handleSimulateFailure}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Simulate dynamic landslide triggering road blockage"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Simulate Route Failure</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResetSimulation}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Simulation</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Failure Progress Notification (when active) */}
            {simulationState !== 'IDLE' && (
              <div
                className={`p-2.5 rounded mb-2 text-xs flex items-center justify-between animate-in fade-in duration-200 ${
                  simulationState === 'INVALIDATING'
                    ? 'bg-red-50 border border-red-200 text-red-900'
                    : simulationState === 'RECALCULATING'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {simulationState === 'INVALIDATING' && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                      <span className="font-bold">
                        ROUTE INVALIDATED: {selectedRoad?.name || 'Selected road'} now intersects a critical predicted landslide risk.
                      </span>
                    </>
                  )}
                  {simulationState === 'RECALCULATING' && (
                    <>
                      <Zap className="w-4 h-4 text-amber-600 animate-spin" />
                      <span className="font-bold">
                        RECALCULATING SAFER ROUTE... Detouring away from active regolith failure envelope.
                      </span>
                    </>
                  )}
                  {simulationState === 'COMPLETED' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">
                        SAFER ROUTE FOUND: Switched to {routeComparison?.alternativeRoute.name || 'hazard-avoiding alternative'} ({routeComparison?.alternativeRoute.travelTimeMin || 0} mins, {routeComparison?.alternativeRoute.hazardExposure || 'UNKNOWN'} exposure).
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] font-mono uppercase font-bold">
                  {simulationState}
                </span>
              </div>
            )}

            {/* Side-by-Side Comparison Cards */}
            {routeComparison && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 text-xs">
                {/* Route A (Direct / High Risk) */}
                <div
                  onClick={() => handleSelectRoute(routeComparison.primaryRoute, 'A')}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    activeRouteTab === 'A'
                      ? 'bg-red-50/70 border-red-400 ring-1 ring-red-400 shadow-xs'
                      : 'bg-white border-[#DDE2E7] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#172033]">
                        {routeComparison.primaryRoute.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                      {routeComparison.primaryRoute.isRecommended ? 'RECOMMENDED' : 'NOT RECOMMENDED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center my-2 font-mono">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-[#5F6877] font-sans block">Distance</span>
                      <strong className="text-[#172033]">
                        {routeComparison.primaryRoute.distanceKm} km
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-[#5F6877] font-sans block">Travel Time</span>
                      <strong className="text-[#172033]">
                        {routeComparison.primaryRoute.travelTimeMin} min
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-[#5F6877] font-sans block">Hazard Exposure</span>
                      <strong className="text-red-700">
                        {routeComparison.primaryRoute.hazardExposure}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-red-800 leading-snug">
                    {routeComparison.primaryRoute.explanation}
                  </p>
                </div>

                {/* Route B (Bypass / Safe / Recommended) */}
                <div
                  onClick={() => handleSelectRoute(routeComparison.alternativeRoute, 'B')}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    activeRouteTab === 'B'
                      ? 'bg-blue-50/80 border-[#1D4E89] ring-1 ring-[#1D4E89] shadow-xs'
                      : 'bg-white border-[#DDE2E7] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1D4E89]">
                        {routeComparison.alternativeRoute.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {routeComparison.alternativeRoute.isRecommended ? '✓ RECOMMENDED' : 'NOT RECOMMENDED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center my-2 font-mono">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-[#5F6877] font-sans block">Distance</span>
                      <strong className="text-[#172033]">
                        {routeComparison.alternativeRoute.distanceKm} km
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-[#5F6877] font-sans block">Travel Time</span>
                      <strong className="text-[#172033]">
                        {routeComparison.alternativeRoute.travelTimeMin} min
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-[#5F6877] font-sans block">Hazard Exposure</span>
                      <strong className="text-emerald-700">
                        {routeComparison.alternativeRoute.hazardExposure}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#172033] leading-snug">
                    {routeComparison.alternativeRoute.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
