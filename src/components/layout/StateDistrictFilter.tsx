import React, { useState, useMemo } from 'react';
import { NERState, StateDistrictMetadata, MonitoredLocation, RoadSegment, ShelterFacility } from '../../types';
import { NER_STATES_META } from '../../data/nerGeography';
import { MapPin, Navigation, Search, X, Layers, Route, Home, Building } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  onStateChange: (state: NERState | 'ALL') => void;
  onDistrictChange: (district: string) => void;
  locations: MonitoredLocation[];
  roads?: RoadSegment[];
  shelters?: ShelterFacility[];
  onSelectLocation: (loc: MonitoredLocation) => void;
  onSelectRoad?: (road: RoadSegment) => void;
  onSelectShelter?: (shelter: ShelterFacility) => void;
  summaryStats: {
    totalMonitored: number;
    criticalCount: number;
    highCount: number;
    blockedRoadsCount: number;
    availableSheltersCount: number;
  };
}

type SearchResultItem =
  | { type: 'STATE'; id: string; label: string; sub: string; state: NERState }
  | { type: 'DISTRICT'; id: string; label: string; sub: string; state: NERState; district: string }
  | { type: 'PLACE'; id: string; label: string; sub: string; loc: MonitoredLocation }
  | { type: 'ROAD'; id: string; label: string; sub: string; road: RoadSegment }
  | { type: 'SHELTER'; id: string; label: string; sub: string; shelter: ShelterFacility };

export const StateDistrictFilter: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  onStateChange,
  onDistrictChange,
  locations,
  roads = [],
  shelters = [],
  onSelectLocation,
  onSelectRoad,
  onSelectShelter,
  summaryStats
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currentMeta: StateDistrictMetadata | undefined =
    selectedState !== 'ALL' ? NER_STATES_META[selectedState] : undefined;

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as NERState | 'ALL';
    onStateChange(val);
    onDistrictChange('ALL');
  };

  // Comprehensive multi-tier search across State, District, Place, Road, Shelter
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. Match States
    (Object.keys(NER_STATES_META) as NERState[]).forEach((st) => {
      if (st.toLowerCase().includes(q)) {
        results.push({
          type: 'STATE',
          id: `state-${st}`,
          label: st,
          sub: 'NER State Jurisdiction',
          state: st
        });
      }
    });

    // 2. Match Districts
    Object.entries(NER_STATES_META).forEach(([st, meta]) => {
      meta.districts.forEach((dist) => {
        if (dist.name.toLowerCase().includes(q)) {
          results.push({
            type: 'DISTRICT',
            id: `dist-${st}-${dist.name}`,
            label: dist.name,
            sub: `District in ${st}`,
            state: st as NERState,
            district: dist.name
          });
        }
      });
    });

    // 3. Match Places / Monitored Slopes
    locations.forEach((loc) => {
      if (
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'PLACE',
          id: `loc-${loc.id}`,
          label: loc.name,
          sub: `${loc.district}, ${loc.state} • Risk: ${loc.riskLevel} (${loc.riskScore}%)`,
          loc
        });
      }
    });

    // 4. Match Roads
    roads.forEach((rd) => {
      if (
        rd.name.toLowerCase().includes(q) ||
        rd.code.toLowerCase().includes(q) ||
        rd.state.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'ROAD',
          id: `road-${rd.id}`,
          label: `${rd.code} - ${rd.name}`,
          sub: `${rd.state} • Status: ${rd.status}`,
          road: rd
        });
      }
    });

    // 5. Match Shelters
    shelters.forEach((sh) => {
      if (
        sh.name.toLowerCase().includes(q) ||
        sh.district.toLowerCase().includes(q) ||
        sh.state.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'SHELTER',
          id: `shelter-${sh.id}`,
          label: sh.name,
          sub: `${sh.district}, ${sh.state} • Capacity: ${sh.capacity}`,
          shelter: sh
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, locations, roads, shelters]);

  const handleSelectResult = (item: SearchResultItem) => {
    if (item.type === 'STATE') {
      onStateChange(item.state);
      onDistrictChange('ALL');
    } else if (item.type === 'DISTRICT') {
      onStateChange(item.state);
      onDistrictChange(item.district);
    } else if (item.type === 'PLACE') {
      onStateChange(item.loc.state);
      onDistrictChange(item.loc.district);
      onSelectLocation(item.loc);
    } else if (item.type === 'ROAD') {
      onStateChange(item.road.state);
      if (onSelectRoad) onSelectRoad(item.road);
    } else if (item.type === 'SHELTER') {
      onStateChange(item.shelter.state);
      onDistrictChange(item.shelter.district);
      if (onSelectShelter) onSelectShelter(item.shelter);
    }

    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <div className="bg-[#FFFFFF] border-b border-[#DDE2E7] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
      {/* State & District Selectors & Location Search */}
      <div className="flex flex-wrap items-center gap-2">
        {/* State Dropdown */}
        <div className="flex items-center gap-1">
          <label htmlFor="filter-state" className="text-[11px] font-bold text-[#5F6877] uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#1D4E89]" />
            State:
          </label>
          <select
            id="filter-state"
            value={selectedState}
            onChange={handleStateSelect}
            className="text-xs font-semibold bg-[#F1F3F5] text-[#172033] border border-[#DDE2E7] rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1D4E89] cursor-pointer"
          >
            <option value="ALL">All 8 NER States</option>
            {Object.keys(NER_STATES_META).map((stateKey) => (
              <option key={stateKey} value={stateKey}>
                {stateKey}
              </option>
            ))}
          </select>
        </div>

        {/* District Dropdown */}
        <div className="flex items-center gap-1">
          <label htmlFor="filter-district" className="text-[11px] font-bold text-[#5F6877] uppercase tracking-wider flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-[#1D4E89]" />
            District:
          </label>
          <select
            id="filter-district"
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={selectedState === 'ALL'}
            className={`text-xs font-semibold bg-[#F1F3F5] text-[#172033] border border-[#DDE2E7] rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1D4E89] cursor-pointer ${
              selectedState === 'ALL' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="ALL">All Districts {selectedState !== 'ALL' ? `(${selectedState})` : ''}</option>
            {currentMeta?.districts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.highRiskZoneCount} zones)
              </option>
            ))}
          </select>
        </div>

        {/* Search Input with Expanded Categorized Dropdown */}
        <div className="relative">
          <div className="flex items-center bg-[#F1F3F5] border border-[#DDE2E7] rounded px-2 py-0.5 text-xs text-[#172033] w-52 sm:w-64 md:w-72">
            <Search className="w-3 h-3 text-[#5F6877] mr-1.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search state, district, location or road..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent text-[11px] text-[#172033] placeholder-slate-400 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-[#5F6877] hover:text-[#172033] ml-1 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Categorized Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-[#DDE2E7] rounded-md shadow-xl py-1 z-50 text-xs">
              <div className="px-2.5 py-1 text-[9px] font-bold text-[#5F6877] uppercase tracking-wider border-b border-[#DDE2E7] flex justify-between items-center">
                <span>NER Geographic Matches</span>
                <span>{searchResults.length} found</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#F1F3F5] flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <div className="truncate pr-2">
                      <strong className="text-[#172033] text-[11px] block truncate">{item.label}</strong>
                      <span className="text-[10px] text-[#5F6877] truncate block">{item.sub}</span>
                    </div>

                    {/* Type Badge */}
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase flex-shrink-0 ${
                        item.type === 'STATE'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : item.type === 'DISTRICT'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : item.type === 'PLACE'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : item.type === 'ROAD'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Summary Counters for Command Quick-View (Compact) */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <div className="px-1.5 py-0.5 bg-[#F8F9FA] border border-[#DDE2E7] rounded text-[10px]" title="Monitored slope risk telemetry stations">
          <span className="text-[#5F6877]">Monitored: </span>
          <strong className="text-[#172033] font-bold">{summaryStats.totalMonitored}</strong>
        </div>

        <div className="px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-red-800 text-[10px]" title="Critical risk landslide slopes (>85%)">
          <span>Critical: </span>
          <strong className="font-bold">{summaryStats.criticalCount}</strong>
        </div>

        <div className="px-1.5 py-0.5 bg-orange-50 border border-orange-200 rounded text-orange-800 text-[10px]" title="High risk slopes (70-84%)">
          <span>High Risk: </span>
          <strong className="font-bold">{summaryStats.highCount}</strong>
        </div>

        <div className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px]" title="Blocked lifeline highways">
          <span>Blocked Lifelines: </span>
          <strong className="font-bold">{summaryStats.blockedRoadsCount}</strong>
        </div>

        <div className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[10px]" title="Active verified evacuation shelters">
          <span>Shelters Ready: </span>
          <strong className="font-bold">{summaryStats.availableSheltersCount}</strong>
        </div>
      </div>
    </div>
  );
};
