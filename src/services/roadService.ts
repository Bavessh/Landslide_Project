import { NERState, RoadRisk, RoadStatus } from '../types';
import { INITIAL_ROAD_SEGMENTS, INITIAL_MONITORED_LOCATIONS } from '../data/nerGeography';
import { getBackendRoads } from './backendAdapters';
import { ApiError } from './apiClient';

/**
 * Road Risk Intelligence Service.
 * Manages road connectivity analysis, blockage prediction, and hazard corridor intersections.
 * Keep real road geometry and AI status conceptually separate.
 */
class RoadService {
  private roadRisks: RoadRisk[] = [
    {
      roadId: 'ROAD-01',
      code: 'NH-29',
      name: 'Kohima–Dimapur Arterial Corridor',
      state: 'Nagaland',
      district: 'Kohima',
      hazardRiskPct: 94,
      blockageProbabilityPct: 88,
      currentStatus: 'LIKELY BLOCKED',
      alternativeAvailable: true,
      alternativeRouteName: 'Peducha–Tsiesema 10-Ton Bypass Road',
      nearestHighRiskSlope: {
        id: 'LOC-NL-01',
        name: 'Dzüdza River S-Bend Slopes (NH-29)',
        distanceM: 85,
        riskScore: 92
      },
      nearbySettlement: 'Sechü Zubza Town',
      recommendedAction: 'Halt non-essential freight. Divert light evacuation traffic via Peducha–Tsiesema bypass.',
      affectedSegmentDescription: 'Km 42+150 to Km 44+300 along Dzüdza River Gorge. Active tension fissures on upper regolith.',
      coordinates: [
        [25.8600, 93.8200],
        [25.7800, 93.9200],
        [25.7022, 94.0418],
        [25.6751, 94.1086]
      ],
      bypassCoordinates: [
        [25.8600, 93.8200],
        [25.8200, 93.9500],
        [25.7510, 94.0890],
        [25.6751, 94.1086]
      ],
      isSimulatedFailure: false
    },
    {
      roadId: 'ROAD-02',
      code: 'NH-106',
      name: 'Shillong–Mawkdok–Sohra Highway',
      state: 'Meghalaya',
      district: 'East Khasi Hills',
      hazardRiskPct: 81,
      blockageProbabilityPct: 68,
      currentStatus: 'AT RISK',
      alternativeAvailable: true,
      alternativeRouteName: 'Laitmawsiang Rural PWD Link',
      nearestHighRiskSlope: {
        id: 'LOC-MG-02',
        name: 'Mawkdok Gorge Valley Flank',
        distanceM: 140,
        riskScore: 85
      },
      nearbySettlement: 'Mawkdok Village',
      recommendedAction: 'Station heavy earthmovers at Mawkdok tri-junction; maintain single-lane controlled convoy.',
      affectedSegmentDescription: 'Km 28+400 hairpin bend overlooking Mawkdok gorge. Scree sliding onto western carriage.',
      coordinates: [
        [25.5788, 91.8933],
        [25.4950, 91.8450],
        [25.4382, 91.8021],
        [25.2800, 91.7300]
      ],
      bypassCoordinates: [
        [25.5788, 91.8933],
        [25.5100, 91.8100],
        [25.4120, 91.7760],
        [25.2800, 91.7300]
      ],
      isSimulatedFailure: false
    },
    {
      roadId: 'ROAD-03',
      code: 'NH-27',
      name: 'Haflong–Jatinga Hill Pass',
      state: 'Assam',
      district: 'Dima Hasao',
      hazardRiskPct: 91,
      blockageProbabilityPct: 84,
      currentStatus: 'BLOCKED',
      alternativeAvailable: true,
      alternativeRouteName: 'Lumding–Haflong Hill Cut Secondary PWD Link',
      nearestHighRiskSlope: {
        id: 'LOC-AS-03',
        name: 'Haflong–Jatinga Hill Section',
        distanceM: 60,
        riskScore: 89
      },
      nearbySettlement: 'Jatinga Settlement',
      recommendedAction: 'Emergency road closure in force. BRO and SDRF clearance teams operating.',
      affectedSegmentDescription: 'Km 18 to Km 22. Mudflow and shale slippage completely blocking both dual-carriageway lanes.',
      coordinates: [
        [25.1950, 93.0150],
        [25.1215, 93.0310],
        [25.0450, 92.9800]
      ],
      bypassCoordinates: [
        [25.2200, 93.0500],
        [25.1400, 93.0900],
        [25.0450, 92.9800]
      ],
      isSimulatedFailure: false
    },
    {
      roadId: 'ROAD-04',
      code: 'NH-10',
      name: 'Sevoke–Gangtok Teesta Lifeline',
      state: 'Sikkim',
      district: 'Gangtok',
      hazardRiskPct: 88,
      blockageProbabilityPct: 76,
      currentStatus: 'AT RISK',
      alternativeAvailable: true,
      alternativeRouteName: 'Lava–Algarah–Reshi Border Route',
      nearestHighRiskSlope: {
        id: 'LOC-SK-04',
        name: 'Dikchu–Singtam Teesta Valley Basin',
        distanceM: 110,
        riskScore: 84
      },
      nearbySettlement: 'Singtam Bazaar',
      recommendedAction: 'Night travel prohibited between 19:00 and 06:00. Police checkposts monitoring at Rangpo.',
      affectedSegmentDescription: 'Km 34 29th Mile sector. Active rock falling and river erosion undermining retaining wall.',
      coordinates: [
        [27.1700, 88.5200],
        [27.2400, 88.5000],
        [27.3300, 88.6100]
      ],
      bypassCoordinates: [
        [27.1700, 88.5200],
        [27.1900, 88.6500],
        [27.3300, 88.6100]
      ],
      isSimulatedFailure: false
    },
    {
      roadId: 'ROAD-05',
      code: 'NH-37',
      name: 'Imphal–Jiribam Highway (Irang Corridor)',
      state: 'Manipur',
      district: 'Tamenglong',
      hazardRiskPct: 79,
      blockageProbabilityPct: 72,
      currentStatus: 'AT RISK',
      alternativeAvailable: true,
      alternativeRouteName: 'Old Cachar Road (Light 4x4 only)',
      nearestHighRiskSlope: {
        id: 'LOC-MN-07',
        name: 'Irang River Valley Ridge (NH-37)',
        distanceM: 95,
        riskScore: 78
      },
      nearbySettlement: 'Khongsang Sub-Division',
      recommendedAction: 'Heavy multi-axle trucks restricted. Emergency convoy escort in effect.',
      affectedSegmentDescription: 'Km 68 bridge approach embankment. Debris wash over pavement.',
      coordinates: [
        [24.8100, 93.5500],
        [24.8400, 93.6300],
        [24.8200, 93.8800]
      ],
      bypassCoordinates: [
        [24.8100, 93.5500],
        [24.7500, 93.6900],
        [24.8200, 93.8800]
      ],
      isSimulatedFailure: false
    },
    {
      roadId: 'ROAD-06',
      code: 'NH-415',
      name: 'Itanagar–Naharlagun Capital Arterial',
      state: 'Arunachal Pradesh',
      district: 'Papum Pare',
      hazardRiskPct: 42,
      blockageProbabilityPct: 22,
      currentStatus: 'SAFE',
      alternativeAvailable: true,
      alternativeRouteName: 'Jullang Rural Bypass',
      nearestHighRiskSlope: {
        id: 'LOC-AR-05',
        name: 'Papum Pare Foothill Pass',
        distanceM: 450,
        riskScore: 74
      },
      nearbySettlement: 'Naharlagun Township',
      recommendedAction: 'Routine patrolling; drainage culverts clear.',
      affectedSegmentDescription: 'Hillside cut sections stable; gabion wire mesh walls intact.',
      coordinates: [
        [27.0844, 93.6053],
        [27.1000, 93.6500],
        [27.1060, 93.6900]
      ],
      isSimulatedFailure: false
    }
  ];

  /**
   * Fetch road risks filtered by state or district
   */
  async getRoadRisks(state?: NERState, district?: string): Promise<RoadRisk[]> {
    try {
      const backendRoads = await getBackendRoads();
      const mapped = backendRoads.map((road) => {
        const status = String(road.status || '').toUpperCase();
        const coordinates = road.coordinates || (road.latitude !== undefined && road.longitude !== undefined ? [[road.latitude, road.longitude] as [number, number]] : []);
        return {
          roadId: String(road.id ?? road.code ?? road.name ?? 'ROAD'),
          code: road.code || String(road.road_type || 'ROAD'),
          name: road.name || 'Unnamed road',
          state: (road.state || 'Meghalaya') as NERState,
          district: road.district || 'Unknown district',
          hazardRiskPct: status === 'BLOCKED' ? 100 : status === 'AT_RISK' || status === 'AT RISK' ? 70 : 0,
          blockageProbabilityPct: status === 'BLOCKED' ? 100 : status === 'AT_RISK' || status === 'AT RISK' ? 70 : 0,
          currentStatus: status === 'BLOCKED' ? 'BLOCKED' : status === 'AT_RISK' || status === 'AT RISK' ? 'AT RISK' : 'SAFE',
          alternativeAvailable: false,
          nearestHighRiskSlope: { id: '', name: 'Not available', distanceM: 0, riskScore: 0 },
          nearbySettlement: 'Not available',
          recommendedAction: status === 'AT_RISK' || status === 'AT RISK' ? 'Caution: backend road is at risk.' : 'Monitor backend road status.',
          affectedSegmentDescription: `Road type: ${road.road_type || 'Not available'}`,
          coordinates,
          isSimulatedFailure: false
        } as RoadRisk;
      });
      const filtered = mapped.filter((road) => (!state || road.state === state) && (!district || district === 'ALL' || road.district.toLowerCase() === district.toLowerCase()));
      if (filtered.length > 0) return filtered;
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
    return new Promise((resolve) => {
      let filtered = [...this.roadRisks];
      if (state) {
        filtered = filtered.filter((r) => r.state === state);
      }
      if (district && district !== 'ALL') {
        filtered = filtered.filter((r) => r.district.toLowerCase() === district.toLowerCase());
      }
      resolve(filtered);
    });
  }

  /**
   * Fetch road risk by road ID
   */
  async getRoadRiskById(roadId: string): Promise<RoadRisk | undefined> {
    return this.roadRisks.find((r) => r.roadId === roadId);
  }

  /**
   * Find nearest threatened road for a monitored landslide slope
   */
  async getRoadRiskForLocation(locationId: string): Promise<RoadRisk | undefined> {
    const directMatch = this.roadRisks.find((r) => r.nearestHighRiskSlope.id === locationId);
    if (directMatch) return directMatch;

    const loc = INITIAL_MONITORED_LOCATIONS.find((l) => l.id === locationId);
    if (loc) {
      return this.roadRisks.find((r) => r.state === loc.state) || this.roadRisks[0];
    }
    return this.roadRisks[0];
  }

  /**
   * Simulate a road blockage event (e.g. for dynamic route failure demo)
   */
  async setSimulatedFailure(roadId: string, failed: boolean): Promise<RoadRisk | undefined> {
    const road = this.roadRisks.find((r) => r.roadId === roadId);
    if (road) {
      road.isSimulatedFailure = failed;
      if (failed) {
        road.currentStatus = 'BLOCKED';
        road.blockageProbabilityPct = 96;
        road.recommendedAction = '⚠ EMERGENCY: Road segment invalidated by active failure. All traffic re-routed to bypass.';
      } else {
        road.currentStatus = 'LIKELY BLOCKED';
        road.blockageProbabilityPct = 88;
        road.recommendedAction = 'Halt non-essential freight. Divert light evacuation traffic via Peducha–Tsiesema bypass.';
      }
      return { ...road };
    }
    return undefined;
  }
}

export const roadService = new RoadService();
