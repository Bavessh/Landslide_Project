import React, { useEffect, useState } from 'react';
import {
  MonitoredLocation,
  NERState,
  LiveWeatherData,
  RainfallMemoryData,
  NavigationTab
} from '../../types';
import { weatherService } from '../../services/weatherService';
import { riskService } from '../../services/riskService';
import { RainfallTimelineChart } from './weather/RainfallTimelineChart';
import { AccumulatedRainfallChart } from './weather/AccumulatedRainfallChart';
import { RainfallRiskComparisonChart } from './weather/RainfallRiskComparisonChart';
import { RainfallForecastChart } from './weather/RainfallForecastChart';
import { RainfallMemoryCard } from './weather/RainfallMemoryCard';
import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Compass,
  RefreshCw,
  MapPin,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Info,
  Layers,
  BrainCircuit
} from 'lucide-react';

interface Props {
  selectedLocation: MonitoredLocation | null;
  locations: MonitoredLocation[];
  selectedState: NERState;
  selectedDistrict: string;
  onSelectLocation: (loc: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

export const WeatherRainfallPage: React.FC<Props> = ({
  selectedLocation,
  locations,
  selectedState,
  selectedDistrict,
  onSelectLocation,
  onNavigateTab
}) => {
  const activeLocation =
    selectedLocation ||
    locations.filter(
      (l) =>
        l.state === selectedState &&
        (selectedDistrict === 'ALL' || l.district.toLowerCase() === selectedDistrict.toLowerCase())
    )[0] ||
    locations[0];

  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [memoryData, setMemoryData] = useState<RainfallMemoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchWeather = async () => {
    if (!activeLocation) return;
    setRefreshing(true);
    try {
      const [liveW, mem] = await Promise.all([
        weatherService.getLiveWeatherForCoordinates(activeLocation.lat, activeLocation.lng),
        riskService.getRainfallMemoryData(activeLocation)
      ]);
      setWeatherData(liveW);
      setMemoryData(mem);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchWeather();
  }, [activeLocation?.id]);

  if (!activeLocation) {
    return (
      <div className="p-8 text-center text-[#5F6877]">
        <p>No location selected for meteorological monitoring.</p>
      </div>
    );
  }

  const availableLocations = locations.filter(
    (l) =>
      l.state === selectedState &&
      (selectedDistrict === 'ALL' || l.district.toLowerCase() === selectedDistrict.toLowerCase())
  );

  // Hourly rainfall past 24h
  const hourlyData = [
    { time: '00:00', rainfallMm: 1.2 },
    { time: '02:00', rainfallMm: 3.4 },
    { time: '04:00', rainfallMm: 8.5 },
    { time: '06:00', rainfallMm: 14.2 },
    { time: '08:00', rainfallMm: 22.0 },
    { time: '10:00', rainfallMm: 16.5 },
    { time: '12:00', rainfallMm: 9.8 },
    { time: '14:00', rainfallMm: 4.5 },
    { time: '16:00', rainfallMm: 2.1 },
    { time: '18:00', rainfallMm: 5.0 },
    { time: '20:00', rainfallMm: 8.2 },
    { time: '22:00', rainfallMm: activeLocation.rainfallCurrentMm || 6.4 }
  ];

  // Cumulative periods
  const accumulated = [
    { period: '1h', mm: activeLocation.rainfallCurrentMm || 8, thresholdMm: 15 },
    { period: '6h', mm: Math.round(activeLocation.rainfall24hMm * 0.35), thresholdMm: 40 },
    { period: '24h', mm: activeLocation.rainfall24hMm, thresholdMm: 75 },
    { period: '72h', mm: activeLocation.rainfall72hMm, thresholdMm: 150 },
    { period: '7-Day', mm: Math.round(activeLocation.rainfall72hMm * 1.8), thresholdMm: 300 }
  ];

  // Rainfall vs Risk Correlation
  const comparisonData = [
    { time: '-24h', rainfallMm: 12, riskScore: 38 },
    { time: '-18h', rainfallMm: 35, riskScore: 52 },
    { time: '-12h', rainfallMm: 58, riskScore: 71 },
    { time: '-6h', rainfallMm: 24, riskScore: 78 },
    { time: 'NOW', rainfallMm: activeLocation.rainfallCurrentMm || 8, riskScore: activeLocation.riskScore },
    { time: '+6h', rainfallMm: 6, riskScore: Math.min(99, activeLocation.riskScore + 6) },
    { time: '+12h', rainfallMm: 2, riskScore: Math.min(99, activeLocation.riskScore + 10) }
  ];

  // Forecast rainfall next 24-72h
  const forecast = [
    { time: '+6h', predictedMm: 18.5 },
    { time: '+12h', predictedMm: 28.0 },
    { time: '+18h', predictedMm: 22.4 },
    { time: '+24h', predictedMm: 15.0 },
    { time: '+36h', predictedMm: 8.2 },
    { time: '+48h', predictedMm: 4.5 },
    { time: '+72h', predictedMm: 2.0 }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F4F6F8] overflow-y-auto">
      {/* Top Header & Location Selector */}
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('overview')}
              className="p-1.5 rounded text-[#5F6877] hover:text-[#172033] hover:bg-[#F1F3F5] transition-colors cursor-pointer"
              title="Return to Command Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-600" />
                <h1 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Live Weather, Rainfall &amp; Hydrologic Telemetry
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  HYDROLOGIC SURVEILLANCE
                </span>
              </div>
              <p className="text-[11px] text-[#5F6877]">
                Multi-sensor meteorological observation, antecedent moisture decay, and landslide trigger thresholds
              </p>
            </div>
          </div>

          {/* Quick Actions & Location Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5F6877] font-semibold">Inspecting Slope:</span>
            <div className="relative">
              <select
                value={activeLocation.id}
                onChange={(e) => {
                  const found = locations.find((l) => l.id === e.target.value);
                  if (found) onSelectLocation(found);
                }}
                className="bg-white border border-[#DDE2E7] rounded px-3 py-1.5 text-xs font-semibold text-[#172033] shadow-xs cursor-pointer focus:outline-hidden focus:border-[#1D4E89] pr-8"
              >
                {availableLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.district}, {l.state})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5F6877] absolute right-2 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={fetchWeather}
              disabled={refreshing}
              className="p-1.5 bg-white border border-[#DDE2E7] rounded text-[#5F6877] hover:text-[#172033] hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh meteorological telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={() => onNavigateTab('risk_intelligence')}
              className="px-2.5 py-1.5 bg-[#1D4E89] text-white rounded text-xs font-semibold hover:bg-[#153966] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Full Risk Intelligence</span>
            </button>
          </div>
        </div>

        {/* Location Sub-header strip */}
        <div className="mt-3 pt-2 border-t border-[#DDE2E7] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#172033]">{activeLocation.name}</span>
            <span className="text-[#5F6877] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#1D4E89]" />
              {activeLocation.district}, {activeLocation.state}
            </span>
            <span>•</span>
            <span className="font-mono text-[#5F6877]">
              {activeLocation.lat.toFixed(4)}°N, {activeLocation.lng.toFixed(4)}°E
            </span>
          </div>

          {weatherData && (
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  weatherData.isLive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {weatherData.isLive ? 'LIVE WEATHER' : 'SEOC TELEMETRY CACHE'}
              </span>
              <span className="text-[10px] text-[#5F6877]">
                Last Synchronized: {weatherData.lastFetched}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="p-4 space-y-4">
        {/* Live Weather Card */}
        {weatherData && (
          <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1D4E89]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  On-Site Atmospheric Telemetry (Open-Meteo &amp; IMD)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#5F6877]">{weatherData.source}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="flex items-center gap-1 text-[#5F6877] text-[10px] mb-0.5">
                  <Thermometer className="w-3.5 h-3.5 text-red-500" />
                  <span>Temperature</span>
                </div>
                <strong className="text-lg font-bold font-mono text-[#172033]">
                  {weatherData.temperatureC.toFixed(1)}°C
                </strong>
                <span className="text-[9px] text-[#5F6877] block mt-0.5">Surface 2m</span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="flex items-center gap-1 text-[#5F6877] text-[10px] mb-0.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Relative Humidity</span>
                </div>
                <strong className="text-lg font-bold font-mono text-[#172033]">
                  {weatherData.relativeHumidityPct}%
                </strong>
                <span className="text-[9px] text-[#5F6877] block mt-0.5">Vapor Saturation</span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="flex items-center gap-1 text-[#5F6877] text-[10px] mb-0.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Live Precipitation</span>
                </div>
                <strong className="text-lg font-bold font-mono text-blue-800">
                  {weatherData.precipitationMm} mm/h
                </strong>
                <span className="text-[9px] text-[#5F6877] block mt-0.5">Current Rate</span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="flex items-center gap-1 text-[#5F6877] text-[10px] mb-0.5">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>Wind Speed</span>
                </div>
                <strong className="text-lg font-bold font-mono text-[#172033]">
                  {weatherData.windSpeedKmh} km/h
                </strong>
                <span className="text-[9px] text-[#5F6877] block mt-0.5">10m Elevation</span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="flex items-center gap-1 text-[#5F6877] text-[10px] mb-0.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Soil Moisture Sat</span>
                </div>
                <strong className="text-lg font-bold font-mono text-indigo-900">
                  {weatherData.soilMoistureEstPct}%
                </strong>
                <span className="text-[9px] text-[#5F6877] block mt-0.5">0-10cm Regolith</span>
              </div>

              <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7] flex flex-col justify-between">
                <span className="text-[#5F6877] text-[10px] block mb-0.5">Sky State</span>
                <span className="text-xs font-semibold text-[#172033] leading-tight">
                  {weatherData.weatherDescription}
                </span>
                <span className="text-[9px] text-blue-700 font-mono">Orographic Influx</span>
              </div>
            </div>
          </div>
        )}

        {/* 10 Core Summary Metrics Grid */}
        <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-3">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Cumulative Hydrologic Threshold Matrix
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
              CWC TELEMETRY STANDARDS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 text-center">
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Current</span>
              <strong className="text-sm font-mono text-[#172033] mt-0.5 block">
                {activeLocation.rainfallCurrentMm} mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-[#5F6877] uppercase block">1h Rain</span>
              <strong className="text-sm font-mono text-[#172033] mt-0.5 block">
                {Math.round((activeLocation.rainfallCurrentMm || 8) * 1.2)} mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-[#5F6877] uppercase block">6h Rain</span>
              <strong className="text-sm font-mono text-[#172033] mt-0.5 block">
                {Math.round(activeLocation.rainfall24hMm * 0.35)} mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-blue-800 uppercase block">24h Rain</span>
              <strong className="text-sm font-mono text-blue-900 font-bold mt-0.5 block">
                {activeLocation.rainfall24hMm} mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-blue-800 uppercase block">72h Rain</span>
              <strong className="text-sm font-mono text-blue-900 font-bold mt-0.5 block">
                {activeLocation.rainfall72hMm} mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-[#5F6877] uppercase block">7-Day Rain</span>
              <strong className="text-sm font-mono text-[#172033] mt-0.5 block">
                {Math.round(activeLocation.rainfall72hMm * 1.8)} mm
              </strong>
            </div>
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-[9px] font-bold text-[#1D4E89] uppercase block">Forecast 24h</span>
              <strong className="text-sm font-mono text-[#1D4E89] font-bold mt-0.5 block">
                52.5 mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Soil Sat %</span>
              <strong className="text-sm font-mono text-[#172033] mt-0.5 block">
                {activeLocation.soilMoisturePct}%
              </strong>
            </div>
            <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
              <span className="text-[9px] font-bold text-indigo-900 uppercase block">Rain Memory</span>
              <strong className="text-sm font-mono text-indigo-900 font-bold mt-0.5 block">
                {activeLocation.rainfallDecayMemoryMm} mm
              </strong>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
              <span className="text-[9px] font-bold text-[#5F6877] uppercase block">Humidity</span>
              <strong className="text-sm font-mono text-[#172033] mt-0.5 block">
                {weatherData ? weatherData.relativeHumidityPct : 82}%
              </strong>
            </div>
          </div>
        </div>

        {/* Rainfall Memory Innovation Card */}
        {memoryData && <RainfallMemoryCard data={memoryData} />}

        {/* 4 Core Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RainfallTimelineChart hourlyData={hourlyData} locationName={activeLocation.name} />
          <AccumulatedRainfallChart accumulated={accumulated} />
          <RainfallRiskComparisonChart comparisonData={comparisonData} />
          <RainfallForecastChart forecast={forecast} />
        </div>
      </div>
    </div>
  );
};
