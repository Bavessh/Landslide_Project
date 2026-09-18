import React, { useState } from 'react';
import {
  FieldReport,
  GISLayerToggles,
  MonitoredLocation,
  NavigationTab,
  NERState,
  RoadSegment,
  ShelterFacility,
  TimeHorizon
} from '../../types';
import { NERLeafletMap } from '../gis/NERLeafletMap';
import { LocationIntelligenceDrawer } from '../gis/LocationIntelligenceDrawer';
import { DataTruthfulnessBadge } from '../common/DataTruthfulnessBadge';
import { Map as MapIcon, MapPin } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  shelters: ShelterFacility[];
  fieldReports: FieldReport[];
  selectedLocation: MonitoredLocation | null;
  onSelectLocation: (location: MonitoredLocation | null) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

const DEFAULT_LAYERS: GISLayerToggles = {
  osm: true,
  stateBoundaries: true,
  districtBoundaries: true,
  roads: true,
  settlements: true,
  hospitals: true,
  bridges: true,
  rivers: true,
  rainfall: false,
  soilMoisture: false,
  terrain: false,
  currentRisk: true,
  riskHeatmap: true,
  fieldReports: true,
  shelters: true
};

export const GISRiskMapPage: React.FC<Props> = ({
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
  const [layerToggles, setLayerToggles] = useState<GISLayerToggles>(DEFAULT_LAYERS);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('NOW');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F7F9] overflow-hidden">
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
            <MapIcon className="w-4 h-4 text-[#1D4E89]" />
            GIS RISK MAP
          </div>
          <p className="text-[11px] text-[#5F6877] mt-1">
            Geographic operational view of monitored slopes, roads, shelters, field evidence and risk overlays.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataTruthfulnessBadge provenance="LIVE MAP" size="sm" />
          <span className="text-[10px] text-[#5F6877]">
            {locations.length} monitored location{locations.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="bg-white border-b border-[#DDE2E7] px-4 py-1.5 flex flex-wrap items-center gap-4 text-[10px]">
        <span className="font-semibold text-[#172033] flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#1D4E89]" />
          {selectedState === 'ALL' ? 'North Eastern Region' : selectedState}
          {selectedDistrict !== 'ALL' ? ` • ${selectedDistrict}` : ''}
        </span>
        <span><strong className="text-emerald-700">●</strong> Low</span>
        <span><strong className="text-amber-700">●</strong> Moderate</span>
        <span><strong className="text-orange-700">●</strong> High</span>
        <span><strong className="text-red-700">●</strong> Critical</span>
        <span className="text-[#5F6877]">Use the map layer panel to control operational overlays.</span>
      </div>

      <div className="flex-1 min-h-0 relative bg-[#E5E9EC]">
        <NERLeafletMap
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          locations={locations}
          roads={roads}
          shelters={shelters}
          fieldReports={fieldReports}
          layerToggles={layerToggles}
          onToggleLayer={(key) =>
            setLayerToggles((current) => ({ ...current, [key]: !current[key] }))
          }
          selectedLocationId={selectedLocation?.id || null}
          onSelectLocation={(location) => onSelectLocation(location)}
          timeHorizon={timeHorizon}
          onTimeHorizonChange={setTimeHorizon}
        />

        {selectedLocation && (
          <LocationIntelligenceDrawer
            location={selectedLocation}
            allRoads={roads}
            allShelters={shelters}
            onClose={() => onSelectLocation(null)}
            onNavigateTab={onNavigateTab}
            onOpenWhatIf={() => onNavigateTab('what_if')}
          />
        )}
      </div>
    </div>
  );
};
