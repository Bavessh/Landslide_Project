import React from 'react';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  BrainCircuit,
  Map as MapIcon,
  MapPin,
  CloudRain,
  Activity,
  Route,
  Home,
  Sliders,
  FileSpreadsheet,
  Megaphone,
  Truck,
  Sparkles,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Props {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isOperationalInPhase1: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Command Overview', icon: LayoutDashboard, isOperationalInPhase1: true },
  { id: 'risk_intelligence', label: 'Risk Intelligence', icon: BrainCircuit, isOperationalInPhase1: false },
  { id: 'risk_map', label: 'GIS Risk Map', icon: MapIcon, isOperationalInPhase1: true },
  { id: 'locations', label: 'Monitored Slopes', icon: MapPin, isOperationalInPhase1: true },
  { id: 'weather', label: 'Weather & Rainfall', icon: CloudRain, isOperationalInPhase1: true },
  { id: 'impact', label: 'Impact Analysis', icon: Activity, isOperationalInPhase1: false },
  { id: 'roads', label: 'Road Lifelines', icon: Route, isOperationalInPhase1: false },
  { id: 'shelters', label: 'Evacuation Shelters', icon: Home, isOperationalInPhase1: false },
  { id: 'what_if', label: 'What-If Simulation', icon: Sliders, isOperationalInPhase1: true },
  { id: 'field_reports', label: 'Field Hazard Reports', icon: FileSpreadsheet, isOperationalInPhase1: false },
  { id: 'alerts', label: 'Alerts & Bulletins', icon: Megaphone, isOperationalInPhase1: false },
  { id: 'response_priorities', label: 'Response Logistics', icon: Truck, isOperationalInPhase1: false },
  { id: 'model_intelligence', label: 'Model Intelligence', icon: Sparkles, isOperationalInPhase1: false },
  { id: 'system_activity', label: 'Audit & System Log', icon: History, isOperationalInPhase1: false }
];

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <aside
      className={`bg-white border-r border-[#DDE2E7] flex flex-col transition-all duration-200 select-none z-30 flex-shrink-0 ${
        isCollapsed ? 'w-12' : 'w-52'
      }`}
    >
      {/* Collapse Toggle Header */}
      <div className="px-2 py-1.5 border-b border-[#DDE2E7] flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-[#5F6877] uppercase tracking-wider pl-1.5">
            Operations Menu
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded text-[#5F6877] hover:text-[#172033] hover:bg-[#F1F3F5] transition-colors cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Menu' : 'Collapse Menu'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-1.5 overflow-y-auto space-y-0.5 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-xs rounded transition-colors cursor-pointer text-left relative group ${
                isActive
                  ? 'bg-[#EBF3FA] text-[#1D4E89] font-semibold'
                  : 'text-[#172033] hover:bg-[#F8F9FA] hover:text-[#1D4E89]'
              }`}
            >
              {/* Active Indicator Strip */}
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#1D4E89] rounded-r"></span>
              )}

              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-[#1D4E89]' : 'text-[#5F6877]'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate text-[11px] leading-tight flex-1">
                  {item.label}
                </span>
              )}

              {/* Floating Tooltip when Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#172033] text-white text-[10px] rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info in Sidebar */}
      {!isCollapsed && (
        <div className="p-2 border-t border-[#DDE2E7] bg-[#F8F9FA] text-[9px] text-[#5F6877] space-y-0.5">
          <div className="font-semibold text-[#172033]">SEOC Command Gateway</div>
          <div>EPSG:4326 WGS84 • DoNER/NDMA</div>
        </div>
      )}
    </aside>
  );
};
