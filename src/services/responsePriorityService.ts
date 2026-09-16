import {
  FieldReport,
  MonitoredLocation,
  RoadSegment,
  RiskLevel,
  ShelterFacility
} from '../types';

export type ResponsePriorityLevel = 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface ResponsePriorityItem {
  location: MonitoredLocation;
  score: number;
  priority: ResponsePriorityLevel;
  affectedPopulation: number;
  settlementExposure: string;
  roadAccessibility: string;
  routeSafety: string;
  shelterAvailability: string;
  verifiedEvidence: number;
  explanation: string[];
}

const roadStatusScore: Record<RoadSegment['status'], number> = {
  PASSABLE: 100,
  CAUTION: 55,
  BLOCKED: 0
};

const scoreToPriority = (score: number): ResponsePriorityLevel => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'ELEVATED';
  return 'ROUTINE';
};

const riskToScore = (risk: RiskLevel) => ({ LOW: 20, MODERATE: 45, HIGH: 75, CRITICAL: 100 }[risk]);

/** Transparent prototype decision support; replaceable by the backend prioritization API. */
class ResponsePriorityService {
  rank(
    locations: MonitoredLocation[],
    roads: RoadSegment[],
    shelters: ShelterFacility[],
    fieldReports: FieldReport[],
    selectedState: string,
    selectedDistrict: string
  ): ResponsePriorityItem[] {
    return locations
      .filter((location) => selectedState === 'ALL' || location.state === selectedState)
      .filter((location) => selectedDistrict === 'ALL' || location.district.toLowerCase() === selectedDistrict.toLowerCase())
      .map((location) => {
        const locationRoads = roads.filter((road) => road.state === location.state && road.district === location.district);
        const worstRoadScore = locationRoads.length > 0
          ? Math.min(...locationRoads.map((road) => roadStatusScore[road.status]))
          : 70;
        const availableShelterCapacity = shelters
          .filter((shelter) => shelter.state === location.state && shelter.district === location.district)
          .reduce((total, shelter) => total + Math.max(0, shelter.capacity - shelter.currentOccupancy), 0);
        const verifiedEvidence = fieldReports.filter(
          (report) => report.state === location.state && report.district === location.district && report.verifiedByAuthority
        ).length;
        const settlementExposure = location.riskScore >= 85 ? 'CRITICAL EXPOSURE' : location.riskScore >= 70 ? 'HIGH EXPOSURE' : 'MONITORED';
        const shelterScore = availableShelterCapacity > 300 ? 20 : availableShelterCapacity > 0 ? 55 : 0;
        const evidenceScore = Math.min(100, verifiedEvidence * 25);
        const score = Math.round(
          riskToScore(location.riskLevel) * 0.4 +
            Math.min(100, location.vulnerablePopulationEst / 40) * 0.2 +
            worstRoadScore * 0.2 +
            (100 - shelterScore) * 0.1 +
            evidenceScore * 0.1
        );
        const priority = scoreToPriority(score);

        return {
          location,
          score,
          priority,
          affectedPopulation: location.vulnerablePopulationEst,
          settlementExposure,
          roadAccessibility: locationRoads.some((road) => road.status === 'BLOCKED') ? 'BLOCKED' : locationRoads.some((road) => road.status === 'CAUTION') ? 'CAUTION' : 'PASSABLE',
          routeSafety: worstRoadScore >= 80 ? 'SAFE CONTEXT' : worstRoadScore > 0 ? 'AT RISK CONTEXT' : 'UNSAFE CONTEXT',
          shelterAvailability: availableShelterCapacity > 0 ? `${availableShelterCapacity} spaces available` : 'NO CAPACITY AVAILABLE',
          verifiedEvidence,
          explanation: [
            `${location.riskLevel} monitored risk at ${location.riskScore}%`,
            `${location.vulnerablePopulationEst.toLocaleString('en-IN')} people in the vulnerable population estimate`,
            locationRoads.length > 0 ? `${locationRoads.length} road corridor(s) assessed in this sector` : 'No matching road record in current project data',
            `${verifiedEvidence} verified field evidence item(s)`
          ]
        };
      })
      .sort((first, second) => second.score - first.score);
  }
}

export const responsePriorityService = new ResponsePriorityService();
