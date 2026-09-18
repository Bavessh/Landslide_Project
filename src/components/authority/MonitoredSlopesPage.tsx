import React, { useMemo, useState } from 'react';
import {
  MonitoredLocation,
  NavigationTab,
  NERState,
  RiskLevel
} from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { DataTruthfulnessBadge } from '../common/DataTruthfulnessBadge';
import { formatMetric } from '../../utils/dataNormalization';
import { Search, MapPin, BrainCircuit, Map as MapIcon } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  onSelectLocation: (location: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

type RiskFilter = 'ALL' | RiskLevel;

export const MonitoredSlopesPage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  onSelectLocation,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [sortDescending, setSortDescending] = useState(true);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return locations
      .filter((location) => selectedState === 'ALL' || location.state === selectedState)
      .filter((location) => selectedDistrict === 'ALL' || location.district.toLowerCase() === selectedDistrict.toLowerCase())
      .filter((location) => riskFilter === 'ALL' || location.riskLevel === riskFilter)
      .filter((location) =>
        !normalizedQuery ||
        [location.name, location.district, location.state]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
      .sort((a, b) => sortDescending ? b.riskScore - a.riskScore : a.riskScore - b.riskScore);
  }, [locations, selectedState, selectedDistrict, riskFilter, query, sortDescending]);

  const inspect = (location: MonitoredLocation, tab: NavigationTab) => {
    onSelectLocation(location);
    onNavigateTab(tab);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F6F7F9] p-4">
      <div className="max-w-[1500px] mx-auto space-y-4">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
              <MapPin className="w-4 h-4 text-[#1D4E89]" />
              MONITORED SLOPES
            </div>
            <p className="text-xs text-[#5F6877] mt-1">
              Searchable operational registry of monitored landslide locations and their latest available telemetry.
            </p>
          </div>
          <span className="text-[10px] text-[#5F6877]">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
        </div>

        <div className="bg-white border border-[#DDE2E7] rounded-md p-3 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#5F6877]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search location, district or state"
              className="w-full border border-[#DDE2E7] rounded pl-8 pr-3 py-2 text-xs"
            />
          </div>
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
            className="border border-[#DDE2E7] rounded px-2 py-2 text-xs"
            aria-label="Risk level filter"
          >
            <option value="ALL">All risk levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
          <button
            onClick={() => setSortDescending((value) => !value)}
            className="border border-[#DDE2E7] rounded px-3 py-2 text-xs text-[#1D4E89] font-semibold"
          >
            Risk {sortDescending ? 'High → Low' : 'Low → High'}
          </button>
        </div>

        <div className="bg-white border border-[#DDE2E7] rounded-md overflow-x-auto">
          <table className="min-w-[1250px] w-full text-xs">
            <thead className="bg-[#F8F9FA] text-[#5F6877] uppercase text-[10px]">
              <tr>
                {['Location','District','State','Risk','Rainfall 24h','Soil Moisture','Slope','Elevation','Trend','Last Updated','Data Source','Actions'].map((label) => (
                  <th key={label} className="text-left px-3 py-2 border-b border-[#DDE2E7]">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((location) => (
                <tr key={location.id} className="border-b border-[#EEF1F4] hover:bg-[#F8FAFC]">
                  <td className="px-3 py-2 font-semibold text-[#172033]">{location.name}</td>
                  <td className="px-3 py-2">{location.district}</td>
                  <td className="px-3 py-2">{location.state}</td>
                  <td className="px-3 py-2"><RiskBadge level={location.riskLevel} score={location.riskScore} size="sm" /></td>
                  <td className="px-3 py-2 font-mono">{formatMetric(location.rainfall24hMm, ' mm')}</td>
                  <td className="px-3 py-2 font-mono">{formatMetric(location.soilMoisturePct, '%')}</td>
                  <td className="px-3 py-2 font-mono">{formatMetric(location.slopeAngleDeg, '°')}</td>
                  <td className="px-3 py-2 font-mono">{formatMetric(location.elevationM, ' m', 0)}</td>
                  <td className="px-3 py-2">{location.riskTrend || 'Unavailable'}</td>
                  <td className="px-3 py-2">{location.lastUpdated || 'Unavailable'}</td>
                  <td className="px-3 py-2"><DataTruthfulnessBadge provenance={location.dataProvenance} size="sm" /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <button onClick={() => inspect(location, 'risk_intelligence')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] font-semibold flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" /> Risk
                      </button>
                      <button onClick={() => inspect(location, 'risk_map')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] font-semibold flex items-center gap-1">
                        <MapIcon className="w-3 h-3" /> Map
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-[#5F6877]">No monitored slopes match the active filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};
