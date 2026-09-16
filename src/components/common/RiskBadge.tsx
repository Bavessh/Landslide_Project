import React from 'react';
import { RiskLevel } from '../../types';

interface Props {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const RiskBadge: React.FC<Props> = ({
  level,
  score,
  size = 'md',
  showDot = true
}) => {
  const getColors = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-600'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-300',
          dot: 'bg-orange-600'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-600'
        };
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600'
        };
    }
  };

  const colors = getColors();

  const sizeClass =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs font-bold'
      : 'px-2 py-0.5 text-[11px] font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border uppercase tracking-wider font-mono ${sizeClass} ${colors.bg}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>}
      <span>{level}</span>
      {score !== undefined && <span className="opacity-80">({score}%)</span>}
    </span>
  );
};
