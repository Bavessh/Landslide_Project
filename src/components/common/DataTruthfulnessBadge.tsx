import React from 'react';
import { DataProvenance } from '../../types';
import { ShieldAlert, Satellite, CloudRain, Cpu, Database } from 'lucide-react';

interface Props {
  provenance: DataProvenance;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const DataTruthfulnessBadge: React.FC<Props> = ({ provenance, size = 'sm', showIcon = true }) => {
  const getBadgeConfig = () => {
    switch (provenance) {
      case 'PROJECT API':
        return {
          icon: Database,
          label: 'PROJECT API',
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          desc: 'Value returned by the connected Vortexa project API'
        };
      case 'LIVE MAP':
        return {
          icon: Satellite,
          label: 'LIVE MAP (OSM)',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          desc: 'OpenStreetMap cartographic tiles'
        };
      case 'LIVE WEATHER':
        return {
          icon: CloudRain,
          label: 'LIVE WEATHER',
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          desc: 'Current meteorological feed when the configured weather API is reachable'
        };
      case 'AI PREDICTION':
        return {
          icon: Cpu,
          label: 'AI ESTIMATE (MODEL)',
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-300',
          desc: 'Project model inference — not a guaranteed prediction'
        };
      case 'HISTORICAL DATA':
        return {
          icon: Database,
          label: 'HISTORICAL GSI ARCHIVE',
          bg: 'bg-stone-50 text-stone-800 border-stone-300',
          desc: 'Validated Geological Survey of India inventory'
        };
      case 'PROTOTYPE DATA':
      default:
        return {
          icon: ShieldAlert,
          label: 'PROTOTYPE SIMULATION',
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          desc: 'Validated test dataset for Hackathon demonstration'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded border tracking-wider uppercase ${config.bg} ${sizeClasses}`}
      title={config.desc}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
