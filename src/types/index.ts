export type Role = 'AUTHORITY' | 'CITIZEN' | 'RESCUE';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type RiskTrend = 'RISING' | 'STABLE' | 'DECREASING';

export type DataProvenance = 
  | 'PROJECT API'
  | 'LIVE MAP'
  | 'LIVE WEATHER'
  | 'AI PREDICTION'
  | 'HISTORICAL DATA'
  | 'PROTOTYPE DATA';

export type NERState = 
  | 'Arunachal Pradesh'
  | 'Assam'
  | 'Meghalaya'
  | 'Manipur'
  | 'Mizoram'
  | 'Nagaland'
  | 'Tripura'
  | 'Sikkim';

export interface ContributingFactor {
  factor: string;
  contributionPct: number;
  description: string;
}

export interface MonitoredLocation {
  id: string;
  name: string;
  state: NERState;
  district: string;
  lat: number;
  lng: number;
  slopeAngleDeg: number;
  elevationM: number;
  soilMoisturePct: number;
  soilMoistureTrend: 'INCREASING' | 'STABLE' | 'DRYING';
  rainfallCurrentMm: number;
  rainfall24hMm: number;
  rainfall72hMm: number;
  rainfallDecayMemoryMm: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskTrend: RiskTrend;
  confidenceScore: number; // 0 - 100
  thresholdValue: number; // dynamically adapted threshold
  drainageDisrupted: boolean;
  cascadingHazard: string | null;
  keyContributingFactors: ContributingFactor[];
  nearbyInfrastructure: string[];
  vulnerablePopulationEst: number;
  lastUpdated: string;
  dataProvenance: DataProvenance;
  riskProbability?: number;
  riskConfidence?: number | null;
  modelVersion?: string;
  predictionWindow?: string;
  riskTimestamp?: string;
}

export interface RoadSegment {
  id: string;
  code: string;
  name: string;
  state: NERState;
  district: string;
  coordinates: [number, number][];
  status: 'PASSABLE' | 'CAUTION' | 'BLOCKED';
  blockageProbabilityPct: number;
  cause?: string;
  bypassAvailable: boolean;
  bypassRouteName?: string;
  bypassAdditionalKm?: number;
  connectedCommunities: string[];
  criticalForEmergency: boolean;
}

export interface ShelterFacility {
  id: string;
  name: string;
  state: NERState;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  status: 'AVAILABLE' | 'NEAR_CAPACITY' | 'FULL';
  hasMedicalPost: boolean;
  hasPowerBackup: boolean;
  hasFoodWaterSupply: boolean;
  hasSanitation: boolean;
  officerInCharge: string;
  contactNumber: string;
}

export interface FieldReport {
  id: string;
  timestamp: string;
  lat: number;
  lng: number;
  locationName: string;
  state: NERState;
  district: string;
  category: 'SLOPE_CRACK' | 'ROCKFALL' | 'BLOCKED_CULVERT' | 'WATER_SEEPAGE' | 'ROAD_COLLAPSE';
  severity: RiskLevel;
  reporterType: 'CITIZEN' | 'FIELD_SURVEYOR' | 'RESCUE_PERSONNEL';
  description: string;
  verifiedByAuthority: boolean;
  elevationM?: number;
}

export interface EmergencyBulletin {
  id: string;
  title: string;
  severity: RiskLevel;
  targetState: NERState;
  targetDistricts: string[];
  issuedAt: string;
  validUntil: string;
  summary: string;
  instructions: string[];
  issuedBy: string;
}

export type Language = 'en' | 'hi' | 'as' | 'bn';

export type NavigationTab =
  | 'overview'
  | 'risk_intelligence'
  | 'risk_map'
  | 'locations'
  | 'weather'
  | 'impact'
  | 'roads'
  | 'shelters'
  | 'what_if'
  | 'field_reports'
  | 'alerts'
  | 'response_priorities'
  | 'model_intelligence'
  | 'system_activity';

export type RainfallMemoryLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
export type DrainageCondition = 'NORMAL' | 'PARTIALLY RESTRICTED' | 'BLOCKED / DISRUPTED';
export type RoadFailureScenario = 'NONE' | 'SELECTED ROAD FAILS' | 'CRITICAL CORRIDOR FAILS';

export interface CounterfactualScenarioInput {
  rainfallChangePct: number;
  soilMoistureChangePct: number;
  rainfallMemory: RainfallMemoryLevel;
  drainageCondition: DrainageCondition;
  roadFailure: RoadFailureScenario;
  forecastWindow: '+6H' | '+12H' | '+24H';
}

export interface ScenarioImpactDelta {
  baseline: number;
  scenario: number;
  delta: number;
}

export interface CounterfactualScenarioResult {
  input: CounterfactualScenarioInput;
  baselineRisk: number;
  baselineRiskLevel: RiskLevel;
  scenarioRisk: number;
  scenarioRiskLevel: RiskLevel;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  impacts: {
    affectedPopulation: ScenarioImpactDelta;
    settlementsAtRisk: ScenarioImpactDelta;
    roadsAtRisk: ScenarioImpactDelta;
    shelterDemand: ScenarioImpactDelta;
  };
  responseUrgency: { baseline: RiskLevel; scenario: RiskLevel };
  roadConsequence: {
    affectedRoadName: string | null;
    previousStatus: RoadStatus | null;
    scenarioStatus: RoadStatus | null;
    dependentCommunities: string[];
    routeCompromised: boolean;
    reroutingRequired: boolean;
  };
  shelterConsequence: {
    currentRecommendedCapacity: number;
    projectedRemainingCapacity: number;
    additionalShelterRequired: boolean;
  };
  drivers: string[];
  disclaimer: string;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'BRIDGE' | 'SETTLEMENT' | 'RIVER';
  lat: number;
  lng: number;
  state: NERState;
  district: string;
  status: 'OPERATIONAL' | 'WARNING' | 'SUBMERGED' | 'ISOLATED';
  details: string;
}

export interface LiveWeatherData {
  temperatureC: number;
  relativeHumidityPct: number;
  precipitationMm: number;
  windSpeedKmh: number;
  soilMoistureEstPct: number;
  weatherDescription: string;
  isLive: boolean;
  source: string;
  lastFetched: string;
}

export interface GISLayerToggles {
  // Real GIS
  osm: boolean;
  stateBoundaries: boolean;
  districtBoundaries: boolean;
  roads: boolean;
  settlements: boolean;
  hospitals: boolean;
  bridges: boolean;
  rivers: boolean;
  // Environment
  rainfall: boolean;
  soilMoisture: boolean;
  terrain: boolean;
  // Landslide Intelligence
  currentRisk: boolean;
  riskHeatmap: boolean;
  fieldReports: boolean;
  // Response
  shelters: boolean;
}

export interface StateDistrictMetadata {
  state: NERState;
  capital: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  zoom: number;
  districts: {
    name: string;
    center: [number, number];
    highRiskZoneCount: number;
  }[];
}

// ==========================================
// PHASE 2 INTELLIGENCE & EXPLAINABILITY TYPES
// ==========================================

export type TimeHorizon = 'NOW' | '+6H' | '+12H' | '+24H';

export interface RiskForecastItem {
  horizon: '+6H' | '+12H' | '+24H';
  probabilityPct: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  primaryDriver: string;
}

export interface RiskNowNextData {
  locationId: string;
  now: {
    probabilityPct: number;
    riskLevel: RiskLevel;
    trend: RiskTrend;
  };
  forecast: {
    h6: RiskForecastItem;
    h12: RiskForecastItem;
    h24: RiskForecastItem;
  };
  dataProvenance: DataProvenance;
  backendRisk?: {
    probabilityPct: number;
    score: number;
    level: RiskLevel;
    confidencePct: number | null;
    modelVersion: string;
    predictionWindow: string;
    timestamp: string;
  };
}

export interface RiskTrendPoint {
  timeLabel: string; // e.g. "-24h", "-12h", "NOW", "+6h", "+12h", "+24h"
  hourOffset: number; // -24 to +24
  riskScore: number;
  riskLevel: RiskLevel;
  rainfallMm: number;
  periodType: 'HISTORICAL' | 'CURRENT' | 'FORECAST';
  confidenceMin?: number;
  confidenceMax?: number;
}

export interface FeatureContribution {
  feature: string;
  impactValue: number; // e.g. +31
  category: 'RAINFALL' | 'TERRAIN' | 'ANTECEDENT' | 'GEOLOGY' | 'DRAINAGE' | 'HUMAN';
  description: string;
  relativeImportancePct: number;
}

export interface RiskExplanation {
  locationId: string;
  locationName: string;
  isModelExplanation: boolean; // true = MODEL EXPLANATION, false = PROTOTYPE EXPLANATION
  summary: string;
  topDrivers: string[];
  contributions: FeatureContribution[];
  disclaimer: string;
}

export interface PredictionReliability {
  locationId: string;
  confidencePct: number;
  evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  dataCompletenessPct: number;
  warningReliability: 'HIGH' | 'MODERATE' | 'EVALUATING';
  currentWarningThresholdPct: number;
  modelProbabilityPct: number;
  historicalFalseAlarmTendency: 'LOW' | 'MODERATE' | 'ELEVATED';
  explanation: string;
  isPrototypeMetric: boolean;
}

export type SensitivityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';

export interface SlopeRiskFingerprint {
  locationId: string;
  locationName: string;
  terrainSusceptibility: SensitivityLevel;
  rainfallSensitivity: SensitivityLevel;
  historicalInstability: SensitivityLevel;
  moistureSensitivity: SensitivityLevel;
  drainageSensitivity: SensitivityLevel;
  roadCutSensitivity: SensitivityLevel;
  scores: {
    terrain: number; // 0 - 100
    rainfall: number;
    history: number;
    moisture: number;
    drainage: number;
    roadCut: number;
  };
  geologicalProfile: string;
  isPrototype: boolean;
}

export interface AdaptiveThreshold {
  locationId: string;
  locationName: string;
  regionalGenericThresholdPct: number; // e.g. 70%
  locationSpecificThresholdPct: number; // e.g. 61%
  currentRiskPct: number; // e.g. 82%
  deltaPct: number; // e.g. -9%
  status: 'EXCEEDED' | 'WARNING_WINDOW' | 'NORMAL';
  justification: string;
  isPrototype: boolean;
}

export interface SlopeDeteriorationStatus {
  locationId: string;
  locationName: string;
  condition: 'STABLE' | 'WATCH' | 'DETERIORATING' | 'RAPID DETERIORATION';
  riskTrajectory: { label: string; score: number }[]; // e.g. [-6h: 58%, NOW: 66%, +6h: 74%]
  rainfallMemoryTrend: 'DECREASING' | 'STABLE' | 'INCREASING';
  soilMoistureTrend: 'DRYING' | 'STABLE' | 'INCREASING';
  fieldEvidenceCount: number;
  drainageCondition: 'FREE FLOW' | 'PARTIALLY CONSTRICTED' | 'DISRUPTED / CLOGGED';
  recommendation: string;
  urgencyLevel: 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'IMMEDIATE ACTION';
  isPrototype: boolean;
}

export interface RainfallMemoryPoint {
  timeLabel: string;
  hourOffset: number;
  actualRainfallMm: number;
  rainfallMemoryMm: number;
  landslideRiskScore: number;
}

export interface RainfallMemoryData {
  locationId: string;
  locationName: string;
  currentValueMm: number;
  status: 'LOW' | 'MODERATE' | 'HIGH';
  peakPastRainfallMm: number;
  decayRateDescription: string;
  explanation: string;
  timeSeries: RainfallMemoryPoint[];
  isPrototype: boolean;
}

export interface RegionalRiskSummaryItem {
  state: NERState;
  nowLevel: RiskLevel;
  nowScore: number;
  h6Level: RiskLevel;
  h6Score: number;
  trend: RiskTrend;
  criticalCount: number;
  highCount: number;
  activeRoadBlocks: number;
}

// ==========================================
// PHASE 3 OPERATIONAL CHAIN TYPES
// ==========================================

export type RoadStatus = 'SAFE' | 'AT RISK' | 'LIKELY BLOCKED' | 'BLOCKED';

export interface AffectedSettlement {
  id: string;
  name: string;
  district: string;
  state: NERState;
  lat: number;
  lng: number;
  distanceKm: number;
  hazardExposure: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  roadAccess: 'SAFE' | 'AT RISK' | 'SEVERED' | 'RESTRICTED';
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  estimatedPopulation: number;
  sourceLabel: 'LIVE MAP DATA' | 'PROTOTYPE IMPACT ESTIMATE';
  recommendedAction: string;
  associatedLocationId: string;
}

export interface ExposedFacility {
  name: string;
  type: string;
  distanceKm: number;
  status: string;
  criticality: 'ROUTINE' | 'HIGH' | 'VITAL';
}

export interface InfrastructureExposure {
  hospitalsExposed: ExposedFacility[];
  schoolsExposed: ExposedFacility[];
  criticalInfrastructure: {
    name: string;
    type: string;
    status: string;
    hazardImpact: string;
  }[];
  roadsExposedCount: number;
  sheltersInExposureZone: number;
}

export interface ImpactSummaryMetrics {
  potentiallyAffectedPopulation: number;
  settlementsAtRisk: number;
  roadsExposed: number;
  criticalInfrastructure: number;
  hospitalsHealthFacilities: number;
  schoolsPublicFacilities: number;
  sheltersInExposureArea: number;
  dataLabel: 'PROJECT API' | 'PROTOTYPE IMPACT ESTIMATE';
}

export interface TopAffectedLocationRank {
  rank: number;
  locationId: string;
  name: string;
  district: string;
  state: NERState;
  riskSeverityScore: number;
  populationExposure: number;
  roadAccessibilityStatus: 'OPEN' | 'IMPEDED' | 'SEVERED';
  compositeImpactScore: number;
  isPrototype: boolean;
}

export interface ImpactAnalysis {
  locationId: string;
  locationName: string;
  state: NERState;
  district: string;
  timeHorizon: TimeHorizon;
  metrics: ImpactSummaryMetrics;
  affectedSettlements: AffectedSettlement[];
  infrastructureExposure: InfrastructureExposure;
  topRankedLocations: TopAffectedLocationRank[];
  lastCalculated: string;
  dataProvenance: 'PROJECT API' | 'AI PREDICTION' | 'PROTOTYPE DATA';
  backendImpactRadiusM?: number;
  backendAffectedAssets?: {
    id: string;
    name: string;
    assetType: string;
    distanceM: number;
    impactLevel: string;
    priority: number;
    impactStatus: string;
    lat?: number;
    lng?: number;
  }[];
  impactZone?: unknown;
}

export interface RoadRisk {
  roadId: string;
  code: string;
  name: string;
  state: NERState;
  district: string;
  hazardRiskPct: number;
  blockageProbabilityPct: number;
  currentStatus: RoadStatus;
  alternativeAvailable: boolean;
  alternativeRouteName?: string;
  nearestHighRiskSlope: {
    id: string;
    name: string;
    distanceM: number;
    riskScore: number;
  };
  nearbySettlement: string;
  recommendedAction: string;
  affectedSegmentDescription: string;
  coordinates: [number, number][];
  bypassCoordinates?: [number, number][];
  isSimulatedFailure?: boolean;
}

export type RouteHazardExposure = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RouteOption {
  id: string;
  name: string; // e.g. "ROUTE A", "ROUTE B"
  label: string;
  distanceKm: number;
  travelTimeMin: number;
  hazardExposure: RouteHazardExposure;
  roadStatus: RoadStatus;
  isRecommended: boolean;
  explanation: string;
  coordinates: [number, number][];
  hazardIntersections?: [number, number][];
  isLiveRouting: boolean;
}

export interface RouteComparisonData {
  originName: string;
  destinationName: string;
  primaryRoute: RouteOption;
  alternativeRoute: RouteOption;
  activeRouteId: string;
  isRouteFailed: boolean;
  failureReason?: string;
  diffSummary?: {
    distanceDiffKm: number;
    timeDiffMin: number;
    hazardDiff: string;
  };
}

export interface ShelterRecommendation {
  shelterId: string;
  name: string;
  district: string;
  state: NERState;
  distanceKm: number;
  travelTimeMin: number;
  totalCapacity: number;
  availableCapacity: number;
  currentOccupancy: number;
  routeStatus: RoadStatus;
  routeHazardExposure: RouteHazardExposure;
  shelterHazardExposure: 'LOW' | 'MODERATE' | 'HIGH';
  isRecommended: boolean;
  rankingScore: number;
  whyRecommended: string[];
  lat: number;
  lng: number;
  sourceType: 'MAPPED PUBLIC FACILITY' | 'PROJECT DATASET' | 'CURATED PROTOTYPE';
  hasMedicalPost: boolean;
  hasPowerBackup: boolean;
  hasFoodWaterSupply: boolean;
  hasSanitation: boolean;
  officerInCharge: string;
  contactNumber: string;
}

