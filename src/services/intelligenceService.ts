import {
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  EmergencyBulletin
} from '../types';
import {
  INITIAL_MONITORED_LOCATIONS,
  INITIAL_ROAD_SEGMENTS,
  INITIAL_SHELTERS,
  INITIAL_FIELD_REPORTS,
  INITIAL_BULLETINS
} from '../data/nerGeography';
import { apiClient, ApiError } from './apiClient';
import {
  BackendAlert,
  BackendLocation,
  BackendRoad,
  BackendShelter,
  getBackendAlerts,
  getBackendEnvironment,
  getBackendLocations,
  getBackendRisk,
  getBackendRoads,
  getBackendShelters,
  getBackendTerrain
} from './backendAdapters';
import {
  normalizeRiskLevel,
  normalizeSoilMoisturePct,
  normalizeProbabilityPct
} from '../utils/dataNormalization';

interface BackendReport {
  id: number;
  latitude: number;
  longitude: number;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
}

/**
 * Typed frontend intelligence service abstraction.
 * Provides clean asynchronous interface simulating future FastAPI / PostGIS endpoints.
 * Operates on strongly-typed memory state with zero backend dependencies.
 */
class IntelligenceService {
  private locations: MonitoredLocation[] = [...INITIAL_MONITORED_LOCATIONS];
  private roads: RoadSegment[] = [...INITIAL_ROAD_SEGMENTS];
  private shelters: ShelterFacility[] = [...INITIAL_SHELTERS];
  private reports: FieldReport[] = [...INITIAL_FIELD_REPORTS];
  private bulletins: EmergencyBulletin[] = [...INITIAL_BULLETINS];

  private finite(value: unknown, fallback: number): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private mapBackendLocation(item: BackendLocation): MonitoredLocation {
    return {
      id: String(item.id),
      name: item.name,
      district: item.district,
      state: item.state as NERState,
      lat: item.latitude,
      lng: item.longitude,
      slopeAngleDeg: 0,
      elevationM: 0,
      soilMoisturePct: 0,
      soilMoistureTrend: 'STABLE',
      rainfallCurrentMm: 0,
      rainfall24hMm: 0,
      rainfall72hMm: 0,
      rainfallDecayMemoryMm: 0,
      riskScore: 0,
      riskLevel: 'LOW',
      riskTrend: 'STABLE',
      confidenceScore: 0,
      thresholdValue: 0,
      drainageDisrupted: false,
      cascadingHazard: null,
      keyContributingFactors: [],
      nearbyInfrastructure: [],
      vulnerablePopulationEst: 0,
      lastUpdated: 'PROJECT API',
      dataProvenance: 'AI PREDICTION',
      telemetryAvailable: false,
      environmentalDataAvailable: false,
      terrainDataAvailable: false,
      riskDataAvailable: false
    };
  }

  private isPredictionLocation(item: BackendLocation): boolean {
    const searchableName = item.name.toLowerCase();
    return !searchableName.includes('shelter') && !searchableName.includes('evacuation');
  }

  private findPrototypeMatch(item: BackendLocation): MonitoredLocation | undefined {
    const coordinateTolerance = 0.02;
    return INITIAL_MONITORED_LOCATIONS.find((location) =>
      location.state === item.state &&
      location.district === item.district &&
      Math.abs(location.lat - item.latitude) <= coordinateTolerance &&
      Math.abs(location.lng - item.longitude) <= coordinateTolerance
    );
  }

  private mapBackendReport(item: BackendReport): FieldReport {
    const nearest = INITIAL_MONITORED_LOCATIONS.reduce((current, location) => {
      const currentDistance = Math.hypot(current.lat - item.latitude, current.lng - item.longitude);
      const nextDistance = Math.hypot(location.lat - item.latitude, location.lng - item.longitude);
      return nextDistance < currentDistance ? location : current;
    }, INITIAL_MONITORED_LOCATIONS[0]);
    const normalizedType = item.report_type.toUpperCase();
    const category = normalizedType.includes('ROCK')
      ? 'ROCKFALL'
      : normalizedType.includes('CULVERT')
        ? 'BLOCKED_CULVERT'
        : normalizedType.includes('SEEP') || normalizedType.includes('WATER')
          ? 'WATER_SEEPAGE'
          : normalizedType.includes('COLLAPSE') || normalizedType.includes('ROAD')
            ? 'ROAD_COLLAPSE'
            : 'SLOPE_CRACK';

    return {
      id: String(item.id),
      timestamp: item.created_at,
      lat: item.latitude,
      lng: item.longitude,
      locationName: nearest.name,
      state: nearest.state,
      district: nearest.district,
      category,
      severity: item.status.toUpperCase() === 'CRITICAL' ? 'CRITICAL' : 'MODERATE',
      reporterType: 'FIELD_SURVEYOR',
      description: item.description,
      verifiedByAuthority: ['VERIFIED', 'APPROVED'].includes(item.status.toUpperCase())
    } as FieldReport;
  }

  // Locations Query
  async getLocations(state?: NERState, district?: string): Promise<MonitoredLocation[]> {
    try {
      const backendLocations = (await getBackendLocations()).filter((location) => this.isPredictionLocation(location));
      const backendOverlays = await Promise.all(backendLocations.map(async (location) => {
        const prototypeMatch = this.findPrototypeMatch(location);
        const mapped = this.mapBackendLocation(location);
        const baseLocation = prototypeMatch
          ? { ...prototypeMatch, id: String(location.id), name: location.name, lat: location.latitude, lng: location.longitude }
          : mapped;
        try {
          const [environment, terrain, risk] = await Promise.all([
            getBackendEnvironment(String(location.id)),
            getBackendTerrain(String(location.id)),
            getBackendRisk(String(location.id))
          ]);
          const env = environment.data?.[0] || {};
          const terr = terrain.data?.[0] || {};
          const backendRisk = risk.risk || {};
          const environmentalDataAvailable = environment.data?.length > 0;
          const terrainDataAvailable = terrain.data?.length > 0;
          const riskDataAvailable = Boolean(risk.risk);
          const riskScore = this.finite(
            backendRisk.risk_score,
            normalizeProbabilityPct(backendRisk.risk_probability, baseLocation.riskScore)
          );
          const riskLevel = normalizeRiskLevel(backendRisk.risk_level, baseLocation.riskLevel);
          return {
            ...mapped,
            ...baseLocation,
            rainfallCurrentMm: this.finite(env.rain_1h, baseLocation.rainfallCurrentMm),
            rainfall24hMm: this.finite(env.rain_24h, baseLocation.rainfall24hMm),
            rainfall72hMm: this.finite(env.rain_3d, baseLocation.rainfall72hMm),
            rainfallDecayMemoryMm: this.finite(env.antecedent_rainfall_index, baseLocation.rainfallDecayMemoryMm),
            soilMoisturePct: normalizeSoilMoisturePct(env.soil_moisture, baseLocation.soilMoisturePct),
            elevationM: this.finite(terr.elevation, baseLocation.elevationM),
            slopeAngleDeg: this.finite(terr.slope, baseLocation.slopeAngleDeg),
            riskScore,
            riskProbability: backendRisk.risk_probability == null
              ? riskScore / 100
              : this.finite(backendRisk.risk_probability, riskScore / 100),
            riskLevel,
            riskConfidence: backendRisk.confidence ?? null,
            modelVersion: backendRisk.model_version || undefined,
            predictionWindow: backendRisk.prediction_window || undefined,
            riskTimestamp: backendRisk.timestamp || undefined,
            dataProvenance: 'AI PREDICTION' as const,
            telemetryAvailable: environmentalDataAvailable || terrainDataAvailable || riskDataAvailable,
            environmentalDataAvailable,
            terrainDataAvailable,
            riskDataAvailable
          };
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
          return {
            ...baseLocation,
            dataProvenance: 'PROTOTYPE DATA' as const,
            telemetryAvailable: Boolean(prototypeMatch),
            environmentalDataAvailable: Boolean(prototypeMatch),
            terrainDataAvailable: Boolean(prototypeMatch),
            riskDataAvailable: Boolean(prototypeMatch)
          };
        }
      }));
      const mergedLocations = [
        ...INITIAL_MONITORED_LOCATIONS.map((location) => ({
          ...location,
          dataProvenance: 'PROTOTYPE DATA' as const,
          telemetryAvailable: true,
          environmentalDataAvailable: true,
          terrainDataAvailable: true,
          riskDataAvailable: true
        })).filter((location) => !backendOverlays.some((backendLocation) =>
          backendLocation.state === location.state &&
          backendLocation.district === location.district &&
          Math.abs(backendLocation.lat - location.lat) <= 0.02 &&
          Math.abs(backendLocation.lng - location.lng) <= 0.02
        )),
        ...backendOverlays
      ];
      return mergedLocations.filter((location) =>
        (!state || location.state === state) &&
        (!district || district === 'ALL' || location.district.toLowerCase() === district.toLowerCase())
      );
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      let filtered = this.locations.map((location) => ({
        ...location,
        dataProvenance: 'PROTOTYPE DATA' as const,
        telemetryAvailable: true,
        environmentalDataAvailable: true,
        terrainDataAvailable: true,
        riskDataAvailable: true
      }));
      if (state) filtered = filtered.filter((location) => location.state === state);
      if (district && district !== 'ALL') filtered = filtered.filter((location) => location.district.toLowerCase() === district.toLowerCase());
      return filtered;
    }
  }

  async getLocationById(id: string): Promise<MonitoredLocation | undefined> {
    try {
      return this.mapBackendLocation(await apiClient.get<BackendLocation>(`/v1/locations/${id}`));
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return this.locations.find((l) => l.id === id);
    }
  }

  // Roads Query
  async getRoads(state?: NERState): Promise<RoadSegment[]> {
    try {
      const backendRoads = await getBackendRoads();
      const roads = backendRoads.map((road: BackendRoad) => {
        const status = String(road.status || '').toUpperCase();
        return {
          id: String(road.id ?? road.code ?? road.name ?? 'ROAD'),
          code: road.code || String(road.road_type || 'ROAD'),
          name: road.name || 'Unnamed road',
          state: (road.state || 'Meghalaya') as NERState,
          district: road.district || 'Unknown district',
          coordinates: road.coordinates || (road.latitude !== undefined && road.longitude !== undefined ? [[road.latitude, road.longitude]] : []),
          status: status === 'BLOCKED' ? 'BLOCKED' : status === 'AT_RISK' || status === 'AT RISK' ? 'CAUTION' : 'PASSABLE',
          blockageProbabilityPct: status === 'BLOCKED' ? 100 : status === 'AT_RISK' || status === 'AT RISK' ? 70 : 0,
          bypassAvailable: false,
          connectedCommunities: [],
          criticalForEmergency: status === 'BLOCKED' || status === 'AT_RISK' || status === 'AT RISK'
        } as RoadSegment;
      });
      return state ? roads.filter((road) => road.state === state) : roads;
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return new Promise((resolve) => {
      let filtered = [...this.roads];
      if (state) {
        filtered = filtered.filter((r) => r.state === state);
      }
      resolve(filtered);
      });
    }
  }

  // Shelters Query
  async getShelters(state?: NERState, district?: string): Promise<ShelterFacility[]> {
    try {
      const backendShelters = await getBackendShelters();
      const mapped = backendShelters.map((shelter: BackendShelter) => ({
        id: String(shelter.id ?? shelter.name ?? 'SHELTER'),
        name: shelter.name || 'Unnamed shelter',
        state: (shelter.state || 'Meghalaya') as NERState,
        district: shelter.district || 'Unknown district',
        lat: this.finite(shelter.latitude, 0),
        lng: this.finite(shelter.longitude, 0),
        capacity: this.finite(shelter.capacity, 0),
        currentOccupancy: 0,
        status: String(shelter.status || '').toUpperCase() === 'FULL' ? 'FULL' : String(shelter.status || '').toUpperCase() === 'NEAR_CAPACITY' ? 'NEAR_CAPACITY' : 'AVAILABLE',
        hasMedicalPost: false,
        hasPowerBackup: false,
        hasFoodWaterSupply: false,
        hasSanitation: false,
        officerInCharge: 'Backend record',
        contactNumber: 'Not available'
      } as ShelterFacility));
      return mapped.filter((shelter) => (!state || shelter.state === state) && (!district || district === 'ALL' || shelter.district.toLowerCase() === district.toLowerCase()));
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return new Promise((resolve) => {
      let filtered = [...this.shelters];
      if (state) {
        filtered = filtered.filter((s) => s.state === state);
      }
      if (district && district !== 'ALL') {
        filtered = filtered.filter((s) => s.district.toLowerCase() === district.toLowerCase());
      }
      resolve(filtered);
      });
    }
  }

  // Field Reports Query
  async getFieldReports(state?: NERState): Promise<FieldReport[]> {
    try {
      const backendReports = await apiClient.get<BackendReport[]>('/v1/reports/');
      const reports = backendReports.map((report) => this.mapBackendReport(report));
      return state ? reports.filter((report) => report.state === state) : reports;
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return new Promise((resolve) => {
      let filtered = [...this.reports];
      if (state) {
        filtered = filtered.filter((r) => r.state === state);
      }
      resolve(filtered);
      });
    }
  }

  // Submit Field Report
  async addFieldReport(newReport: Omit<FieldReport, 'id' | 'timestamp' | 'verifiedByAuthority'>): Promise<FieldReport> {
    return new Promise((resolve) => {
      const created: FieldReport = {
        ...newReport,
        id: `REP-${String(this.reports.length + 1).padStart(2, '0')}`,
        timestamp: 'Just now',
        verifiedByAuthority: false
      };
      this.reports = [created, ...this.reports];
      resolve(created);
    });
  }

  // Bulletins Query
  async getBulletins(state?: NERState): Promise<EmergencyBulletin[]> {
    try {
      const alerts = await getBackendAlerts();
      return alerts.map((alert: BackendAlert) => ({
        id: String(alert.id ?? alert.title ?? 'ALERT'),
        title: alert.title || 'Backend alert',
        severity: normalizeRiskLevel(alert.severity, 'MODERATE'),
        targetState: 'Meghalaya',
        targetDistricts: [],
        issuedAt: alert.created_at || 'Not available',
        validUntil: 'Not available',
        summary: alert.message || 'Not available',
        instructions: [`Target: ${alert.target_type || 'Not available'}`, `Status: ${alert.status || 'Not available'}`],
        issuedBy: 'PROJECT API'
      }));
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return new Promise((resolve) => {
      let filtered = [...this.bulletins];
      if (state) {
        filtered = filtered.filter((b) => b.targetState === state);
      }
      resolve(filtered);
      });
    }
  }

  // What-If Simulation
  async runWhatIfSimulation(
    locationId: string,
    params: { additionalRainfallMm: number; simulateBlockedRoadId?: string }
  ): Promise<{
    simulatedScore: number;
    simulatedLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    affectedPopulationDelta: number;
    cascadingNotes: string;
    routeSevered: boolean;
  }> {
    const loc = this.locations.find((l) => l.id === locationId);
    if (!loc) {
      throw new Error(`Location ${locationId} not found`);
    }

    // Mathematical simulation based on rainfall memory & slope sensitivity
    const rainfallEffect = params.additionalRainfallMm * 0.45;
    const baseScore = loc.riskScore;
    const simulatedScore = Math.min(100, Math.round(baseScore + rainfallEffect));

    let simulatedLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (simulatedScore >= 85) simulatedLevel = 'CRITICAL';
    else if (simulatedScore >= 70) simulatedLevel = 'HIGH';
    else if (simulatedScore >= 50) simulatedLevel = 'MODERATE';

    const popDelta = Math.round(loc.vulnerablePopulationEst * (simulatedScore / 100) * 0.35);

    return {
      simulatedScore,
      simulatedLevel,
      affectedPopulationDelta: popDelta,
      cascadingNotes:
        params.additionalRainfallMm > 30
          ? `High probability of secondary debris slumping onto drainage culverts. Soil saturation projected at ${Math.min(99, loc.soilMoisturePct + 12)}%.`
          : 'Moderate saturation increase; localized rockfalls probable along unlined cuttings.',
      routeSevered: params.simulateBlockedRoadId ? true : simulatedScore >= 80
    };
  }
}

export const intelligenceService = new IntelligenceService();
