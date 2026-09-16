import React, { useMemo } from 'react';
import { FieldReport, MonitoredLocation, NavigationTab, NERState, RoadSegment, ShelterFacility } from '../../types';
import { responsePriorityService, ResponsePriorityLevel } from '../../services/responsePriorityService';
import { AlertTriangle, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  shelters: ShelterFacility[];
  fieldReports: FieldReport[];
  selectedLocation: MonitoredLocation | null;
  onSelectLocation: (location: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

const priorityClass: Record<ResponsePriorityLevel, string> = {
  ROUTINE: 'bg-slate-100 text-slate-700 border-slate-200',
  ELEVATED: 'bg-blue-50 text-blue-800 border-blue-200',
  HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-800 border-red-200'
};

export const ResponsePrioritiesPage: React.FC<Props> = ({
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
  const priorities = useMemo(() => responsePriorityService.rank(locations, roads, shelters, fieldReports, selectedState, selectedDistrict), [locations, roads, shelters, fieldReports, selectedState, selectedDistrict]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F6F7F9] p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Truck className="w-4 h-4 text-[#1D4E89]" />Emergency Response Priorities</div>
            <p className="text-xs text-[#5F6877] mt-1">PROTOTYPE DECISION SUPPORT • Transparent frontend prioritization pending backend integration.</p>
          </div>
          <div className="flex gap-2 text-[10px]"><button onClick={() => onNavigateTab('field_reports')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Field Evidence</button><button onClick={() => onNavigateTab('roads')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Roads</button></div>
        </div>
        <div className="bg-white border border-[#DDE2E7] rounded-md p-3 text-xs flex items-center justify-between"><span><strong>{priorities.length}</strong> response zone(s) in current filter</span><span className="text-[#5F6877]">Safety, exposure, access, shelter, and verified evidence inputs</span></div>
        <div className="space-y-3">
          {priorities.map((item, index) => (
            <article key={item.location.id} className={`bg-white border rounded-md p-3 ${selectedLocation?.id === item.location.id ? 'border-[#1D4E89] ring-1 ring-[#1D4E89]' : 'border-[#DDE2E7]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2"><span className="w-6 h-6 rounded bg-[#1D4E89] text-white flex items-center justify-center text-xs font-bold">{index + 1}</span><div><h3 className="font-bold text-sm text-[#172033]">{item.location.name}</h3><p className="text-xs text-[#5F6877]">{item.location.district}, {item.location.state} • {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}</p></div></div>
                <div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-2 py-1 rounded border ${priorityClass[item.priority]}`}>{item.priority}</span><span className="text-xs font-mono text-[#5F6877]">Score {item.score}/100</span></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3 bg-[#F8F9FA] border border-[#DDE2E7] rounded p-2 text-[10px]">
                <div><span className="text-[#5F6877] block">Current Risk</span><strong className="text-red-700">{item.location.riskScore}% {item.location.riskLevel}</strong></div>
                <div><span className="text-[#5F6877] block">Affected Pop.</span><strong>{item.affectedPopulation.toLocaleString('en-IN')}</strong></div>
                <div><span className="text-[#5F6877] block">Settlements</span><strong>{item.settlementExposure}</strong></div>
                <div><span className="text-[#5F6877] block">Road Access</span><strong>{item.roadAccessibility}</strong></div>
                <div><span className="text-[#5F6877] block">Route Safety</span><strong>{item.routeSafety}</strong></div>
                <div><span className="text-[#5F6877] block">Shelter</span><strong>{item.shelterAvailability}</strong></div>
                <div><span className="text-[#5F6877] block">Verified Evidence</span><strong>{item.verifiedEvidence}</strong></div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] text-[#5F6877] flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#1D4E89]" />{item.explanation.join(' • ')}</div><button onClick={() => onSelectLocation(item.location)} className="text-[10px] font-semibold text-[#1D4E89] flex items-center gap-1 cursor-pointer">Inspect zone <ArrowRight className="w-3 h-3" /></button></div>
              {item.priority === 'CRITICAL' && <div className="mt-2 text-[10px] text-red-800 bg-red-50 border border-red-200 rounded p-2"><AlertTriangle className="inline w-3 h-3 mr-1" />Immediate authority review recommended. This is prototype decision support, not an ML or dispatch order.</div>}
            </article>
          ))}
        </div>
        {priorities.length === 0 && <div className="bg-white border border-[#DDE2E7] rounded-md p-8 text-center text-sm text-[#5F6877]">No response zones match the active state and district filters.</div>}
      </div>
    </div>
  );
};
