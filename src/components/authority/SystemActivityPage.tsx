import React from 'react';
import { EmergencyBulletin, FieldReport, MonitoredLocation, NERState } from '../../types';
import { Activity, Database, Server, ShieldAlert } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  fieldReports: FieldReport[];
  bulletins: EmergencyBulletin[];
  backendConnected: boolean | null;
}

export const SystemActivityPage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  fieldReports,
  bulletins,
  backendConnected
}) => {
  const scopedLocations = locations.filter((location) =>
    (selectedState === 'ALL' || location.state === selectedState) &&
    (selectedDistrict === 'ALL' || location.district.toLowerCase() === selectedDistrict.toLowerCase())
  );

  const latestPrediction = scopedLocations
    .filter((location) => location.riskTimestamp)
    .sort((a, b) => String(b.riskTimestamp).localeCompare(String(a.riskTimestamp)))[0];

  const apiBackedLocations = scopedLocations.filter((location) =>
    location.dataProvenance === 'PROJECT API' || location.dataProvenance === 'AI PREDICTION'
  ).length;

  const rows = [
    {
      label: 'Backend health',
      value: backendConnected === null ? 'Checking' : backendConnected ? 'Connected' : 'Unavailable',
      detail: 'Runtime health check from /api/v1/health'
    },
    {
      label: 'Locations loaded',
      value: String(scopedLocations.length),
      detail: `${apiBackedLocations} currently carry API / AI provenance`
    },
    {
      label: 'Latest prediction timestamp',
      value: latestPrediction?.riskTimestamp || 'Unavailable',
      detail: latestPrediction ? latestPrediction.name : 'No backend prediction timestamp in current view'
    },
    {
      label: 'Field reports loaded',
      value: String(fieldReports.length),
      detail: 'Current frontend session dataset after API/fallback loading'
    },
    {
      label: 'Alerts loaded',
      value: String(bulletins.length),
      detail: 'Current alert/bulletin dataset after API/fallback loading'
    }
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F6F7F9] p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
              <Activity className="w-4 h-4 text-[#1D4E89]" />
              SESSION / SYSTEM ACTIVITY
            </div>
            <p className="text-xs text-[#5F6877] mt-1">
              Runtime status and currently available project activity. This is not a persistent historical audit log.
            </p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded border bg-slate-50 border-slate-200 text-slate-700">
            SESSION VIEW
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-[#DDE2E7] rounded-md p-4">
            <Server className="w-5 h-5 text-[#1D4E89]" />
            <span className="text-[10px] text-[#5F6877] block mt-2">API STATUS</span>
            <strong className={backendConnected ? 'text-emerald-700' : 'text-amber-700'}>
              {backendConnected ? 'CONNECTED' : 'UNAVAILABLE / FALLBACK'}
            </strong>
          </div>
          <div className="bg-white border border-[#DDE2E7] rounded-md p-4">
            <Database className="w-5 h-5 text-[#1D4E89]" />
            <span className="text-[10px] text-[#5F6877] block mt-2">ACTIVE LOCATION RECORDS</span>
            <strong>{scopedLocations.length}</strong>
          </div>
          <div className="bg-white border border-[#DDE2E7] rounded-md p-4">
            <ShieldAlert className="w-5 h-5 text-[#1D4E89]" />
            <span className="text-[10px] text-[#5F6877] block mt-2">ALERT RECORDS IN VIEW</span>
            <strong>{bulletins.length}</strong>
          </div>
        </div>

        <div className="bg-white border border-[#DDE2E7] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DDE2E7]">
            <strong className="text-xs text-[#172033]">Current runtime observations</strong>
          </div>
          <div className="divide-y divide-[#EEF1F4]">
            {rows.map((row) => (
              <div key={row.label} className="p-4 grid grid-cols-1 md:grid-cols-[220px_220px_1fr] gap-2 text-xs">
                <strong className="text-[#172033]">{row.label}</strong>
                <span className="font-mono">{row.value}</span>
                <span className="text-[#5F6877]">{row.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900">
          Persistent user/action audit history is not claimed here because a dedicated audit-log backend is not present in this frontend repository.
        </div>
      </div>
    </div>
  );
};
