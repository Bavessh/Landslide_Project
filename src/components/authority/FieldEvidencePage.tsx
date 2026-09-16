import React, { useMemo, useState } from 'react';
import { FieldReport, MonitoredLocation, NavigationTab, NERState } from '../../types';
import { CheckCircle2, FileCheck, Flag, MapPin, XCircle } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  fieldReports: FieldReport[];
  onSelectLocation: (location: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

type LocalStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

const categoryLabels: Record<FieldReport['category'], string> = {
  SLOPE_CRACK: 'Slope Crack',
  ROCKFALL: 'Rockfall',
  BLOCKED_CULVERT: 'Blocked Culvert',
  WATER_SEEPAGE: 'Water Seepage',
  ROAD_COLLAPSE: 'Road Collapse'
};

export const FieldEvidencePage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  fieldReports,
  onSelectLocation,
  onNavigateTab
}) => {
  const [statuses, setStatuses] = useState<Record<string, LocalStatus>>({});
  const [important, setImportant] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<'ALL' | FieldReport['category']>('ALL');

  const reports = useMemo(() => fieldReports.filter((report) => {
    const matchesState = selectedState === 'ALL' || report.state === selectedState;
    const matchesDistrict = selectedDistrict === 'ALL' || report.district.toLowerCase() === selectedDistrict.toLowerCase();
    const matchesCategory = category === 'ALL' || report.category === category;
    return matchesState && matchesDistrict && matchesCategory;
  }), [fieldReports, selectedState, selectedDistrict, category]);

  const setStatus = (report: FieldReport, status: LocalStatus) => {
    setStatuses((current) => ({ ...current, [report.id]: status }));
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F6F7F9] p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033]"><FileCheck className="w-4 h-4 text-[#1D4E89]" />Authority Field Hazard Reports</div>
            <p className="text-xs text-[#5F6877] mt-1">PROTOTYPE FIELD EVIDENCE • Local authority review state only; no backend upload or media storage is used.</p>
          </div>
          <div className="flex gap-2 text-[10px]">
            <button onClick={() => onNavigateTab('impact')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Impact</button>
            <button onClick={() => onNavigateTab('response_priorities')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Priorities</button>
          </div>
        </div>

        <div className="bg-white border border-[#DDE2E7] rounded-md p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#172033]">Evidence register ({reports.length})</span>
          <select aria-label="Evidence category" value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="border border-[#DDE2E7] rounded p-1.5 text-xs">
            <option value="ALL">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {reports.map((report) => {
            const status = statuses[report.id] || (report.verifiedByAuthority ? 'VERIFIED' : 'UNVERIFIED');
            const relatedLocation = locations.find((location) => location.state === report.state && location.district === report.district);
            return (
              <article key={report.id} className="bg-white border border-[#DDE2E7] rounded-md p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-bold text-sm text-[#172033]">{categoryLabels[report.category]}</h3>{important[report.id] && <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">IMPORTANT</span>}</div>
                    <p className="text-xs text-[#5F6877]">{report.locationName} • {report.district}, {report.state}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${status === 'VERIFIED' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : status === 'REJECTED' ? 'text-red-800 bg-red-50 border-red-200' : 'text-amber-800 bg-amber-50 border-amber-200'}`}>{status}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8F9FA] border border-[#DDE2E7] rounded p-2 text-[10px]">
                  <div><span className="text-[#5F6877] block">Coordinates</span><strong>{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</strong></div>
                  <div><span className="text-[#5F6877] block">Timestamp</span><strong>{report.timestamp}</strong></div>
                  <div><span className="text-[#5F6877] block">Reporter</span><strong>{report.reporterType}</strong></div>
                  <div><span className="text-[#5F6877] block">Severity</span><strong className="text-red-700">{report.severity}</strong></div>
                </div>
                <p className="text-xs text-[#172033]">{report.description}</p>
                <div className="flex items-center justify-between gap-2 border-t border-[#DDE2E7] pt-2">
                  <button onClick={() => relatedLocation && onSelectLocation(relatedLocation)} className="text-[10px] text-[#1D4E89] font-semibold flex items-center gap-1 cursor-pointer"><MapPin className="w-3 h-3" />Inspect location</button>
                  <div className="flex gap-1.5"><button onClick={() => setStatus(report, 'VERIFIED')} className="px-2 py-1 text-[10px] bg-emerald-700 text-white rounded cursor-pointer"><CheckCircle2 className="inline w-3 h-3 mr-1" />VERIFY</button><button onClick={() => setStatus(report, 'REJECTED')} className="px-2 py-1 text-[10px] bg-red-700 text-white rounded cursor-pointer"><XCircle className="inline w-3 h-3 mr-1" />REJECT</button><button onClick={() => setImportant((current) => ({ ...current, [report.id]: !current[report.id] }))} className="px-2 py-1 text-[10px] border border-amber-300 text-amber-800 rounded cursor-pointer"><Flag className="inline w-3 h-3 mr-1" />MARK IMPORTANT</button></div>
                </div>
              </article>
            );
          })}
        </div>
        {reports.length === 0 && <div className="bg-white border border-[#DDE2E7] rounded-md p-8 text-center text-sm text-[#5F6877]">No prototype field evidence matches the active state, district, and category filters.</div>}
      </div>
    </div>
  );
};
