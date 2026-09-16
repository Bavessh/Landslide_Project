import { apiClient, ApiError } from './apiClient';

export interface BackendLocation {
  id: number;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface BackendRisk {
  location_id: number;
  location_name: string;
  risk: {
    risk_probability?: number | null;
    risk_score?: number | null;
    risk_level?: string | null;
    confidence?: number | null;
    model_version?: string | null;
    prediction_window?: string | null;
    timestamp?: string | null;
  };
}

export interface BackendImpact {
  location_id: number;
  location_name: string;
  risk_level?: string | null;
  risk_score?: number | null;
  impact_radius_m?: number | null;
  summary?: { total_assets?: number | null; affected_roads?: number | null; affected_villages?: number | null; critical_assets?: number | null };
  affected_assets?: Array<{ id?: number | string; name?: string | null; asset_type?: string | null; distance_m?: number | null; impact_level?: string | null; priority?: number | null; impact_status?: string | null; latitude?: number | null; longitude?: number | null }>;
  impact_zone?: unknown;
}

export interface BackendRoad { id?: number | string; name?: string; road_type?: string; status?: string; state?: string; district?: string; code?: string; coordinates?: [number, number][]; latitude?: number; longitude?: number; }
export interface BackendSettlement { id?: number | string; name?: string; state?: string; district?: string; latitude?: number; longitude?: number; }
export interface BackendShelter { id?: number | string; name?: string; capacity?: number; status?: string; state?: string; district?: string; latitude?: number; longitude?: number; }
export interface BackendAlert { id?: number | string; severity?: string; title?: string; message?: string; target_type?: string; status?: string; created_at?: string; }

export const getBackendLocations = () => apiClient.get<BackendLocation[]>('/v1/locations/');
export const getBackendLocation = (id: string) => apiClient.get<BackendLocation>(`/v1/locations/${id}`);
export const getBackendEnvironment = (locationId: string) => apiClient.get<{ location_id: number; location_name: string; data: Array<Record<string, number | string | null>> }>(`/v1/environment/${locationId}`);
export const getBackendTerrain = (locationId: string) => apiClient.get<{ location_id: number; location_name: string; data: Array<Record<string, number | string | null>> }>(`/v1/terrain/${locationId}`);
export const getBackendRisk = (locationId: string) => apiClient.get<BackendRisk>(`/v1/risk/${locationId}`);
export const getBackendImpact = (locationId: string) => apiClient.get<BackendImpact>(`/v1/impact/${locationId}`);
export const getBackendRoads = () => apiClient.get<BackendRoad[]>('/v1/roads/');
export const getBackendSettlements = () => apiClient.get<BackendSettlement[]>('/v1/settlements/');
export const getBackendShelters = () => apiClient.get<BackendShelter[]>('/v1/shelters/');
export const getBackendAlerts = () => apiClient.get<BackendAlert[]>('/v1/alerts/');

export const isBackendError = (error: unknown): error is ApiError => error instanceof ApiError;