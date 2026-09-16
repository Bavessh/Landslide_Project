import React, { useState, useEffect } from 'react';
import { Role, EmergencyBulletin } from '../../types';
import { 
  Building2, 
  Users, 
  Truck, 
  AlertTriangle, 
  Clock, 
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';

interface Props {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeBulletins: EmergencyBulletin[];
}

export const OfficialHeader: React.FC<Props> = ({
  currentRole,
  onRoleChange,
  activeBulletins
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
          ' • ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) +
          ' IST'
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const criticalBulletin = activeBulletins.find((b) => b.severity === 'CRITICAL') || activeBulletins[0];

  return (
    <header className="w-full bg-[#1D4E89] text-white border-b-2 border-[#153966] select-none sticky top-0 z-50 shadow-sm">
      {/* Top Official National Banner */}
      <div className="bg-[#153966] px-4 py-1 text-[11px] flex flex-wrap items-center justify-between border-b border-blue-900/50">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wider text-slate-200 uppercase">
            Government of India • Ministry of Mines / NDMA / NEC
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-300 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SEOC Live Ingestion Network Active
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            {currentTime || 'Loading clock...'}
          </span>
          <span className="bg-blue-950/80 px-2 py-0.5 rounded text-amber-200 border border-blue-800 text-[10px]">
            AI estimate — not a guaranteed prediction
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Agency Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white text-[#1D4E89] flex flex-col items-center justify-center font-black shadow-inner border border-blue-200">
            <span className="text-[11px] leading-none">NER</span>
            <span className="text-[12px] font-black text-red-700 leading-tight">LENS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                NER Landslide Intelligence & Emergency Response Platform
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-700/80 text-blue-100 border border-blue-500">
                8 NER States
              </span>
            </div>
            <p className="text-xs text-blue-100/90 font-normal">
              State Emergency Operations Center (SEOC) Integrated Early Warning & Evacuation Gateway
            </p>
          </div>
        </div>

        {/* Tri-Role Switcher */}
        <div className="flex items-center bg-[#153966] p-1 rounded-md border border-blue-900 shadow-sm self-start md:self-auto">
          <button
            id="role-btn-authority"
            onClick={() => onRoleChange('AUTHORITY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              currentRole === 'AUTHORITY'
                ? 'bg-white text-[#1D4E89] shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Authority & GIS</span>
          </button>

          <button
            id="role-btn-citizen"
            onClick={() => onRoleChange('CITIZEN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              currentRole === 'CITIZEN'
                ? 'bg-white text-[#1D4E89] shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </button>

          <button
            id="role-btn-rescue"
            onClick={() => onRoleChange('RESCUE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              currentRole === 'RESCUE'
                ? 'bg-white text-[#1D4E89] shadow-sm'
                : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Rescue Field Ops</span>
          </button>
        </div>
      </div>

      {/* Emergency Alert Ticker */}
      {criticalBulletin && (
        <div className="bg-red-800 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between border-t border-red-900">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-red-950 text-white font-bold text-[10px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1 flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-300" />
              {criticalBulletin.severity} ALERT
            </span>
            <span className="font-semibold text-amber-200 flex-shrink-0">
              [{criticalBulletin.targetState} • {criticalBulletin.targetDistricts.join(', ')}]:
            </span>
            <span className="truncate text-red-100">
              {criticalBulletin.title} — {criticalBulletin.summary}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pl-3 text-[11px] text-red-200">
            <span>Valid until {criticalBulletin.validUntil}</span>
          </div>
        </div>
      )}
    </header>
  );
};
