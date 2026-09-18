import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  GISLayerToggles,
  InfrastructureItem,
  TimeHorizon
} from '../../types';
import { NER_STATES_META, NER_DEFAULT_BOUNDS } from '../../data/nerGeography';
import { gisService } from '../../services/gisService';
import { riskService } from '../../services/riskService';
import {
  Layers,
  RotateCcw,
  MapPin,
  ChevronDown,
  X,
  Eye,
  Sliders,
  Clock
} from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  shelters: ShelterFacility[];
  fieldReports: FieldReport[];
  layerToggles: GISLayerToggles;
  onToggleLayer: (layerKey: keyof GISLayerToggles) => void;
  selectedLocationId: string | null;
  onSelectLocation: (location: MonitoredLocation) => void;
  timeHorizon?: TimeHorizon;
  onTimeHorizonChange?: (horizon: TimeHorizon) => void;
  activeRouteLine?: {
    coordinates: [number, number][];
    isRecommended: boolean;
    label?: string;
  } | null;
  activeRouteFailedLine?: {
    coordinates: [number, number][];
    label?: string;
  } | null;
  focusedRoadCoordinates?: [number, number][] | null;
  emergencyMode?: boolean;
}

export const NERLeafletMap: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  roads,
  shelters,
  fieldReports,
  layerToggles,
  onToggleLayer,
  selectedLocationId,
  onSelectLocation,
  timeHorizon,
  onTimeHorizonChange,
  activeRouteLine,
  activeRouteFailedLine,
  focusedRoadCoordinates,
  emergencyMode
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Time Horizon State (NOW, +6H, +12H, +24H)
  const [internalHorizon, setInternalHorizon] = useState<TimeHorizon>('NOW');
  const activeHorizon = timeHorizon || internalHorizon;

  const handleHorizonChange = (h: TimeHorizon) => {
    if (onTimeHorizonChange) {
      onTimeHorizonChange(h);
    } else {
      setInternalHorizon(h);
    }
  };

  // Dynamic Layer Groups
  const heatBufferGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const slopesGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const roadsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const sheltersGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const reportsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const stateBoundariesGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const districtBoundariesGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const infrastructureGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const activeFocusGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // UI state
  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'topo'>('osm');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      minZoom: 6,
      maxZoom: 18
    });

    // Fit North Eastern Region bounding box tightly
    map.fitBounds(NER_DEFAULT_BOUNDS, { padding: [10, 10] });

    // OpenStreetMap default basemap (Truthful Attribution: LIVE MAP)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);
    baseTileLayerRef.current = osmLayer;

    // Zoom and metric scale controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Add all managed layer groups to map
    stateBoundariesGroupRef.current.addTo(map);
    districtBoundariesGroupRef.current.addTo(map);
    activeFocusGroupRef.current.addTo(map);
    heatBufferGroupRef.current.addTo(map);
    roadsGroupRef.current.addTo(map);
    infrastructureGroupRef.current.addTo(map);
    sheltersGroupRef.current.addTo(map);
    reportsGroupRef.current.addTo(map);
    slopesGroupRef.current.addTo(map);
    routeGroupRef.current.addTo(map);

    // Real-time cursor coordinates readout
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4))
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Base Tiles (OSM vs Topo)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    if (activeBasemap === 'topo') {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 17,
          attribution: 'Map: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      ).addTo(map);
    }
  }, [activeBasemap]);

  // Handle State & District Framing and Bounds Fitting
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedState === 'ALL') {
      // Fit tightly to the 8 NER States
      map.flyToBounds(NER_DEFAULT_BOUNDS, { padding: [12, 12], duration: 1.1 });
    } else {
      const stateMeta = NER_STATES_META[selectedState];
      if (stateMeta) {
        if (selectedDistrict !== 'ALL') {
          const districtData = stateMeta.districts.find(
            (d) => d.name.toLowerCase() === selectedDistrict.toLowerCase()
          );
          if (districtData) {
            // District specific framing
            map.flyTo(districtData.center, 11, { duration: 1.1 });
            return;
          }
        }
        // State specific framing
        map.flyToBounds(stateMeta.bounds, { padding: [20, 20], duration: 1.1 });
      }
    }
  }, [selectedState, selectedDistrict]);

  // State & District Boundaries Overlays with Visual Analysis Focus
  useEffect(() => {
    stateBoundariesGroupRef.current.clearLayers();
    districtBoundariesGroupRef.current.clearLayers();
    activeFocusGroupRef.current.clearLayers();

    // 1. State Boundaries
    if (layerToggles.stateBoundaries) {
      Object.entries(NER_STATES_META).forEach(([stName, meta]) => {
        const isSelected = selectedState === stName;

        const rect = L.rectangle(meta.bounds, {
          color: isSelected ? '#1D4E89' : '#94A3B8',
          weight: isSelected ? 3.0 : 1.0,
          fillColor: isSelected ? '#1D4E89' : '#64748B',
          fillOpacity: isSelected ? 0.08 : 0.015,
          dashArray: isSelected ? undefined : '3, 4'
        });

        rect.bindTooltip(`State: ${stName}`, { permanent: false, direction: 'center' });
        stateBoundariesGroupRef.current.addLayer(rect);
      });
    }

    // 2. District Focus & Nodes
    if (selectedState !== 'ALL') {
      const stateMeta = NER_STATES_META[selectedState];
      if (stateMeta) {
        stateMeta.districts.forEach((d) => {
          const isDistSelected = selectedDistrict.toLowerCase() === d.name.toLowerCase();

          if (layerToggles.districtBoundaries) {
            const marker = L.circleMarker(d.center, {
              radius: isDistSelected ? 8 : 5,
              color: isDistSelected ? '#1D4E89' : '#64748B',
              fillColor: isDistSelected ? '#1D4E89' : '#CBD5E1',
              fillOpacity: 0.85,
              weight: isDistSelected ? 2.5 : 1.5
            });
            marker.bindTooltip(`District: ${d.name}`, { permanent: isDistSelected, direction: 'top' });
            districtBoundariesGroupRef.current.addLayer(marker);
          }

          // Visual Analysis Buffer for Selected District
          if (isDistSelected) {
            const districtHalo = L.circle(d.center, {
              radius: 14000,
              color: '#1D4E89',
              fillColor: '#3B82F6',
              fillOpacity: 0.07,
              weight: 2,
              dashArray: '6, 4'
            });
            districtHalo.bindTooltip(`ACTIVE ANALYSIS SECTOR: ${d.name} District`, {
              permanent: true,
              direction: 'center',
              className: 'bg-[#1D4E89] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow'
            });
            activeFocusGroupRef.current.addLayer(districtHalo);
          }
        });
      }
    }
  }, [layerToggles.stateBoundaries, layerToggles.districtBoundaries, selectedState, selectedDistrict]);

  // Load and Render Infrastructure (Hospitals, Bridges, Rivers, Settlements)
  // Clicking GIS features opens an informative popup, NOT the landslide slope drawer
  useEffect(() => {
    infrastructureGroupRef.current.clearLayers();

    const loadInfra = async () => {
      const types: InfrastructureItem['type'][] = [];
      if (layerToggles.hospitals) types.push('HOSPITAL');
      if (layerToggles.bridges) types.push('BRIDGE');
      if (layerToggles.rivers) types.push('RIVER');
      if (layerToggles.settlements) types.push('SETTLEMENT');

      if (types.length === 0) return;

      const items = await gisService.getInfrastructure(selectedState, selectedDistrict, types);

      items.forEach((item) => {
        let symbol = '•';
        let bg = '#1D4E89';

        if (item.type === 'HOSPITAL') {
          symbol = '✚';
          bg = '#DC2626';
        } else if (item.type === 'BRIDGE') {
          symbol = '⊓';
          bg = '#D97706';
        } else if (item.type === 'RIVER') {
          symbol = '~';
          bg = '#0284C7';
        } else if (item.type === 'SETTLEMENT') {
          symbol = '⌂';
          bg = '#475569';
        }

        const iconHtml = `
          <div style="
            background: ${bg};
            width: 18px;
            height: 18px;
            border-radius: 3px;
            border: 1.5px solid white;
            color: white;
            font-size: 10px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          ">
            ${symbol}
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-infra-icon',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const marker = L.marker([item.lat, item.lng], { icon });
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; min-width: 180px;">
            <div style="font-size: 9px; font-weight: 700; background: ${bg}15; color: ${bg}; padding: 1px 5px; border-radius: 3px; display: inline-block; margin-bottom: 3px;">
              GIS INFRASTRUCTURE • ${item.type}
            </div>
            <h4 style="font-size: 12px; font-weight: 700; margin: 2px 0; color: #172033;">${item.name}</h4>
            <p style="margin: 0; color: #5F6877; font-size: 11px;">${item.details}</p>
            <div style="font-size: 10px; color: #5F6877; margin-top: 3px;">
              Sector: <strong>${item.district}, ${item.state}</strong>
            </div>
          </div>
        `);

        infrastructureGroupRef.current.addLayer(marker);
      });
    };

    loadInfra();
  }, [
    layerToggles.hospitals,
    layerToggles.bridges,
    layerToggles.rivers,
    layerToggles.settlements,
    selectedState,
    selectedDistrict
  ]);

  // Render Slopes, Heatmaps, Roads, Shelters, and Reports
  useEffect(() => {
    // 1. Monitored Slopes & Risk Markers
    slopesGroupRef.current.clearLayers();
    heatBufferGroupRef.current.clearLayers();

    const effectiveLocations = riskService.getLocationsForHorizon(locations, activeHorizon);

    if (layerToggles.currentRisk || layerToggles.riskHeatmap) {
      effectiveLocations.forEach((loc) => {
        const isSelected = loc.id === selectedLocationId;
        const riskAvailable = loc.riskDataAvailable !== false;
        const environmentAvailable = loc.environmentalDataAvailable !== false;
        const terrainAvailable = loc.terrainDataAvailable !== false;
        const color =
          !riskAvailable
            ? '#64748B'
            : loc.riskLevel === 'CRITICAL'
            ? '#DC2626'
            : loc.riskLevel === 'HIGH'
            ? '#EA580C'
            : loc.riskLevel === 'MODERATE'
            ? '#D97706'
            : '#16A34A';

        // Size hierarchy based on risk severity
        const markerSize =
          isSelected
            ? 32
            : loc.riskLevel === 'CRITICAL'
            ? 28
            : loc.riskLevel === 'HIGH'
            ? 24
            : loc.riskLevel === 'MODERATE'
            ? 20
            : 17;

        // Susceptibility Runout Buffer
        if (layerToggles.riskHeatmap && riskAvailable && (loc.riskLevel === 'CRITICAL' || loc.riskLevel === 'HIGH')) {
          const bufferRadius = loc.riskLevel === 'CRITICAL' ? 3200 : 2000;
          const circle = L.circle([loc.lat, loc.lng], {
            radius: bufferRadius,
            color: color,
            fillColor: color,
            fillOpacity: loc.riskLevel === 'CRITICAL' ? 0.20 : 0.12,
            weight: 1.5,
            dashArray: '4, 4'
          });
          heatBufferGroupRef.current.addLayer(circle);
        }

        // Monitored Slope Station Marker
        if (layerToggles.currentRisk) {
          const markerHtml = `
            <div style="
              background-color: ${color};
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 50%;
              border: ${isSelected ? '2.5px solid #1D4E89' : '2px solid #FFFFFF'};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: ${markerSize > 22 ? '11px' : '9px'};
              font-weight: 800;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              cursor: pointer;
              ${loc.riskLevel === 'CRITICAL' ? 'box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.35);' : ''}
            ">
              ${riskAvailable ? loc.riskScore : '--'}
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-slope-marker',
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2]
          });

          const marker = L.marker([loc.lat, loc.lng], {
            icon: customIcon,
            zIndexOffset: loc.riskLevel === 'CRITICAL' ? 1000 : loc.riskLevel === 'HIGH' ? 800 : 500
          });

          const popupContent = `
            <div style="font-family: system-ui, sans-serif; min-width: 240px; font-size: 12px; color: #172033; padding: 6px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #DDE2E7; padding-bottom: 3px; margin-bottom: 5px;">
                <span style="font-size: 9px; font-weight: 700; background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">
                  ${riskAvailable ? `${loc.riskLevel} (${loc.riskScore}%)` : 'RISK UNAVAILABLE'}
                </span>
                <span style="font-size: 9px; color: #5F6877; font-family: monospace;">
                  ${activeHorizon === 'NOW' ? 'CURRENT AI RISK' : `AI FORECAST (${activeHorizon})`}
                </span>
              </div>
              <div style="font-size: 9px; color: ${loc.dataProvenance === 'AI PREDICTION' ? '#0369A1' : '#92400E'}; font-family: monospace; font-weight: 700; margin-bottom: 5px;">
                ${loc.dataProvenance === 'AI PREDICTION' ? 'AI PREDICTION • PROJECT API' : 'PROTOTYPE DATA • SIMULATED RISK STATION'}
              </div>
              <h4 style="font-size: 12px; font-weight: 700; margin: 0 0 3px 0; color: #1D4E89;">${loc.name}</h4>
              <p style="margin: 0 0 5px 0; color: #5F6877; font-size: 11px;">
                ${loc.district}, ${loc.state} • Elev: ${terrainAvailable ? `${loc.elevationM}m` : 'Unavailable'} • Slope: ${terrainAvailable ? `${loc.slopeAngleDeg}°` : 'Unavailable'}
              </p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; background: #F8F9FA; padding: 5px; border-radius: 4px; margin-bottom: 6px; font-size: 10px;">
                <div>Rain 24h: <strong>${environmentAvailable ? `${loc.rainfall24hMm} mm` : 'Unavailable'}</strong></div>
                <div>Soil Sat: <strong>${environmentAvailable ? `${loc.soilMoisturePct}%` : 'Unavailable'}</strong></div>
                <div>Memory: <strong>${environmentAvailable ? `${loc.rainfallDecayMemoryMm} mm` : 'Unavailable'}</strong></div>
                <div>Trend: <strong>${loc.riskTrend}</strong></div>
              </div>

              ${loc.dataProvenance === 'AI PREDICTION' ? '<div style="font-size: 10px; color: #075985; background: #E0F2FE; padding: 3px 5px; border-radius: 3px; margin-bottom: 5px;">AI estimate — not a guaranteed prediction.</div>' : ''}

              ${
                loc.cascadingHazard
                  ? `<div style="font-size: 10px; color: #B91C1C; background: #FEE2E2; padding: 3px 5px; border-radius: 3px; margin-bottom: 5px;">
                      <strong>⚠️ Threat:</strong> ${loc.cascadingHazard}
                     </div>`
                  : ''
              }

              <button id="inspect-loc-${loc.id}" style="
                width: 100%;
                background: #1D4E89;
                color: #FFFFFF;
                border: none;
                border-radius: 3px;
                padding: 5px 8px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
              ">
                Inspect in Location Intelligence Drawer
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);

          // Clicking a risk marker opens the Location Intelligence drawer
          marker.on('click', () => {
            onSelectLocation(loc);
          });

          marker.on('popupopen', () => {
            const btn = document.getElementById(`inspect-loc-${loc.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectLocation(loc);
              };
            }
          });

          slopesGroupRef.current.addLayer(marker);
        }
      });
    }

    // 2. Road Network Polylines
    roadsGroupRef.current.clearLayers();
    if (layerToggles.roads) {
      roads.forEach((road) => {
        const roadColor =
          road.status === 'BLOCKED'
            ? '#DC2626'
            : road.status === 'CAUTION'
            ? '#D97706'
            : '#16A34A';

        const polyline = L.polyline(road.coordinates, {
          color: roadColor,
          weight: road.status === 'BLOCKED' ? 4.5 : 3.5,
          opacity: 0.9,
          dashArray: road.status === 'BLOCKED' ? '7, 7' : road.status === 'CAUTION' ? '5, 5' : undefined
        });

        polyline.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 200px; font-size: 12px; padding: 4px;">
            <div style="font-size: 9px; font-weight: 700; color: ${roadColor}; text-transform: uppercase; margin-bottom: 3px;">
              HIGHWAY STATUS: ${road.status} (${road.blockageProbabilityPct}% Blockage Risk)
            </div>
            <strong style="color: #172033; font-size: 12px;">${road.code} - ${road.name}</strong>
            <div style="font-size: 10px; color: #5F6877; margin-top: 3px;">
              Sector: <strong>${road.state}</strong> • Alternate: ${road.alternateRoute}
            </div>
          </div>
        `);

        roadsGroupRef.current.addLayer(polyline);
      });
    }

    // 3. Shelters
    sheltersGroupRef.current.clearLayers();
    if (layerToggles.shelters) {
      shelters.forEach((shelter) => {
        const shelterHtml = `
          <div style="
            background-color: #1D4E89;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 1.5px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          ">
            ⌂
          </div>
        `;

        const shelterIcon = L.divIcon({
          html: shelterHtml,
          className: 'custom-shelter-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const marker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon });
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px;">
            <span style="font-size: 9px; font-weight: 700; background: #DBEAFE; color: #1E40AF; padding: 2px 5px; border-radius: 3px;">
              EVACUATION SHELTER
            </span>
            <h4 style="font-size: 12px; font-weight: 700; margin: 3px 0; color: #1D4E89;">${shelter.name}</h4>
            <p style="margin: 0 0 4px 0; color: #5F6877; font-size: 10px;">${shelter.district}, ${shelter.state}</p>
            <div style="background: #F8F9FA; padding: 4px; border-radius: 3px; font-size: 10px;">
              <div>Capacity: <strong>${shelter.capacity}</strong> • Occupancy: <strong>${shelter.currentOccupancy}</strong></div>
              <div>Contact: <strong>${shelter.contactNumber}</strong></div>
            </div>
          </div>
        `);

        sheltersGroupRef.current.addLayer(marker);
      });
    }

    // 4. Field Reports
    reportsGroupRef.current.clearLayers();
    if (layerToggles.fieldReports) {
      fieldReports.forEach((report) => {
        const reportColor = report.severity === 'CRITICAL' ? '#DC2626' : '#EA580C';
        const reportHtml = `
          <div style="
            background-color: ${reportColor};
            width: 17px;
            height: 17px;
            border-radius: 3px;
            border: 1.5px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
            font-weight: bold;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          ">
            !
          </div>
        `;

        const reportIcon = L.divIcon({
          html: reportHtml,
          className: 'custom-report-marker',
          iconSize: [17, 17],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([report.lat, report.lng], { icon: reportIcon });
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 9px; font-weight: 700; background: #FEE2E2; color: #991B1B; padding: 1px 5px; border-radius: 3px;">
                FIELD OBSERVATION
              </span>
              <span style="font-size: 9px; color: #5F6877;">${report.timestamp}</span>
            </div>
            <strong style="font-size: 11px; color: #172033;">${report.locationName}</strong>
            <p style="margin: 2px 0; color: #374151; font-size: 11px;">"${report.description}"</p>
            <div style="font-size: 9px; color: #5F6877;">
              Reporter: <strong>${report.reporterType.replace('_', ' ')}</strong> ${report.verifiedByAuthority ? '• Verified' : '• Pending review'}
            </div>
          </div>
        `);

        reportsGroupRef.current.addLayer(marker);
      });
    }
  }, [locations, roads, shelters, fieldReports, layerToggles, selectedLocationId, activeHorizon]);

  // Render Operational Evacuation Routes & Focused Road Corridors
  useEffect(() => {
    routeGroupRef.current.clearLayers();
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Render Failed / Unsafe Route (if active)
    if (activeRouteFailedLine && activeRouteFailedLine.coordinates.length > 0) {
      const failedPoly = L.polyline(activeRouteFailedLine.coordinates, {
        color: '#94A3B8',
        weight: 5,
        dashArray: '8, 8',
        opacity: 0.85
      });

      failedPoly.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 11px; padding: 4px;">
          <div style="font-weight: 700; color: #DC2626; margin-bottom: 2px;">
            ⚠️ INVALIDATED ROUTE (HIGH HAZARD)
          </div>
          <div>${activeRouteFailedLine.label || 'Direct arterial corridor now compromised by active slope failure.'}</div>
        </div>
      `);

      routeGroupRef.current.addLayer(failedPoly);

      // Warning marker at the mid-point / hazard intersection
      const midIdx = Math.floor(activeRouteFailedLine.coordinates.length / 2);
      const midCoord = activeRouteFailedLine.coordinates[midIdx];
      if (midCoord) {
        const warnIcon = L.divIcon({
          html: `
            <div style="
              background: #DC2626;
              color: white;
              font-weight: bold;
              font-size: 11px;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(220,38,38,0.5);
            ">
              ✕
            </div>
          `,
          className: 'hazard-blocked-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        const warnMarker = L.marker(midCoord, { icon: warnIcon });
        warnMarker.bindPopup(`
          <div style="font-size: 11px; font-weight: bold; color: #DC2626; padding: 2px;">
            CRITICAL LANDSLIDE INTERSECTION<br/>
            <span style="font-size: 10px; font-weight: normal; color: #374151;">Road blocked by active debris slide</span>
          </div>
        `);
        routeGroupRef.current.addLayer(warnMarker);
      }
    }

    // 2. Render Active / Recommended Route
    if (activeRouteLine && activeRouteLine.coordinates.length > 0) {
      const isRec = activeRouteLine.isRecommended;
      const routeColor = isRec ? '#1D4E89' : '#DC2626';

      const poly = L.polyline(activeRouteLine.coordinates, {
        color: routeColor,
        weight: 6,
        opacity: 0.95
      });

      poly.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px;">
          <div style="font-size: 9px; font-weight: 700; color: ${isRec ? '#1D4E89' : '#DC2626'}; text-transform: uppercase;">
            ${isRec ? '✓ RECOMMENDED EVACUATION ROUTE' : '⚠️ AT-RISK ROUTE'}
          </div>
          <strong>${activeRouteLine.label || 'Designated Corridor'}</strong>
        </div>
      `);

      routeGroupRef.current.addLayer(poly);

      // Start & End points
      const startCoord = activeRouteLine.coordinates[0];
      const endCoord = activeRouteLine.coordinates[activeRouteLine.coordinates.length - 1];

      if (startCoord) {
        const startIcon = L.divIcon({
          html: `
            <div style="
              background: #16A34A;
              color: white;
              font-size: 9px;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 4px;
              border: 1.5px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">
              ORIGIN
            </div>
          `,
          className: 'route-origin-tag',
          iconSize: [40, 16],
          iconAnchor: [20, 8]
        });
        routeGroupRef.current.addLayer(L.marker(startCoord, { icon: startIcon }));
      }

      if (endCoord) {
        const destIcon = L.divIcon({
          html: `
            <div style="
              background: #1D4E89;
              color: white;
              font-size: 9px;
              font-weight: 800;
              padding: 2px 5px;
              border-radius: 4px;
              border: 1.5px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">
              SHELTER
            </div>
          `,
          className: 'route-dest-tag',
          iconSize: [46, 16],
          iconAnchor: [23, 8]
        });
        routeGroupRef.current.addLayer(L.marker(endCoord, { icon: destIcon }));
      }

      // Auto-fit to route bounds
      try {
        const bounds = L.latLngBounds(activeRouteLine.coordinates);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.9 });
      } catch (err) {
        console.warn('Could not fit to route bounds:', err);
      }
    }

    // 3. Focused road highlight
    if (focusedRoadCoordinates && focusedRoadCoordinates.length > 0 && !activeRouteLine) {
      const roadPoly = L.polyline(focusedRoadCoordinates, {
        color: '#EA580C',
        weight: 6,
        opacity: 0.95
      });
      routeGroupRef.current.addLayer(roadPoly);

      try {
        const bounds = L.latLngBounds(focusedRoadCoordinates);
        map.flyToBounds(bounds, { padding: [40, 40], duration: 0.9 });
      } catch (err) {}
    }
  }, [activeRouteLine, activeRouteFailedLine, focusedRoadCoordinates]);

  const resetView = () => {
    mapInstanceRef.current?.flyToBounds(NER_DEFAULT_BOUNDS, { padding: [10, 10], duration: 1 });
  };

  return (
    <div className="relative w-full h-full min-h-[440px] bg-[#E8ECEF] overflow-hidden select-none">
      {/* Real Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" id="ner-leaflet-map-canvas" />

      {/* Floating Top Controls: Basemap Switcher & Reset */}
      <div className="absolute top-2.5 left-2.5 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-[#DDE2E7] rounded-md shadow-xs p-1 text-xs">
        <button
          onClick={() => setActiveBasemap('osm')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeBasemap === 'osm'
              ? 'bg-[#1D4E89] text-white'
              : 'text-[#5F6877] hover:text-[#172033] hover:bg-slate-100'
          }`}
          title="OpenStreetMap Standard Cartography (Live)"
        >
          OSM Standard
        </button>
        <button
          onClick={() => setActiveBasemap('topo')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeBasemap === 'topo'
              ? 'bg-[#1D4E89] text-white'
              : 'text-[#5F6877] hover:text-[#172033] hover:bg-slate-100'
          }`}
          title="SRTM Topographic Elevation Contours"
        >
          Topographic
        </button>
        <button
          onClick={resetView}
          title="Fit North Eastern Region Bounds"
          className="p-1 rounded text-[#1D4E89] hover:bg-slate-100 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Map Time Control Bar: NOW, +6H, +12H, +24H */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-[#DDE2E7] rounded-md shadow-md px-2.5 py-1 text-xs select-none">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#172033] pr-2 border-r border-[#DDE2E7]">
          <Clock className="w-3.5 h-3.5 text-[#1D4E89]" />
          <span>{activeHorizon === 'NOW' ? 'CURRENT AI RISK' : `AI FORECAST (${activeHorizon})`}</span>
        </div>
        <div className="flex items-center gap-1">
          {(['NOW', '+6H', '+12H', '+24H'] as TimeHorizon[]).map((horizon) => (
            <button
              key={horizon}
              onClick={() => handleHorizonChange(horizon)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                activeHorizon === horizon
                  ? 'bg-[#1D4E89] text-white shadow-xs'
                  : 'text-[#5F6877] hover:text-[#172033] hover:bg-slate-100'
              }`}
            >
              {horizon}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible, Space-Efficient GIS Layer Controls (Top Right) */}
      <div className="absolute top-2.5 right-2.5 z-[1000]">
        {!isLayersPanelOpen ? (
          <button
            onClick={() => setIsLayersPanelOpen(true)}
            className="bg-white/95 backdrop-blur-xs border border-[#DDE2E7] text-[#172033] hover:text-[#1D4E89] hover:bg-slate-50 px-2.5 py-1.5 rounded-md shadow-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Open GIS Layer Manager"
          >
            <Layers className="w-3.5 h-3.5 text-[#1D4E89]" />
            <span>Layers</span>
          </button>
        ) : (
          <div className="bg-white/95 backdrop-blur-xs border border-[#DDE2E7] rounded-md shadow-lg text-xs w-56 overflow-hidden">
            <div className="p-2 bg-[#F8F9FA] border-b border-[#DDE2E7] flex items-center justify-between select-none">
              <span className="font-bold text-[#172033] text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1D4E89]" />
                GIS Layers
              </span>
              <button
                onClick={() => setIsLayersPanelOpen(false)}
                className="text-[#5F6877] hover:text-[#172033] p-0.5 cursor-pointer"
                title="Collapse Layers Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 space-y-2 max-h-[340px] overflow-y-auto text-[11px]">
              {/* REAL GIS */}
              <div>
                <div className="text-[9px] font-bold text-[#5F6877] uppercase tracking-wider mb-1">
                  Real GIS
                </div>
                <div className="space-y-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.stateBoundaries}
                      onChange={() => onToggleLayer('stateBoundaries')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>State Borders (8 States)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.districtBoundaries}
                      onChange={() => onToggleLayer('districtBoundaries')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>District Nodes</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.roads}
                      onChange={() => onToggleLayer('roads')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Lifeline Highways</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.settlements}
                      onChange={() => onToggleLayer('settlements')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Settlements &amp; Towns</span>
                  </label>
                </div>
              </div>

              {/* ENVIRONMENT */}
              <div className="pt-1.5 border-t border-[#DDE2E7]">
                <div className="text-[9px] font-bold text-[#5F6877] uppercase tracking-wider mb-1">
                  Environment
                </div>
                <div className="space-y-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.rivers}
                      onChange={() => onToggleLayer('rivers')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>River Drainage Network</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.bridges}
                      onChange={() => onToggleLayer('bridges')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Lifeline Bridges</span>
                  </label>
                </div>
              </div>

              {/* LANDSLIDE INTELLIGENCE */}
              <div className="pt-1.5 border-t border-[#DDE2E7]">
                <div className="text-[9px] font-bold text-[#5F6877] uppercase tracking-wider mb-1">
                  Landslide Intelligence
                </div>
                <div className="space-y-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.currentRisk}
                      onChange={() => onToggleLayer('currentRisk')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Slope Risk Stations</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.riskHeatmap}
                      onChange={() => onToggleLayer('riskHeatmap')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Susceptibility Buffer</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.fieldReports}
                      onChange={() => onToggleLayer('fieldReports')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Field Observations</span>
                  </label>
                </div>
              </div>

              {/* EMERGENCY RESPONSE */}
              <div className="pt-1.5 border-t border-[#DDE2E7]">
                <div className="text-[9px] font-bold text-[#5F6877] uppercase tracking-wider mb-1">
                  Emergency Response
                </div>
                <div className="space-y-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.shelters}
                      onChange={() => onToggleLayer('shelters')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Evacuation Shelters</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 p-0.5 rounded text-[#172033]">
                    <input
                      type="checkbox"
                      checked={layerToggles.hospitals}
                      onChange={() => onToggleLayer('hospitals')}
                      className="rounded text-[#1D4E89] focus:ring-0 scale-90"
                    />
                    <span>Trauma Hospitals</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permanent Compact Map Legend (Bottom Right, Unobtrusive) */}
      <div className="absolute bottom-9 right-2.5 z-[1000] bg-white/95 backdrop-blur-xs border border-[#DDE2E7] rounded-md shadow-xs p-2 text-[10px] w-48 select-none">
        <div className="font-bold text-[#172033] uppercase tracking-wider border-b border-[#DDE2E7] pb-1 mb-1.5 flex justify-between items-center">
          <span>Map Legend</span>
          <span className="text-[9px] text-[#5F6877] font-normal">NER GIS</span>
        </div>

        {/* Landslide Risk Categories */}
        <div className="mb-1.5">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block mb-0.5">Landslide Risk</span>
          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] flex-shrink-0"></span>
              <span>Low (&lt;50)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706] flex-shrink-0"></span>
              <span>Mod (50-69)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] flex-shrink-0"></span>
              <span>High (70-84)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] flex-shrink-0"></span>
              <span>Crit (85+)</span>
            </div>
          </div>
        </div>

        {/* Other Features */}
        <div className="pt-1 border-t border-slate-100">
          <span className="text-[9px] font-bold text-[#5F6877] uppercase block mb-0.5">Infrastructure</span>
          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px] text-[#5F6877]">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-red-600 font-bold leading-none">✚</span>
              <span>Hospital</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-blue-800 font-bold leading-none">⌂</span>
              <span>Shelter</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-600 inline-block border-t border-dashed border-red-600 flex-shrink-0"></span>
              <span className="truncate">Blocked Rd</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-600 text-white text-[7px] flex items-center justify-center font-bold rounded-xs flex-shrink-0">!</span>
              <span>Field Rep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Base Map Attribution & Real-time Cursor Readout (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-xs border border-[#DDE2E7] rounded px-2 py-0.5 text-[10px] text-[#5F6877] flex flex-wrap items-center gap-2 shadow-2xs">
        <span className="font-medium text-[#1D4E89]">
          LIVE MAP: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a>
        </span>
        <span>•</span>
        <span>EPSG:4326</span>
        {cursorCoords && (
          <span className="font-mono text-[#172033] bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
            {cursorCoords.lat}°N, {cursorCoords.lng}°E
          </span>
        )}
      </div>
    </div>
  );
};
