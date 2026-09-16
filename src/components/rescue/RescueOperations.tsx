import React, { useState } from 'react';
import { NERState, MonitoredLocation, RoadSegment, FieldReport } from '../../types';
import { DataTruthfulnessBadge } from '../common/DataTruthfulnessBadge';
import {
  Truck,
  AlertOctagon,
  ShieldCheck,
  CheckCircle,
  Clock,
  Compass,
  MapPin,
  Waypoints,
  FileCheck,
  PhoneForwarded,
  ArrowRight
} from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  fieldReports: FieldReport[];
  onSelectLocation: (loc: MonitoredLocation) => void;
}

export const RescueOperations: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  roads,
  fieldReports,
  onSelectLocation
}) => {
  const [completedIncidents, setCompletedIncidents] = useState<string[]>([]);

  const filteredLocations = locations.filter((l) => {
    if (selectedState !== 'ALL' && l.state !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && l.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
    return true;
  });

  // Rank incidents by risk score and exposed population
  const rankedIncidents = [...filteredLocations]
    .filter((l) => l.riskLevel === 'CRITICAL' || l.riskLevel === 'HIGH')
    .sort((a, b) => b.riskScore - a.riskScore);

  const toggleIncidentStatus = (id: string) => {
    setCompletedIncidents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Tactical Banner */}
      <div className="bg-[#172033] text-white p-4 rounded-md border-l-4 border-red-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
              SDRF / NDRF / BRO TACTICAL COMMAND
            </span>
            <DataTruthfulnessBadge provenance="AI PREDICTION" size="sm" />
          </div>
          <h2 className="text-base font-bold">Field Response & Road Clearance Grid</h2>
          <p className="text-xs text-slate-300">
            Real-time rescue priority ranking, heavy equipment clearance status, and ingress/egress safety corridor monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Active Critical Incidents:</span>
            <span className="font-bold text-red-400 text-sm">{rankedIncidents.length}</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Blocked Arteries:</span>
            <span className="font-bold text-amber-400 text-sm">
              {roads.filter((r) => r.status === 'BLOCKED').length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority 1: High Threat Incident Dispatch Queue (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              Prioritized Emergency Response Queue ({rankedIncidents.length})
            </h3>
            <span className="text-xs text-[#5F6877]">Ranked by Model Severity &amp; Exposure</span>
          </div>

          <div className="space-y-3">
            {rankedIncidents.map((incident, idx) => {
              const isHandled = completedIncidents.includes(incident.id);
              return (
                <div
                  key={incident.id}
                  className={`p-4 rounded-md border transition-all ${
                    isHandled
                      ? 'bg-slate-50 border-slate-300 opacity-60'
                      : incident.riskLevel === 'CRITICAL'
                      ? 'bg-white border-red-300 shadow-xs'
                      : 'bg-white border-orange-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#1D4E89] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-[#172033]">{incident.name}</h4>
                        <span className="text-xs text-[#5F6877]">
                          {incident.district}, {incident.state} • Elev: {incident.elevationM}m • Lat/Lng: {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        incident.riskLevel === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {incident.riskLevel} ({incident.riskScore}%)
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded border border-[#DDE2E7]">
                    <div>
                      <span className="text-[#5F6877] block text-[10px]">Rainfall (24h / 72h):</span>
                      <strong className="text-[#172033]">{incident.rainfall24hMm} / {incident.rainfall72hMm} mm</strong>
                    </div>
                    <div>
                      <span className="text-[#5F6877] block text-[10px]">Saturation:</span>
                      <strong className="text-red-700">{incident.soilMoisturePct}% ({incident.soilMoistureTrend})</strong>
                    </div>
                    <div>
                      <span className="text-[#5F6877] block text-[10px]">Threatened Pop:</span>
                      <strong className="text-[#172033]">{incident.vulnerablePopulationEst.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-[#5F6877] block text-[10px]">Drainage Status:</span>
                      <strong className={incident.drainageDisrupted ? 'text-red-700' : 'text-emerald-700'}>
                        {incident.drainageDisrupted ? 'Clogged / Debris' : 'Flowing'}
                      </strong>
                    </div>
                  </div>

                  {incident.cascadingHazard && (
                    <div className="mt-2 text-xs text-red-900 bg-red-50 p-2 rounded border border-red-200">
                      <strong>Tactical Alert:</strong> {incident.cascadingHazard}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectLocation(incident)}
                      className="text-xs font-semibold text-[#1D4E89] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View GIS Coordinates &amp; Slope Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleIncidentStatus(incident.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isHandled
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isHandled ? 'Marked In-Progress / Deployed' : 'Dispatch Team / Acknowledge'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority 2: Lifeline Road Accessibility & Clearance Grid (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Waypoints className="w-4 h-4 text-[#1D4E89]" />
              Road Access &amp; Ingress Routes
            </h3>
          </div>

          <div className="space-y-3">
            {roads.map((road) => (
              <div key={road.id} className="p-3 bg-white rounded-md border border-[#DDE2E7] shadow-xs space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-[#1D4E89] block">{road.code}</span>
                    <span className="text-[#172033] font-medium">{road.name}</span>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
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

                <p className="text-[11px] text-[#5F6877]">{road.cause || 'Clear for emergency convoy passage.'}</p>

                {road.bypassAvailable ? (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px]">
                    <strong>Rescue Ingress Alternative:</strong> {road.bypassRouteName}
                    <span className="block text-[10px] text-emerald-700 mt-0.5">
                      Detour: +{road.bypassAdditionalKm} km
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-900 text-[11px]">
                    <strong>Lifeline Cut:</strong> Air drop or foot reconnaissance required.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tactical Verification Logs */}
          <div className="bg-white p-4 rounded-md border border-[#DDE2E7] space-y-2 text-xs">
            <h4 className="font-bold text-[#172033] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              Recent Field Officer Ground Verifications
            </h4>
            <div className="space-y-2 divide-y divide-slate-100">
              {fieldReports.slice(0, 3).map((r) => (
                <div key={r.id} className="pt-2 text-[11px]">
                  <div className="flex justify-between text-[#5F6877]">
                    <span>{r.locationName}</span>
                    <span>{r.timestamp}</span>
                  </div>
                  <p className="text-[#172033] font-medium mt-0.5">"{r.description}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
