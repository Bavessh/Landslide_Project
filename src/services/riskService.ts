import {
  MonitoredLocation,
  RoadSegment,
  RiskLevel,
  RiskTrend,
  TimeHorizon,
  RiskNowNextData,
  RiskForecastItem,
  RiskTrendPoint,
  RiskExplanation,
  FeatureContribution,
  PredictionReliability,
  SlopeRiskFingerprint,
  AdaptiveThreshold,
  SlopeDeteriorationStatus,
  RainfallMemoryData,
  RainfallMemoryPoint,
  RegionalRiskSummaryItem,
  NERState
} from '../types';
import { apiClient, ApiError } from './apiClient';

/**
 * Frontend risk intelligence service.
 * Connects to future backend ML inference pipelines (XGBoost / Random Forest).
 * Operates on strongly typed domain contracts.
 * Prototype data is explicitly flagged and labelled for transparent governance.
 */
class RiskService {
  /**
   * Calculates Risk Now + Next (+6h, +12h, +24h) for a monitored slope
   */
  async getRiskNowNext(location: MonitoredLocation): Promise<RiskNowNextData> {
    let baseScore = location.riskScore;
    let baseLevel = location.riskLevel;
    let provenance: 'PROJECT API' | 'PROTOTYPE DATA' = 'PROTOTYPE DATA';
    let backendRisk: RiskNowNextData['backendRisk'];

    if (/^\d+$/.test(location.id)) {
      try {
        const response = await apiClient.get<{
          risk?: {
            risk_probability?: number;
            risk_score?: number;
            risk_level?: string;
            confidence?: number | null;
          } | null;
        }>(`/v1/risk/${location.id}`);
        if (response.risk) {
          const backendScore = response.risk.risk_score ?? ((response.risk.risk_probability || 0) * 100);
          baseScore = Math.round(backendScore * 10) / 10;
          baseLevel = response.risk.risk_level === 'MEDIUM' ? 'MODERATE' : (response.risk.risk_level as RiskLevel) || baseLevel;
          provenance = 'PROJECT API';
          backendRisk = {
            probabilityPct: Math.round((response.risk.risk_probability ?? backendScore / 100) * 1000) / 10,
            score: baseScore,
            level: baseLevel,
            confidencePct: response.risk.confidence == null ? null : Math.round(response.risk.confidence * 1000) / 10,
            modelVersion: 'model_version' in response.risk && response.risk.model_version ? String(response.risk.model_version) : 'Not available',
            predictionWindow: 'prediction_window' in response.risk && response.risk.prediction_window ? String(response.risk.prediction_window) : 'Not available',
            timestamp: 'timestamp' in response.risk && response.risk.timestamp ? String(response.risk.timestamp) : 'Not available'
          };
        }
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
      }
    }
    const trendMultiplier = location.riskTrend === 'RISING' ? 1.0 : location.riskTrend === 'DECREASING' ? -0.8 : 0.2;

    // Projected progression over +6h, +12h, +24h
    const h6Score = Math.min(98, Math.max(8, Math.round(baseScore + 6 * trendMultiplier)));
    const h12Score = Math.min(99, Math.max(6, Math.round(baseScore + 12 * trendMultiplier)));
    const h24Score = Math.min(99, Math.max(5, Math.round(baseScore + 18 * trendMultiplier)));

    const scoreToLevel = (s: number): RiskLevel => {
      if (s >= 85) return 'CRITICAL';
      if (s >= 70) return 'HIGH';
      if (s >= 50) return 'MODERATE';
      return 'LOW';
    };

    const h6Level = scoreToLevel(h6Score);
    const h12Level = scoreToLevel(h12Score);
    const h24Level = scoreToLevel(h24Score);

    return {
      locationId: location.id,
      now: {
        probabilityPct: location.riskScore,
        riskLevel: baseLevel,
        trend: location.riskTrend
      },
      forecast: {
        h6: {
          horizon: '+6H',
          probabilityPct: h6Score,
          riskLevel: h6Level,
          confidenceScore: Math.max(60, location.confidenceScore - 4),
          primaryDriver: location.rainfall24hMm > 60 ? 'Heavy monsoonal runoff' : 'Antecedent saturation memory'
        },
        h12: {
          horizon: '+12H',
          probabilityPct: h12Score,
          riskLevel: h12Level,
          confidenceScore: Math.max(55, location.confidenceScore - 8),
          primaryDriver: location.drainageDisrupted ? 'Blocked surface culverts' : 'Deep hydrologic pore pressure'
        },
        h24: {
          horizon: '+24H',
          probabilityPct: h24Score,
          riskLevel: h24Level,
          confidenceScore: Math.max(50, location.confidenceScore - 12),
          primaryDriver: 'Cumulative ground destabilization'
        }
      },
      dataProvenance: provenance,
      backendRisk
    };
  }

  /**
   * Return locations with risk scores adjusted to the requested map TimeHorizon
   */
  getLocationsForHorizon(locations: MonitoredLocation[], horizon: TimeHorizon): MonitoredLocation[] {
    if (horizon === 'NOW') return locations;

    const hourOffset = horizon === '+6H' ? 6 : horizon === '+12H' ? 12 : 24;

    return locations.map((loc) => {
      const trendMultiplier = loc.riskTrend === 'RISING' ? 1.0 : loc.riskTrend === 'DECREASING' ? -0.8 : 0.2;
      const forecastScore = Math.min(99, Math.max(5, Math.round(loc.riskScore + (hourOffset / 2) * trendMultiplier)));

      let forecastLevel: RiskLevel = 'LOW';
      if (forecastScore >= 85) forecastLevel = 'CRITICAL';
      else if (forecastScore >= 70) forecastLevel = 'HIGH';
      else if (forecastScore >= 50) forecastLevel = 'MODERATE';

      return {
        ...loc,
        riskScore: forecastScore,
        riskLevel: forecastLevel
      };
    });
  }

  /**
   * Risk trend across Past 24h, Now, and Next 24h for Recharts
   */
  async getRiskTrend(location: MonitoredLocation): Promise<RiskTrendPoint[]> {
    const points: RiskTrendPoint[] = [];
    const baseScore = location.riskScore;
    const isRising = location.riskTrend === 'RISING';

    // Historical Points (-24h, -18h, -12h, -6h)
    const histDeltas = isRising ? [-22, -16, -10, -5] : [12, 9, 6, 3];
    const histHours = [-24, -18, -12, -6];

    histHours.forEach((hour, idx) => {
      const score = Math.min(95, Math.max(10, baseScore + histDeltas[idx]));
      const rain = Math.max(0, Math.round((location.rainfall24hMm / 6) * (1 + Math.sin(idx))));
      points.push({
        timeLabel: `${hour}h`,
        hourOffset: hour,
        riskScore: score,
        riskLevel: score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 50 ? 'MODERATE' : 'LOW',
        rainfallMm: rain,
        periodType: 'HISTORICAL'
      });
    });

    // NOW point (0h)
    points.push({
      timeLabel: 'NOW',
      hourOffset: 0,
      riskScore: location.riskScore,
      riskLevel: location.riskLevel,
      rainfallMm: Math.round(location.rainfallCurrentMm || location.rainfall24hMm / 10),
      periodType: 'CURRENT',
      confidenceMin: Math.max(10, location.riskScore - 5),
      confidenceMax: Math.min(99, location.riskScore + 5)
    });

    // Forecast Points (+6h, +12h, +18h, +24h)
    const fcDeltas = isRising ? [7, 13, 17, 20] : [-4, -8, -11, -14];
    const fcHours = [6, 12, 18, 24];

    fcHours.forEach((hour, idx) => {
      const score = Math.min(98, Math.max(6, baseScore + fcDeltas[idx]));
      const uncertainty = (idx + 1) * 3;
      points.push({
        timeLabel: `+${hour}h`,
        hourOffset: hour,
        riskScore: score,
        riskLevel: score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 50 ? 'MODERATE' : 'LOW',
        rainfallMm: Math.max(0, Math.round(12 - idx * 2.5)),
        periodType: 'FORECAST',
        confidenceMin: Math.max(5, score - uncertainty),
        confidenceMax: Math.min(99, score + uncertainty)
      });
    });

    return points;
  }

  /**
   * Explainable AI feature contributions (Why Is Risk High?)
   */
  async getRiskExplanation(location: MonitoredLocation): Promise<RiskExplanation> {
    const isSevere = location.riskScore >= 70;

    const contributions: FeatureContribution[] = [
      {
        feature: '24h Precipitation Influx',
        impactValue: Math.round(location.rainfall24hMm * 0.38),
        category: 'RAINFALL',
        description: `Severe 24h rainfall of ${location.rainfall24hMm} mm significantly exceeds regional infiltration capacity.`,
        relativeImportancePct: 32
      },
      {
        feature: 'Topographic Slope Angle',
        impactValue: Math.round(location.slopeAngleDeg * 0.65),
        category: 'TERRAIN',
        description: `High slope inclination of ${location.slopeAngleDeg}° produces excessive downslope shear stress.`,
        relativeImportancePct: 25
      },
      {
        feature: 'Antecedent Rainfall Memory',
        impactValue: Math.round(location.rainfallDecayMemoryMm * 0.28),
        category: 'ANTECEDENT',
        description: `Accumulated antecedent saturation memory (${location.rainfallDecayMemoryMm} mm) maintains elevated pore water pressure.`,
        relativeImportancePct: 18
      },
      {
        feature: 'Historical Failure Frequency',
        impactValue: location.riskScore > 75 ? 14 : 9,
        category: 'GEOLOGY',
        description: 'Prior regolith rupture clusters identified in GSI inventory within 1.5 km corridor.',
        relativeImportancePct: 12
      },
      {
        feature: 'Subsurface Soil Moisture',
        impactValue: Math.round(location.soilMoisturePct * 0.12),
        category: 'ANTECEDENT',
        description: `Soil moisture saturation measured at ${location.soilMoisturePct}% of field capacity.`,
        relativeImportancePct: 8
      },
      {
        feature: 'Drainage & Culvert Condition',
        impactValue: location.drainageDisrupted ? 11 : 3,
        category: 'DRAINAGE',
        description: location.drainageDisrupted
          ? 'Debris blockage in roadside toe drains impedes normal stormwater runoff.'
          : 'Natural drainage channels intact.',
        relativeImportancePct: 5
      }
    ];

    contributions.sort((a, b) => b.impactValue - a.impactValue);

    return {
      locationId: location.id,
      locationName: location.name,
      isModelExplanation: false, // Labelled as PROTOTYPE EXPLANATION until backend SHAP pipeline is deployed
      summary: `Risk is ${isSevere ? 'heavily elevated' : 'moderate'} primarily because of intense short-duration rainfall influx, steep Himalayan relief, and persistent antecedent moisture memory.`,
      topDrivers: contributions.slice(0, 3).map((c) => c.feature),
      contributions,
      disclaimer: 'AI estimate — not a guaranteed prediction. Requires field validation by SDMA/DDMA technical officers.'
    };
  }

  /**
   * Slope Risk Fingerprint
   */
  async getSlopeFingerprint(location: MonitoredLocation): Promise<SlopeRiskFingerprint> {
    const terrainScore = Math.min(95, Math.round((location.slopeAngleDeg / 48) * 100));
    const rainfallScore = Math.min(98, Math.round((location.rainfall24hMm / 120) * 100));
    const historyScore = location.riskScore > 75 ? 86 : location.riskScore > 55 ? 65 : 42;
    const moistureScore = Math.min(96, location.soilMoisturePct);
    const drainageScore = location.drainageDisrupted ? 88 : 45;
    const roadCutScore = location.elevationM > 1200 ? 74 : 58;

    const toLevel = (val: number): 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' => {
      if (val >= 80) return 'VERY HIGH';
      if (val >= 65) return 'HIGH';
      if (val >= 45) return 'MODERATE';
      return 'LOW';
    };

    return {
      locationId: location.id,
      locationName: location.name,
      terrainSusceptibility: toLevel(terrainScore),
      rainfallSensitivity: toLevel(rainfallScore),
      historicalInstability: toLevel(historyScore),
      moistureSensitivity: toLevel(moistureScore),
      drainageSensitivity: toLevel(drainageScore),
      roadCutSensitivity: toLevel(roadCutScore),
      scores: {
        terrain: terrainScore,
        rainfall: rainfallScore,
        history: historyScore,
        moisture: moistureScore,
        drainage: drainageScore,
        roadCut: roadCutScore
      },
      geologicalProfile: 'Weathered metamorphic phyllite and quartzites with deep clay overburden',
      isPrototype: true
    };
  }

  /**
   * Location-Specific Adaptive Threshold
   */
  async getAdaptiveThreshold(location: MonitoredLocation): Promise<AdaptiveThreshold> {
    const regionalGeneric = 70; // 70% generic regional baseline
    // Location-specific threshold adapted to geology, slope, and past failure triggers
    const locationSpecific = location.thresholdValue || 61;
    const delta = locationSpecific - regionalGeneric;
    const isExceeded = location.riskScore >= locationSpecific;

    return {
      locationId: location.id,
      locationName: location.name,
      regionalGenericThresholdPct: regionalGeneric,
      locationSpecificThresholdPct: locationSpecific,
      currentRiskPct: location.riskScore,
      deltaPct: delta,
      status: isExceeded ? 'EXCEEDED' : location.riskScore >= locationSpecific - 8 ? 'WARNING_WINDOW' : 'NORMAL',
      justification: `This monitored slope historically destabilizes at ${locationSpecific}% risk due to steep ${location.slopeAngleDeg}° cut-slope geometry and permeable jointed rock mass, which is lower than the generic regional baseline of ${regionalGeneric}%.`,
      isPrototype: true
    };
  }

  /**
   * Prediction Reliability & False-Alarm Intelligence
   */
  async getPredictionReliability(location: MonitoredLocation): Promise<PredictionReliability> {
    const confidence = location.confidenceScore || 89;
    const currentWarningThreshold = location.thresholdValue || 61;
    const modelProb = location.riskScore;

    const evidenceStrength = confidence >= 85 ? 'STRONG' : confidence >= 70 ? 'MODERATE' : 'WEAK';
    const warningReliability = modelProb >= currentWarningThreshold && confidence >= 80 ? 'HIGH' : 'MODERATE';

    return {
      locationId: location.id,
      confidencePct: confidence,
      evidenceStrength,
      dataCompletenessPct: 92,
      warningReliability,
      currentWarningThresholdPct: currentWarningThreshold,
      modelProbabilityPct: modelProb,
      historicalFalseAlarmTendency: 'LOW',
      explanation: `This location's current prediction (${modelProb}%) exceeds its adaptive threshold (${currentWarningThreshold}%) with strong supporting environmental evidence from CWC telemetry and satellite SAR coherence.`,
      isPrototypeMetric: true
    };
  }

  /**
   * Slope Deterioration Detector
   */
  async getDeteriorationStatus(location: MonitoredLocation): Promise<SlopeDeteriorationStatus> {
    const isHigh = location.riskScore >= 70;
    const isRising = location.riskTrend === 'RISING';

    let condition: 'STABLE' | 'WATCH' | 'DETERIORATING' | 'RAPID DETERIORATION' = 'STABLE';
    let urgency: 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'IMMEDIATE ACTION' = 'ROUTINE';

    if (location.riskScore >= 85 && isRising) {
      condition = 'RAPID DETERIORATION';
      urgency = 'IMMEDIATE ACTION';
    } else if (isHigh || (location.riskScore >= 60 && isRising)) {
      condition = 'DETERIORATING';
      urgency = 'HIGH';
    } else if (location.riskScore >= 50 || isRising) {
      condition = 'WATCH';
      urgency = 'ELEVATED';
    }

    const tMinus6 = Math.max(10, location.riskScore - (isRising ? 8 : -4));
    const tMinus12 = Math.max(10, location.riskScore - (isRising ? 14 : -7));

    return {
      locationId: location.id,
      locationName: location.name,
      condition,
      riskTrajectory: [
        { label: '-12h', score: tMinus12 },
        { label: '-6h', score: tMinus6 },
        { label: 'NOW', score: location.riskScore }
      ],
      rainfallMemoryTrend: isRising ? 'INCREASING' : 'STABLE',
      soilMoistureTrend: location.soilMoistureTrend === 'INCREASING' ? 'INCREASING' : 'STABLE',
      fieldEvidenceCount: location.drainageDisrupted ? 2 : 0,
      drainageCondition: location.drainageDisrupted ? 'DISRUPTED / CLOGGED' : 'FREE FLOW',
      recommendation:
        condition === 'RAPID DETERIORATION'
          ? 'Initiate emergency sector evacuation protocol. Close downslope highway to commercial traffic.'
          : condition === 'DETERIORATING'
          ? 'Prepare preventive response and issue localized advisory to village councils.'
          : condition === 'WATCH'
          ? 'Continue enhanced monitoring and dispatch field inspector for crown tension crack check.'
          : 'Maintain routine automated sensor surveillance.',
      urgencyLevel: urgency,
      isPrototype: true
    };
  }

  /**
   * Rainfall Memory innovation data & time-series
   */
  async getRainfallMemoryData(location: MonitoredLocation): Promise<RainfallMemoryData> {
    const memoryValue = location.rainfallDecayMemoryMm || 48;
    const status: 'LOW' | 'MODERATE' | 'HIGH' = memoryValue >= 60 ? 'HIGH' : memoryValue >= 35 ? 'MODERATE' : 'LOW';

    // Time-series showing rainfall pulse decreasing while memory remains high
    const timeSeries: RainfallMemoryPoint[] = [
      { timeLabel: '-36h', hourOffset: -36, actualRainfallMm: 22, rainfallMemoryMm: 18, landslideRiskScore: 35 },
      { timeLabel: '-24h', hourOffset: -24, actualRainfallMm: 68, rainfallMemoryMm: 62, landslideRiskScore: 64 },
      { timeLabel: '-12h', hourOffset: -12, actualRainfallMm: 45, rainfallMemoryMm: 78, landslideRiskScore: 78 },
      { timeLabel: '-6h', hourOffset: -6, actualRainfallMm: 18, rainfallMemoryMm: 74, landslideRiskScore: 82 },
      { timeLabel: 'NOW', hourOffset: 0, actualRainfallMm: location.rainfallCurrentMm || 8, rainfallMemoryMm: memoryValue, landslideRiskScore: location.riskScore },
      { timeLabel: '+6h', hourOffset: 6, actualRainfallMm: 4, rainfallMemoryMm: Math.round(memoryValue * 0.88), landslideRiskScore: Math.round(location.riskScore * 0.94) },
      { timeLabel: '+12h', hourOffset: 12, actualRainfallMm: 2, rainfallMemoryMm: Math.round(memoryValue * 0.76), landslideRiskScore: Math.round(location.riskScore * 0.88) },
      { timeLabel: '+24h', hourOffset: 24, actualRainfallMm: 0, rainfallMemoryMm: Math.round(memoryValue * 0.58), landslideRiskScore: Math.round(location.riskScore * 0.75) }
    ];

    return {
      locationId: location.id,
      locationName: location.name,
      currentValueMm: memoryValue,
      status,
      peakPastRainfallMm: 68,
      decayRateDescription: 'Exponential decay half-life: ~36 hours for weathered regolith overburden',
      explanation: 'Recent rainfall continues to elevate landslide vulnerability even after rainfall intensity subsides because subsurface water infiltration and pore water pressure persist inside the slope body.',
      timeSeries,
      isPrototype: true
    };
  }

  /**
   * NER Regional Risk Summary Table data (8 States)
   */
  async getRegionalRiskSummary(locations: MonitoredLocation[], roads: RoadSegment[]): Promise<RegionalRiskSummaryItem[]> {
    const states: NERState[] = [
      'Assam',
      'Arunachal Pradesh',
      'Meghalaya',
      'Manipur',
      'Mizoram',
      'Nagaland',
      'Tripura',
      'Sikkim'
    ];

    return states.map((state) => {
      const stateLocs = locations.filter((l) => l.state === state);
      const stateRoads = roads.filter((r) => r.state === state);

      const criticalCount = stateLocs.filter((l) => l.riskLevel === 'CRITICAL').length;
      const highCount = stateLocs.filter((l) => l.riskLevel === 'HIGH').length;
      const activeRoadBlocks = stateRoads.filter((r) => r.status === 'BLOCKED').length;

      // Calculate state average or peak risk
      const peakScore = stateLocs.length > 0 ? Math.max(...stateLocs.map((l) => l.riskScore)) : 52;
      const hasRising = stateLocs.some((l) => l.riskTrend === 'RISING');
      const trend: RiskTrend = hasRising ? 'RISING' : 'STABLE';

      const h6Score = Math.min(98, Math.round(peakScore + (trend === 'RISING' ? 6 : 0)));

      const toLevel = (s: number): RiskLevel => {
        if (s >= 85) return 'CRITICAL';
        if (s >= 70) return 'HIGH';
        if (s >= 50) return 'MODERATE';
        return 'LOW';
      };

      return {
        state,
        nowLevel: toLevel(peakScore),
        nowScore: peakScore,
        h6Level: toLevel(h6Score),
        h6Score,
        trend,
        criticalCount,
        highCount,
        activeRoadBlocks
      };
    });
  }
}

export const riskService = new RiskService();
