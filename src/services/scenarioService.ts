import {
  CounterfactualScenarioInput,
  CounterfactualScenarioResult,
  MonitoredLocation,
  RoadRisk,
  RoadSegment,
  RiskLevel,
  RouteOption,
  ShelterFacility,
  ShelterRecommendation
} from '../types';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const scoreToLevel = (score: number): RiskLevel => {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MODERATE';
  return 'LOW';
};

const delta = (baseline: number, scenario: number) => ({
  baseline,
  scenario,
  delta: scenario - baseline
});

/**
 * Transparent counterfactual decision support. It is intentionally isolated
 * from live risk, road, route, and shelter state until a future model API exists.
 */
class ScenarioService {
  runScenario(
    location: MonitoredLocation,
    roads: RoadSegment[],
    shelters: ShelterFacility[],
    input: CounterfactualScenarioInput,
    selectedRoad?: RoadRisk | null,
    selectedRoute?: RouteOption | null,
    selectedShelter?: ShelterRecommendation | null
  ): CounterfactualScenarioResult {
    const memoryAdjustment: Record<CounterfactualScenarioInput['rainfallMemory'], number> = {
      LOW: -3,
      MODERATE: 0,
      HIGH: 4,
      'VERY HIGH': 8
    };
    const drainageAdjustment: Record<CounterfactualScenarioInput['drainageCondition'], number> = {
      NORMAL: 0,
      'PARTIALLY RESTRICTED': 5,
      'BLOCKED / DISRUPTED': 10
    };
    const horizonMultiplier: Record<CounterfactualScenarioInput['forecastWindow'], number> = {
      '+6H': 1,
      '+12H': 1.25,
      '+24H': 1.5
    };

    const rainfallEffect = (input.rainfallChangePct / 10) * 1.2;
    const moistureEffect = input.soilMoistureChangePct * 0.12;
    const roadFailureEffect = input.roadFailure === 'NONE' ? 0 : input.roadFailure === 'CRITICAL CORRIDOR FAILS' ? 8 : 6;
    const scenarioRisk = clamp(
      Math.round(
        location.riskScore +
          (rainfallEffect + moistureEffect + memoryAdjustment[input.rainfallMemory] +
            drainageAdjustment[input.drainageCondition] + roadFailureEffect) *
            horizonMultiplier[input.forecastWindow]
      ),
      0,
      100
    );

    const baselinePopulation = Math.round(location.vulnerablePopulationEst * (location.riskScore / 100) * 0.75);
    const scenarioPopulation = Math.round(location.vulnerablePopulationEst * (scenarioRisk / 100) * 0.75);
    const baselineSettlements = location.riskScore >= 85 ? 3 : location.riskScore >= 70 ? 2 : 1;
    const scenarioSettlements = scenarioRisk >= 85 ? 3 : scenarioRisk >= 70 ? 2 : 1;
    const stateRoads = roads.filter((road) => road.state === location.state);
    const baselineRoads = stateRoads.filter((road) => road.status !== 'PASSABLE').length;
    const selectedRoadMatches = selectedRoad && stateRoads.some((road) => road.id === selectedRoad.roadId);
    const scenarioRoad = selectedRoadMatches
      ? selectedRoad
      : input.roadFailure === 'NONE'
        ? null
        : stateRoads[0] || null;
    const scenarioRoadId = scenarioRoad
      ? 'roadId' in scenarioRoad
        ? scenarioRoad.roadId
        : scenarioRoad.id
      : null;
    const scenarioRoads = clamp(
      baselineRoads + (input.roadFailure !== 'NONE' && scenarioRoad ? 1 : 0),
      0,
      stateRoads.length
    );
    const baselineShelterDemand = Math.round(baselinePopulation * 0.65);
    const scenarioShelterDemand = Math.round(scenarioPopulation * 0.65);
    const selectedShelterCapacity = selectedShelter?.availableCapacity || 0;
    const stateAvailableCapacity = shelters
      .filter((shelter) => shelter.state === location.state)
      .reduce((total, shelter) => total + Math.max(0, shelter.capacity - shelter.currentOccupancy), 0);
    const currentRecommendedCapacity = selectedShelterCapacity || stateAvailableCapacity;
    const projectedRemainingCapacity = Math.max(
      0,
      currentRecommendedCapacity - Math.max(0, scenarioShelterDemand - baselineShelterDemand)
    );

    const affectedRoadSegment = scenarioRoadId
      ? stateRoads.find((road) => road.id === scenarioRoadId) || null
      : null;
    const affectedRoad = selectedRoadMatches ? selectedRoad : null;
    const previousRoadStatus = affectedRoad?.currentStatus ||
      (affectedRoadSegment?.status === 'BLOCKED'
        ? 'BLOCKED'
        : affectedRoadSegment?.status === 'CAUTION'
          ? 'AT RISK'
          : affectedRoadSegment
            ? 'SAFE'
            : null);
    const routeCompromised = Boolean(
      selectedRoute &&
        (input.roadFailure !== 'NONE' ||
          (scenarioRisk >= 85 && selectedRoute.hazardExposure !== 'LOW'))
    );
    const drivers: string[] = [];
    if (input.rainfallChangePct > 0) drivers.push(`+ Increased rainfall (${input.rainfallChangePct}%)`);
    if (input.soilMoistureChangePct > 0) drivers.push(`+ Soil moisture increase (${input.soilMoistureChangePct}%)`);
    if (input.rainfallMemory === 'HIGH' || input.rainfallMemory === 'VERY HIGH') {
      drivers.push(`+ ${input.rainfallMemory.toLowerCase()} antecedent rainfall memory`);
    }
    if (input.drainageCondition !== 'NORMAL') drivers.push(`+ ${input.drainageCondition.toLowerCase()} drainage`);
    if (input.roadFailure !== 'NONE') drivers.push('+ Road failure increases evacuation vulnerability');
    if (drivers.length === 0) drivers.push('No adverse scenario driver applied; baseline conditions retained.');

    return {
      input,
      baselineRisk: location.riskScore,
      baselineRiskLevel: location.riskLevel,
      scenarioRisk,
      scenarioRiskLevel: scoreToLevel(scenarioRisk),
      trend: scenarioRisk > location.riskScore ? 'INCREASING' : scenarioRisk < location.riskScore ? 'DECREASING' : 'STABLE',
      impacts: {
        affectedPopulation: delta(baselinePopulation, scenarioPopulation),
        settlementsAtRisk: delta(baselineSettlements, scenarioSettlements),
        roadsAtRisk: delta(baselineRoads, scenarioRoads),
        shelterDemand: delta(baselineShelterDemand, scenarioShelterDemand)
      },
      responseUrgency: {
        baseline: location.riskLevel,
        scenario: scoreToLevel(scenarioRisk)
      },
      roadConsequence: {
        affectedRoadName: affectedRoad?.name || affectedRoadSegment?.name || null,
        previousStatus: previousRoadStatus,
        scenarioStatus: scenarioRoad
          ? input.roadFailure === 'NONE'
            ? previousRoadStatus
            : 'BLOCKED'
          : null,
        dependentCommunities: affectedRoadSegment?.connectedCommunities || [],
        routeCompromised,
        reroutingRequired: routeCompromised
      },
      shelterConsequence: {
        currentRecommendedCapacity,
        projectedRemainingCapacity,
        additionalShelterRequired: scenarioShelterDemand > currentRecommendedCapacity
      },
      drivers,
      disclaimer: 'Scenario results are decision-support estimates and do not guarantee that a landslide will occur.'
    };
  }
}

export const scenarioService = new ScenarioService();
