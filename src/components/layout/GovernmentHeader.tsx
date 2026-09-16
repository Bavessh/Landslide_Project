import React, { useState } from 'react';
import { Role, NERState, Language, EmergencyBulletin } from '../../types';
import { PrototypeBadge } from '../common/PrototypeBadge';
import { ConnectivityIndicator } from '../common/ConnectivityIndicator';
import {
  Building2,
  Users,
  Truck,
  Bell,
  Globe,
  User,
  AlertTriangle,
  ChevronDown,
  X,
  Eye,
  Megaphone
} from 'lucide-react';

interface Props {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeBulletins: EmergencyBulletin[];
  onViewAlertArea?: (state: NERState, district?: string) => void;
  onGenerateWarning?: () => void;
}

export const GovernmentHeader: React.FC<Props> = ({
  currentRole,
  onRoleChange,
  selectedState,
  selectedDistrict,
  language,
  onLanguageChange,
  activeBulletins,
  onViewAlertArea,
  onGenerateWarning
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const criticalBulletin = activeBulletins.find((b) => b.severity === 'CRITICAL') || activeBulletins[0];

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' }
  ];

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#DDE2E7] select-none sticky top-0 z-50 shadow-2xs">
      {/* Top National Identity & Telemetry Status Strip - Compact Height (26px) */}
      <div className="bg-[#F8F9FA] px-3 py-1 border-b border-[#DDE2E7] text-[10px] flex flex-wrap items-center justify-between gap-1.5 text-[#5F6877]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#172033] uppercase tracking-wide">
            Government of India
          </span>
          <span className="text-slate-300">•</span>
          <span className="hidden sm:inline">Ministry of DoNER / North Eastern Council / NDMA</span>
          <span className="text-slate-300">•</span>
          <span className="text-amber-800 font-medium truncate">
            AI estimate — not a guaranteed prediction
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ConnectivityIndicator isOnline={true} latencyMs={32} />
          <PrototypeBadge />
        </div>
      </div>

      {/* Main Command Bar - Compact Padding (py-1.5) */}
      <div className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Title & Agency Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#1D4E89] text-white flex flex-col items-center justify-center font-black shadow-2xs flex-shrink-0">
            <span className="text-[9px] leading-none tracking-tight">NER</span>
            <span className="text-[10px] font-black text-amber-300 leading-tight">LENS</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-[#172033] tracking-tight leading-none">
                NER Landslide Intelligence Platform
              </h1>
              <span className="hidden md:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#1D4E89] border border-blue-200">
                8 NER STATES
              </span>
            </div>
            <p className="text-[10px] text-[#5F6877] mt-0.5 font-normal leading-none">
              Government Disaster Intelligence &amp; Emergency Response System
            </p>
          </div>
        </div>

        {/* Current Active Jurisdiction Badge */}
        <div className="hidden xl:flex items-center gap-1.5 bg-[#F1F3F5] px-2.5 py-1 rounded border border-[#DDE2E7] text-[11px]">
          <span className="text-[#5F6877] text-[10px]">Active Jurisdiction:</span>
          <strong className="text-[#172033]">
            {selectedState === 'ALL' ? 'All 8 NER States' : selectedState}
          </strong>
          {selectedDistrict !== 'ALL' && (
            <>
              <span className="text-[#5F6877]">/</span>
              <span className="text-[#1D4E89] font-medium">{selectedDistrict}</span>
            </>
          )}
        </div>

        {/* Right Utility Controls: Role Switcher, Language, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Tri-Role Switcher - Prominent and High Usability for Demos */}
          <div className="flex items-center bg-[#F1F3F5] p-0.5 rounded border border-[#DDE2E7]" role="group" aria-label="Role selector">
            <button
              id="role-authority-btn"
              onClick={() => onRoleChange('AUTHORITY')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'AUTHORITY'
                  ? 'bg-[#1D4E89] text-white shadow-2xs'
                  : 'text-[#5F6877] hover:text-[#172033]'
              }`}
              title="State / District Disaster Operations Center"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Authority</span>
            </button>

            <button
              id="role-citizen-btn"
              onClick={() => onRoleChange('CITIZEN')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'CITIZEN'
                  ? 'bg-[#1D4E89] text-white shadow-2xs'
                  : 'text-[#5F6877] hover:text-[#172033]'
              }`}
              title="Citizen Safety & Crowdsourced Reporting"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px]">Citizen</span>
            </button>

            <button
              id="role-rescue-btn"
              onClick={() => onRoleChange('RESCUE')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'RESCUE'
                  ? 'bg-[#1D4E89] text-white shadow-2xs'
                  : 'text-[#5F6877] hover:text-[#172033]'
              }`}
              title="NDRF / SDRF Incident Command"
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="text-[11px]">Rescue</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <label htmlFor="language-selector" className="sr-only">Language</label>
            <div className="flex items-center gap-1 bg-[#F8F9FA] border border-[#DDE2E7] rounded px-1.5 py-1 text-xs text-[#172033]">
              <Globe className="w-3 h-3 text-[#5F6877]" />
              <select
                id="language-selector"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-transparent text-[11px] font-semibold text-[#172033] focus:outline-none cursor-pointer pr-1"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 rounded text-[#5F6877] hover:text-[#172033] hover:bg-[#F1F3F5] border border-[#DDE2E7] relative cursor-pointer"
              title="Disaster Bulletins"
            >
              <Bell className="w-3.5 h-3.5" />
              {activeBulletins.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                  {activeBulletins.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#DDE2E7] rounded-md shadow-lg p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#DDE2E7] mb-2">
                  <span className="font-bold text-[#172033]">State Emergency Operations Bulletins</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#5F6877] hover:text-[#172033]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeBulletins.map((b) => (
                    <div key={b.id} className="p-2 rounded bg-[#F8F9FA] border border-[#DDE2E7]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-red-800 rounded">
                          {b.severity}
                        </span>
                        <span className="text-[10px] text-[#5F6877]">{b.issuedAt}</span>
                      </div>
                      <p className="font-semibold text-[#172033] text-[11px] mt-1">{b.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile / Officer Clearance */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-1 p-0.5 rounded hover:bg-[#F1F3F5] text-xs text-[#172033] border border-transparent hover:border-[#DDE2E7] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#1D4E89] text-white flex items-center justify-center font-bold text-[10px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <ChevronDown className="w-3 h-3 text-[#5F6877]" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#DDE2E7] rounded-md shadow-lg p-3 z-50 text-xs">
                <div className="font-bold text-[#172033]">Duty Operations Officer</div>
                <div className="text-[11px] text-[#5F6877]">State Disaster Operations Center</div>
                <div className="mt-2 pt-2 border-t border-[#DDE2E7] text-[10px] space-y-1 text-[#5F6877]">
                  <div>Node: <strong>Guwahati / Kohima Gateway</strong></div>
                  <div>Status: <strong>PROTOTYPE DATA FEED</strong></div>
                  <div>Clearance: <strong>Tier-1 Commander</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restrained, High-Contrast Critical Alert Panel (Non-overpowering) */}
      {criticalBulletin && (
        <div className="bg-[#FFF8F8] border-t border-b border-red-200 px-3 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis flex-1 min-w-[280px]">
            {/* Red Severity Tag */}
            <span className="bg-red-700 text-white font-bold text-[9px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1 flex-shrink-0">
              <AlertTriangle className="w-3 h-3 text-amber-300" />
              CRITICAL ADVISORY
            </span>

            {/* Target Area */}
            <span className="font-bold text-red-900 text-[11px] flex-shrink-0">
              [{criticalBulletin.targetState} • {criticalBulletin.targetDistricts.join(', ')}]:
            </span>

            {/* Advisory Text */}
            <span className="text-[#172033] font-medium text-[11px] truncate">
              {criticalBulletin.title} — {criticalBulletin.summary}
            </span>
          </div>

          {/* Quick Actions: View Area & Generate Warning */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onViewAlertArea && (
              <button
                onClick={() => onViewAlertArea(criticalBulletin.targetState, criticalBulletin.targetDistricts[0])}
                className="px-2 py-0.5 rounded bg-white hover:bg-red-50 text-red-800 border border-red-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Pan and zoom GIS map to affected sector"
              >
                <Eye className="w-3 h-3 text-red-700" />
                View Area
              </button>
            )}

            {onGenerateWarning && (
              <button
                onClick={onGenerateWarning}
                className="px-2 py-0.5 rounded bg-red-700 hover:bg-red-800 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Broadcast emergency early warning bulletin"
              >
                <Megaphone className="w-3 h-3" />
                Generate Warning
              </button>
            )}

            <span className="hidden md:inline text-[10px] text-[#5F6877] font-mono pl-1">
              Valid: {criticalBulletin.validUntil}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
