import React, { useState, useEffect } from 'react';
import {
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  ShelterRecommendation,
  AffectedSettlement,
  RoadRisk,
  RouteOption,
  GISLayerToggles,
  NavigationTab
} from '../../types';
import { shelterService } from '../../services/shelterService';
import { NERLeafletMap } from '../gis/NERLeafletMap';
import {
  Home,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Route,
  Compass,
  Building2,
  Phone,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  Filter,
  Check,
  Award
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
  selectedShelter?: ShelterRecommendation | null;
  onSelectShelter?: (shelter: ShelterRecommendation | null) => void;
}

export const ShelterIntelligencePage: React.FC<Props> = ({
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
  selectedRoad,
  selectedRoute,
  selectedShelter: externalSelectedShelter,
  onSelectShelter
}) => {
  const [recommendations, setRecommendations] = useState<ShelterRecommendation[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<ShelterRecommendation | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Map layer toggles
  const [layerToggles, setLayerToggles] = useState<GISLayerToggles>({
    osm: true,
    topo: false,
    stateBoundaries: true,
    districtBoundaries: true,
    roads: true,
    settlements: true,
    hospitals: true,
    bridges: false,
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
    shelterService
      .getShelterRecommendations(
        activeLoc.id,
        selectedState === 'ALL' ? undefined : selectedState,
        {
          settlement: selectedSettlement,
          road: selectedRoad,
          route: selectedRoute
        }
      )
      .then((data) => {
        setRecommendations(data);
        const restoredShelter = externalSelectedShelter
          ? data.find((shelter) => shelter.shelterId === externalSelectedShelter.shelterId)
          : undefined;
        const nextShelter = restoredShelter || data.find((shelter) => shelter.isRecommended) || null;
        setSelectedShelter(nextShelter);
        if (nextShelter?.shelterId !== externalSelectedShelter?.shelterId) {
          onSelectShelter?.(nextShelter);
        }
      });
  }, [
    activeLoc.id,
    selectedState,
    selectedSettlement?.id,
    selectedRoad?.roadId,
    selectedRoute?.id,
    externalSelectedShelter?.shelterId,
    onSelectShelter
  ]);

  const handleToggleLayer = (key: keyof GISLayerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const recommendedShelter = recommendations.find((s) => s.isRecommended) || recommendations[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F7F9] overflow-hidden">
      {/* Top Banner */}
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-[#172033] text-sm">
            <Home className="w-4 h-4 text-emerald-700" />
            <span>Shelter Intelligence &amp; Allocation</span>
          </div>
          <span className="text-[#5F6877]">•</span>
          <span className="font-semibold text-[#172033]">
            Target Evacuation Sector: <span className="text-[#1D4E89]">{activeLoc.name}</span>
          </span>
          <span className="text-slate-400">({activeLoc.district}, {activeLoc.state})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            PROJECT DECISION SUPPORT (SAFETY &gt; CAPACITY &gt; ACCESSIBILITY)
          </span>
        </div>
      </div>

      {/* Action Notification Strip */}
      {actionNotice && (
        <div className="bg-emerald-800 text-white px-3 py-1.5 text-xs flex items-center justify-between z-40 sticky top-0 shadow-md">
          <span className="font-medium flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            {actionNotice}
          </span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-200 hover:text-white text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Layout: Left Intelligence Dossiers + Right GIS Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Recommended Shelter & Comparison List */}
        <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-[#DDE2E7] bg-white flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* Top Recommended Shelter Hero Box */}
            {recommendedShelter && (
              <div className="p-3.5 bg-[#F0FDF4] border-2 border-emerald-600 rounded-md shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Recommended Evacuation Shelter
                      </span>
                      <h3 className="font-bold text-sm text-[#172033]">
                        {recommendedShelter.name}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-mono">
                    Score: {recommendedShelter.rankingScore} / 100
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                  <div className="bg-white p-1.5 rounded border border-emerald-200">
                    <span className="text-[9px] text-[#5F6877] font-sans block">Distance</span>
                    <strong className="text-[#172033]">{recommendedShelter.distanceKm} km</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">
                    <span className="text-[9px] text-[#5F6877] font-sans block">Travel Time</span>
                    <strong className="text-[#172033]">{recommendedShelter.travelTimeMin} min</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">
                    <span className="text-[9px] text-[#5F6877] font-sans block">Available</span>
                    <strong className="text-emerald-700">{recommendedShelter.availableCapacity} beds</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">
                    <span className="text-[9px] text-[#5F6877] font-sans block">Route Risk</span>
                    <strong className="text-emerald-700">{recommendedShelter.routeHazardExposure}</strong>
                  </div>
                </div>

                {/* Why Recommended Reason Checklist */}
                <div className="bg-white p-2.5 rounded border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block mb-1">
                    Why Recommended:
                  </span>
                  <ul className="space-y-1 text-[11px] text-[#172033]">
                    {recommendedShelter.whyRecommended.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Official Dispatch Button */}
                <button
                  onClick={() => triggerNotice(`Evacuation corridor dispatched to ${recommendedShelter.name} via Peducha Bypass.`)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Designate as Active Evacuation Target</span>
                </button>
              </div>
            )}

            {/* Shelter Comparison & Ranking List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1D4E89]" />
                  Candidate Shelter Comparison ({recommendations.length})
                </h3>
                <span className="text-[9px] font-mono text-[#5F6877]">
                  MULTI-CRITERIA EVALUATION
                </span>
              </div>

              <div className="space-y-2.5">
                {recommendations.map((shelter) => {
                  const isSelected = selectedShelter?.shelterId === shelter.shelterId;
                  const isTopRec = shelter.isRecommended;

                  return (
                    <div
                      key={shelter.shelterId}
                      onClick={() => {
                        setSelectedShelter(shelter);
                        onSelectShelter?.(shelter);
                      }}
                      className={`p-3 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? isTopRec
                            ? 'bg-[#F0FDF4] border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                            : 'bg-blue-50/80 border-[#1D4E89] ring-1 ring-[#1D4E89] shadow-xs'
                          : 'bg-white border-[#DDE2E7] hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#172033]">
                              {shelter.name}
                            </span>
                            {isTopRec && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#5F6877]">
                            {shelter.district}, {shelter.state} • Source: <strong>{shelter.sourceType}</strong>
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            shelter.routeHazardExposure === 'HIGH' || shelter.routeHazardExposure === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Route: {shelter.routeHazardExposure}
                        </span>
                      </div>

                      {/* Distance & Capacity Data */}
                      <div className="grid grid-cols-4 gap-1 text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200 my-1.5">
                        <div>
                          <span className="text-[9px] text-[#5F6877] font-sans block">Distance</span>
                          <span>{shelter.distanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#5F6877] font-sans block">ETA</span>
                          <span>{shelter.travelTimeMin} min</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#5F6877] font-sans block">Capacity</span>
                          <span>{shelter.totalCapacity}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#5F6877] font-sans block">Available</span>
                          <strong className={shelter.availableCapacity < 50 ? 'text-red-700' : 'text-emerald-700'}>
                            {shelter.availableCapacity}
                          </strong>
                        </div>
                      </div>

                      {/* Critical Explanation of Ranking */}
                      <div className="text-[11px] text-[#172033] space-y-0.5 mb-2">
                        {shelter.whyRecommended.map((r, i) => (
                          <div key={i} className="text-[#5F6877] flex items-start gap-1">
                            <span>•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {/* Facility Amenities */}
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-[#5F6877]">
                          {shelter.hasMedicalPost && <span className="text-emerald-800 font-semibold">✓ Medical Post</span>}
                          {shelter.hasPowerBackup && <span>✓ Generator</span>}
                          {shelter.hasFoodWaterSupply && <span>✓ Food/Water</span>}
                        </div>
                        <span className="font-mono text-[9px] text-[#5F6877]">
                          {shelter.contactNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data Source Truthfulness Disclosure */}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-[#5F6877] flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#1D4E89] flex-shrink-0 mt-0.5" />
              <span>
                Capacity figures are sourced strictly from curated project disaster datasets. OpenStreetMap provides public facility locations but does not store live disaster occupancy.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: GIS Map with Shelter Pins and Access Routes */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#E5E9EC] relative">
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
          />

          {/* Selected Shelter Inspection Card Overlay */}
          {selectedShelter && (
            <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-[#DDE2E7] shadow-lg rounded-md p-3 max-w-sm pointer-events-auto">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#DDE2E7] mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-bold text-xs text-[#172033]">
                    {selectedShelter.name}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {selectedShelter.availableCapacity} BEDS AVAILABLE
                </span>
              </div>

              <div className="text-[11px] space-y-1 text-[#172033]">
                <div>Sector: <strong>{selectedShelter.district}, {selectedShelter.state}</strong></div>
                <div>Transit Distance: <strong>{selectedShelter.distanceKm} km ({selectedShelter.travelTimeMin} mins)</strong></div>
                <div>Officer in Charge: <strong>{selectedShelter.officerInCharge}</strong> ({selectedShelter.contactNumber})</div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onNavigateTab('roads')}
                    className="text-[#1D4E89] hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Route className="w-3 h-3" />
                    Inspect Access Road Route →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
