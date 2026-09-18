import { RiskLevel } from '../types';

const VALID_RISK_LEVELS: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const normalizeRiskLevel = (
  value: unknown,
  fallback: RiskLevel = 'LOW'
): RiskLevel => {
  const normalized = String(value ?? '').trim().toUpperCase();

  if (normalized === 'MEDIUM') return 'MODERATE';
  if (VALID_RISK_LEVELS.includes(normalized as RiskLevel)) {
    return normalized as RiskLevel;
  }

  return fallback;
};

/**
 * Backend soil-moisture feeds are accepted in either fractional form (0..1)
 * or percentage form (0..100). The UI domain model always uses percent.
 */
export const normalizeSoilMoisturePct = (
  value: unknown,
  fallback: number
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const percentage = parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
  return Math.round(percentage * 10) / 10;
};

export const normalizeProbabilityPct = (
  value: unknown,
  fallback: number
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const percentage = parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
  return Math.round(percentage * 10) / 10;
};

export const isFiniteMetric = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const formatMetric = (
  value: unknown,
  suffix = '',
  maximumFractionDigits = 1
): string => {
  if (!isFiniteMetric(value)) return 'Unavailable';

  return `${value.toLocaleString('en-IN', {
    maximumFractionDigits
  })}${suffix}`;
};
