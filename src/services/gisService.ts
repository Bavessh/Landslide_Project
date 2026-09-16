import {
  NERState,
  InfrastructureItem,
  GISLayerToggles,
  StateDistrictMetadata
} from '../types';
import {
  NER_STATES_META,
  NER_DEFAULT_BOUNDS,
  INITIAL_INFRASTRUCTURE
} from '../data/nerGeography';
import { getBackendSettlements } from './backendAdapters';
import { ApiError } from './apiClient';

/**
 * GIS and GeoSpatial query service.
 * Manages layer data, district boundaries, and Overpass OSM queries with caching.
 */
class GISService {
  private infrastructureCache: InfrastructureItem[] = [...INITIAL_INFRASTRUCTURE];
  private overpassCache: Map<string, { timestamp: number; data: any }> = new Map();

  /**
   * Returns default bounds for the North Eastern Region of India (EPSG:4326)
   */
  getDefaultNERBounds(): [[number, number], [number, number]] {
    return NER_DEFAULT_BOUNDS;
  }

  /**
   * Returns state metadata including bounding box and districts
   */
  getStateMetadata(state: NERState): StateDistrictMetadata {
    return NER_STATES_META[state];
  }

  /**
   * Returns all 8 NER state metadata objects
   */
  getAllStatesMetadata(): Record<NERState, StateDistrictMetadata> {
    return NER_STATES_META;
  }

  /**
   * Retrieves infrastructure elements filtered by state and type
   */
  async getInfrastructure(
    state?: NERState | 'ALL',
    district?: string,
    types?: InfrastructureItem['type'][]
  ): Promise<InfrastructureItem[]> {
    if (!types || types.includes('SETTLEMENT')) {
      try {
        const settlements = await getBackendSettlements();
        if (settlements.length > 0) {
          const backendItems = settlements.map((settlement) => ({
            id: String(settlement.id ?? settlement.name ?? 'SETTLEMENT'),
            name: settlement.name || 'Unnamed settlement',
            type: 'SETTLEMENT' as const,
            lat: Number(settlement.latitude ?? 0),
            lng: Number(settlement.longitude ?? 0),
            state: (settlement.state || 'Meghalaya') as NERState,
            district: settlement.district || 'Unknown district',
            status: 'OPERATIONAL' as const,
            details: 'PROJECT API settlement record'
          }));
          return backendItems.filter((item) =>
            (!state || state === 'ALL' || item.state === state) &&
            (!district || district === 'ALL' || item.district.toLowerCase() === district.toLowerCase()) &&
            (!types || types.includes(item.type))
          );
        }
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
      }
    }
    return this.infrastructureCache.filter((item) => {
      if (state && state !== 'ALL' && item.state !== state) return false;
      if (district && district !== 'ALL' && item.district.toLowerCase() !== district.toLowerCase()) return false;
      if (types && types.length > 0 && !types.includes(item.type)) return false;
      return true;
    });
  }

  /**
   * Safe Overpass query for real OpenStreetMap live features.
   * Debounced and cached so failures do NOT disrupt the primary Leaflet map.
   */
  async queryOverpassFeatures(
    bbox: [number, number, number, number], // [south, west, north, east]
    featureQuery: string
  ): Promise<any[]> {
    const key = `${bbox.map((n) => n.toFixed(2)).join(',')}_${featureQuery}`;
    const now = Date.now();
    const cached = this.overpassCache.get(key);

    // 10 minutes cache
    if (cached && now - cached.timestamp < 10 * 60 * 1000) {
      return cached.data;
    }

    try {
      const q = `[out:json][timeout:5];(
        ${featureQuery}(${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      );out body;>;out skel qt;`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(q)}`,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`Overpass returned HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const elements = data.elements || [];
      this.overpassCache.set(key, { timestamp: now, data: elements });
      return elements;
    } catch (err) {
      console.warn('Overpass GIS query skipped or unavailable, using verified local features:', err);
      return [];
    }
  }
}

export const gisService = new GISService();
