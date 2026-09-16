import {
  AffectedSettlement,
  MonitoredLocation,
  NERState,
  RoadRisk,
  RoadStatus,
  RouteHazardExposure,
  RouteOption,
  ShelterRecommendation
} from '../types';
import { INITIAL_MONITORED_LOCATIONS, INITIAL_SHELTERS } from '../data/nerGeography';
import { getBackendShelters } from './backendAdapters';
import { ApiError } from './apiClient';

export interface ShelterRankingContext {
  settlement?: AffectedSettlement | null;
  road?: RoadRisk | null;
  route?: RouteOption | null;
}

type ShelterHazardExposure = ShelterRecommendation['shelterHazardExposure'];
type ShelterFacility = typeof INITIAL_SHELTERS[number];

/**
 * Project-side shelter decision support. This is a transparent prototype score,
 * not an ML model and not official government hazard zoning.
 */
class ShelterService {
  private calculateDistanceKm(
    origin: Pick<MonitoredLocation, 'lat' | 'lng'>,
    destination: Pick<MonitoredLocation, 'lat' | 'lng'>
  ): number {
    const earthRadiusKm = 6371;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = toRadians(destination.lat - origin.lat);
    const longitudeDelta = toRadians(destination.lng - origin.lng);
    const originLatitude = toRadians(origin.lat);
    const destinationLatitude = toRadians(destination.lat);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  private classifyShelterHazard(distanceKm: number): ShelterHazardExposure {
    if (distanceKm <= 2) return 'HIGH';
    if (distanceKm <= 4) return 'MODERATE';
    return 'LOW';
  }

  private getRouteStatusScore(status: RoadStatus): number {
    return {
      SAFE: 100,
      'AT RISK': 55,
      'LIKELY BLOCKED': 15,
      BLOCKED: 0
    }[status];
  }

  private getRouteExposureScore(exposure: RouteHazardExposure): number {
    return {
      LOW: 100,
      MODERATE: 55,
      HIGH: 15,
      CRITICAL: 0
    }[exposure];
  }

  private getFacilityReadinessScore(shelter: ShelterFacility): number {
    const capabilities = [
      shelter.hasMedicalPost,
      shelter.hasPowerBackup,
      shelter.hasFoodWaterSupply,
      shelter.hasSanitation
    ];
    return (capabilities.filter(Boolean).length / capabilities.length) * 100;
  }

  private getContextualAccess(
    shelterHazardExposure: ShelterHazardExposure,
    context?: ShelterRankingContext
  ): { routeStatus: RoadStatus; routeHazardExposure: RouteHazardExposure; isContextual: boolean } {
    if (context?.route) {
      return {
        routeStatus: context.route.roadStatus,
        routeHazardExposure: context.route.hazardExposure,
        isContextual: true
      };
    }

    if (context?.road) {
      const routeHazardExposure: RouteHazardExposure =
        context.road.currentStatus === 'BLOCKED'
          ? 'CRITICAL'
          : context.road.currentStatus === 'AT RISK' || context.road.currentStatus === 'LIKELY BLOCKED'
            ? 'HIGH'
            : shelterHazardExposure === 'HIGH'
              ? 'HIGH'
              : shelterHazardExposure === 'MODERATE'
                ? 'MODERATE'
                : 'LOW';

      return {
        routeStatus: context.road.currentStatus,
        routeHazardExposure,
        isContextual: true
      };
    }

    // This is a project-side estimate, not a shelter-specific ORS route.
    return {
      routeStatus:
        shelterHazardExposure === 'HIGH'
          ? 'LIKELY BLOCKED'
          : shelterHazardExposure === 'MODERATE'
            ? 'AT RISK'
            : 'SAFE',
      routeHazardExposure:
        shelterHazardExposure === 'HIGH'
          ? 'HIGH'
          : shelterHazardExposure === 'MODERATE'
            ? 'MODERATE'
            : 'LOW',
      isContextual: false
    };
  }

  private buildReasons(
    routeStatus: RoadStatus,
    routeHazardExposure: RouteHazardExposure,
    shelterHazardExposure: ShelterHazardExposure,
    availableCapacity: number,
    distanceKm: number,
    shelter: ShelterFacility,
    isContextualAccess: boolean
  ): string[] {
    const reasons: string[] = [];

    if (routeStatus === 'SAFE' && routeHazardExposure === 'LOW') {
      reasons.push(isContextualAccess ? '✓ Safe contextual access route' : '✓ Safe project-side access estimate');
    } else if (routeStatus === 'AT RISK' || routeHazardExposure === 'MODERATE') {
      reasons.push('⚠ Access route currently at risk or requires clearance verification');
    } else {
      reasons.push(`⚠ Access context indicates ${routeStatus.toLowerCase()} conditions`);
    }

    if (shelterHazardExposure === 'LOW') {
      reasons.push(`✓ Outside the active high-risk landslide buffer (${distanceKm.toFixed(1)} km from hazard)`);
    } else if (shelterHazardExposure === 'MODERATE') {
      reasons.push('⚠ Shelter lies within the project moderate hazard buffer');
    } else {
      reasons.push('⚠ Shelter lies close to the active hazard zone');
    }

    if (availableCapacity <= 0) {
      reasons.push('⚠ No available capacity');
    } else if (availableCapacity < shelter.capacity * 0.15) {
      reasons.push(`⚠ Only ${availableCapacity} spaces available`);
    } else {
      reasons.push(`✓ ${availableCapacity} spaces available`);
    }

    if (shelter.hasMedicalPost) reasons.push('✓ Medical post available');
    if (shelter.hasPowerBackup) reasons.push('✓ Power backup available');
    if (shelter.hasFoodWaterSupply) reasons.push('✓ Food and water supply available');
    if (shelter.hasSanitation) reasons.push('✓ Sanitation available');

    return reasons;
  }

  /**
   * Project multi-criteria ranking: access safety 40%, shelter hazard 25%,
   * capacity 20%, travel distance/time 10%, and facility readiness 5%.
   */
  async getShelterRecommendations(
    locationId: string,
    state?: NERState,
    context?: ShelterRankingContext
  ): Promise<ShelterRecommendation[]> {
    const activeLocation =
      INITIAL_MONITORED_LOCATIONS.find((location) => location.id === locationId) ||
      INITIAL_MONITORED_LOCATIONS[0];
    const activeState = state || activeLocation.state;
    const origin = context?.settlement || activeLocation;
    let availableShelters = INITIAL_SHELTERS;
    try {
      const backendShelters = await getBackendShelters();
      if (backendShelters.length > 0) {
        availableShelters = backendShelters.map((shelter) => ({
          id: String(shelter.id ?? shelter.name ?? 'SHELTER'),
          name: shelter.name || 'Unnamed shelter',
          state: (shelter.state || activeState) as NERState,
          district: shelter.district || activeLocation.district,
          lat: Number(shelter.latitude ?? activeLocation.lat),
          lng: Number(shelter.longitude ?? activeLocation.lng),
          capacity: Number(shelter.capacity ?? 0),
          currentOccupancy: 0,
          status: String(shelter.status || '').toUpperCase() === 'FULL' ? 'FULL' : String(shelter.status || '').toUpperCase() === 'NEAR_CAPACITY' ? 'NEAR_CAPACITY' : 'AVAILABLE',
          hasMedicalPost: false,
          hasPowerBackup: false,
          hasFoodWaterSupply: false,
          hasSanitation: false,
          officerInCharge: 'Backend record',
          contactNumber: 'Not available'
        }));
      }
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
    const stateShelters = availableShelters.filter((shelter) => shelter.state === activeState);
    const sheltersToRank = stateShelters.length > 0 ? stateShelters : availableShelters;

    const scored = sheltersToRank.map((shelter) => {
      const distanceKm = this.calculateDistanceKm(origin, shelter);
      const travelTimeMin = Math.max(1, Math.round(distanceKm * 2.1));
      const availableCapacity = Math.max(0, shelter.capacity - shelter.currentOccupancy);
      const capacityRatio = shelter.capacity > 0 ? availableCapacity / shelter.capacity : 0;
      const shelterHazardExposure = this.classifyShelterHazard(
        this.calculateDistanceKm(activeLocation, shelter)
      );
      const access = this.getContextualAccess(shelterHazardExposure, context);
      const accessScore = Math.min(
        this.getRouteStatusScore(access.routeStatus),
        this.getRouteExposureScore(access.routeHazardExposure)
      );
      const hazardScore = { LOW: 100, MODERATE: 55, HIGH: 0 }[shelterHazardExposure];
      const distanceScore = Math.max(0, 100 - distanceKm * 7);
      const timeScore = Math.max(0, 100 - travelTimeMin * 4);
      const accessibilityScore = (distanceScore + timeScore) / 2;
      const readinessScore = this.getFacilityReadinessScore(shelter);

      // Safety dominates capacity, accessibility, and distance in this prototype score.
      const rankingScore = Math.round(
        (accessScore * 0.4 +
          hazardScore * 0.25 +
          capacityRatio * 100 * 0.2 +
          accessibilityScore * 0.1 +
          readinessScore * 0.05) * 10
      ) / 10;
      const hasHardSafetyFailure =
        availableCapacity <= 0 ||
        shelterHazardExposure === 'HIGH' ||
        access.routeStatus === 'BLOCKED' ||
        access.routeHazardExposure === 'CRITICAL';

      return {
        shelterId: shelter.id,
        name: shelter.name,
        district: shelter.district,
        state: shelter.state,
        distanceKm: Math.round(distanceKm * 10) / 10,
        travelTimeMin,
        totalCapacity: shelter.capacity,
        currentOccupancy: shelter.currentOccupancy,
        availableCapacity,
        routeStatus: access.routeStatus,
        routeHazardExposure: access.routeHazardExposure,
        shelterHazardExposure,
        isRecommended: false,
        rankingScore,
        whyRecommended: this.buildReasons(
          access.routeStatus,
          access.routeHazardExposure,
          shelterHazardExposure,
          availableCapacity,
          distanceKm,
          shelter,
          access.isContextual
        ),
        lat: shelter.lat,
        lng: shelter.lng,
        sourceType: availableShelters === INITIAL_SHELTERS ? 'PROJECT DATASET' as const : 'MAPPED PUBLIC FACILITY' as const,
        hasMedicalPost: shelter.hasMedicalPost,
        hasPowerBackup: shelter.hasPowerBackup,
        hasFoodWaterSupply: shelter.hasFoodWaterSupply,
        hasSanitation: shelter.hasSanitation,
        officerInCharge: shelter.officerInCharge,
        contactNumber: shelter.contactNumber,
        hasHardSafetyFailure
      };
    });

    scored.sort((first, second) => second.rankingScore - first.rankingScore);
    const recommended = scored.find((shelter) => !shelter.hasHardSafetyFailure);

    if (recommended) {
      recommended.isRecommended = true;
    } else {
      const noSafeShelterReason = 'No currently evaluated shelter meets minimum safe-access and capacity criteria.';
      scored.forEach((shelter) => {
        shelter.whyRecommended = [...shelter.whyRecommended, `⚠ ${noSafeShelterReason}`];
      });
    }

    return scored.map(({ hasHardSafetyFailure: _hasHardSafetyFailure, ...shelter }) => shelter);
  }
}

export const shelterService = new ShelterService();
