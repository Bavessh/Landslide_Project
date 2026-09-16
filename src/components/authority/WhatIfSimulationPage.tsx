import React, { useState } from 'react';
import {
  CounterfactualScenarioInput,
  CounterfactualScenarioResult,
  DrainageCondition,
  FieldReport,
  GISLayerToggles,
  MonitoredLocation,
  NavigationTab,
  NERState,
  RoadFailureScenario,
  RoadRisk,
  RoadSegment,
  RouteOption,
  ShelterFacility,
  ShelterRecommendation,
  RainfallMemoryLevel
} from '../../types';
import { scenarioService } from '../../services/scenarioService';
import { NERLeafletMap } from '../gis/NERLeafletMap';
import { AlertTriangle, Play, RotateCcw, Sliders, Route, ShieldAlert } from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  roads: RoadSegment[];
  shelters: ShelterFacility[];
  fieldReports: FieldReport[];
  selectedLocation: MonitoredLocation | null;
  selectedRoad?: RoadRisk | null;
  selectedRoute?: RouteOption | null;
  selectedShelter?: ShelterRecommendation | null;
  onSelectLocation: (location: MonitoredLocation) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

const defaultInput: CounterfactualScenarioInput = {
  rainfallChangePct: 25,
  soilMoistureChangePct: 10,
  rainfallMemory: 'HIGH',
  drainageCondition: 'NORMAL',
  roadFailure: 'NONE',
  forecastWindow: '+12H'
};

const layerDefaults: GISLayerToggles = {
  osm: true,
  stateBoundaries: true,
  districtBoundaries: true,
  roads: true,
  settlements: true,
  hospitals: true,
  bridges: true,
  rivers: true,
  rainfall: false,
  soilMoisture: false,
  terrain: false,
  currentRisk: true,
  riskHeatmap: true,
  fieldReports: false,
  shelters: true,
};

const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-IN')}`;

export const WhatIfSimulationPage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  roads,
  shelters,
  fieldReports,
  selectedLocation,
  selectedRoad,
  selectedRoute,
  selectedShelter,
  onSelectLocation,
  onNavigateTab
}) => {
  const [input, setInput] = useState<CounterfactualScenarioInput>(defaultInput);
  const [result, setResult] = useState<CounterfactualScenarioResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [layerToggles, setLayerToggles] = useState<GISLayerToggles>(layerDefaults);

  const updateInput = <Key extends keyof CounterfactualScenarioInput>(key: Key, value: CounterfactualScenarioInput[Key]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setResult(null);
  };

  const handleRun = () => {
    if (!selectedLocation) return;
    setIsRunning(true);
    setResult(
      scenarioService.runScenario(
        selectedLocation,
        roads,
        shelters,
        input,
        selectedRoad,
        selectedRoute,
        selectedShelter
      )
    );
    setIsRunning(false);
  };

  const handleReset = () => {
    setInput(defaultInput);
    setResult(null);
  };

  if (!selectedLocation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F6F7F9] p-6">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-6 max-w-md text-center">
          <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-[#1D4E89]" />
          <h2 className="font-bold text-base text-[#172033]">Counterfactual Disaster Simulation</h2>
          <p className="text-xs text-[#5F6877] mt-2">Select a monitored location before running a scenario. The simulation will use the active location and its current state context.</p>
          <button onClick={() => onNavigateTab('overview')} className="mt-4 px-3 py-2 bg-[#1D4E89] text-white rounded text-xs font-semibold cursor-pointer">Select Monitored Location</button>
        </div>
      </div>
    );
  }

  const mapRouteLine = selectedRoute
    ? { coordinates: selectedRoute.coordinates, isRecommended: selectedRoute.isRecommended, label: `${selectedRoute.name} • ${selectedRoute.distanceKm} km` }
    : null;
  const mapFailedLine = result?.roadConsequence.routeCompromised && selectedRoute
    ? { coordinates: selectedRoute.coordinates, label: 'CURRENT ROUTE COMPROMISED UNDER SCENARIO' }
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F7F9] overflow-hidden">
      <div className="bg-white border-b border-[#DDE2E7] px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Sliders className="w-4 h-4 text-[#1D4E89]" />COUNTERFACTUAL DISASTER SIMULATION</div>
          <div className="text-[10px] text-[#5F6877] mt-1">PROTOTYPE COUNTERFACTUAL ESTIMATE • Scenario results are decision-support estimates and do not guarantee that a landslide will occur.</div>
        </div>
        <div className="flex gap-1.5 text-[10px]">
          <button onClick={() => onNavigateTab('impact')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Impact</button>
          <button onClick={() => onNavigateTab('roads')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Roads</button>
          <button onClick={() => onNavigateTab('shelters')} className="px-2 py-1 border border-[#DDE2E7] rounded text-[#1D4E89] cursor-pointer">Shelters</button>
        </div>
      </div>

      <div className="bg-white border-b border-[#DDE2E7] px-4 py-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <div><span className="text-[#5F6877] block">Location</span><strong>{selectedLocation.name}</strong></div>
        <div><span className="text-[#5F6877] block">District / State</span><strong>{selectedLocation.district}, {selectedLocation.state}</strong></div>
        <div><span className="text-[#5F6877] block">Current Risk</span><strong className="text-red-700">{selectedLocation.riskScore}% • {selectedLocation.riskLevel}</strong></div>
        <div><span className="text-[#5F6877] block">Rainfall / Soil Moisture</span><strong>{selectedLocation.rainfall24hMm} mm / {selectedLocation.soilMoisturePct}%</strong></div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <aside className="w-full lg:w-[340px] bg-white border-r border-[#DDE2E7] overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-bold text-xs uppercase tracking-wider text-[#172033]">Scenario Controls</h2><span className="text-[9px] font-bold text-[#1D4E89] border border-[#B8D5E5] bg-[#EBF3FA] px-1.5 py-0.5 rounded">SOFTWARE-ONLY</span></div>
          <div>
            <label className="font-semibold text-xs block mb-1">Rainfall Change: +{input.rainfallChangePct}%</label>
            <input aria-label="Rainfall change" type="range" min="0" max="50" step="5" value={input.rainfallChangePct} onChange={(event) => updateInput('rainfallChangePct', Number(event.target.value))} className="w-full accent-[#1D4E89]" />
            <div className="flex justify-between text-[9px] text-[#5F6877]"><span>+0%</span><span>+10%</span><span>+25%</span><span>+50%</span></div>
          </div>
          <div>
            <label className="font-semibold text-xs block mb-1">Soil Moisture Change: {input.soilMoistureChangePct > 0 ? '+' : ''}{input.soilMoistureChangePct}%</label>
            <input aria-label="Soil moisture change" type="range" min="-20" max="30" step="5" value={input.soilMoistureChangePct} onChange={(event) => updateInput('soilMoistureChangePct', Number(event.target.value))} className="w-full accent-[#1D4E89]" />
          </div>
          <label className="font-semibold text-xs block">Rainfall Memory<select value={input.rainfallMemory} onChange={(event) => updateInput('rainfallMemory', event.target.value as RainfallMemoryLevel)} className="mt-1 w-full border border-[#DDE2E7] rounded p-1.5 font-normal"><option>LOW</option><option>MODERATE</option><option>HIGH</option><option>VERY HIGH</option></select></label>
          <label className="font-semibold text-xs block">Drainage Condition<select value={input.drainageCondition} onChange={(event) => updateInput('drainageCondition', event.target.value as DrainageCondition)} className="mt-1 w-full border border-[#DDE2E7] rounded p-1.5 font-normal"><option>NORMAL</option><option>PARTIALLY RESTRICTED</option><option>BLOCKED / DISRUPTED</option></select></label>
          <label className="font-semibold text-xs block">Road Failure Scenario<select value={input.roadFailure} onChange={(event) => updateInput('roadFailure', event.target.value as RoadFailureScenario)} className="mt-1 w-full border border-[#DDE2E7] rounded p-1.5 font-normal"><option>NONE</option><option>SELECTED ROAD FAILS</option><option>CRITICAL CORRIDOR FAILS</option></select></label>
          <label className="font-semibold text-xs block">Forecast Window<select value={input.forecastWindow} onChange={(event) => updateInput('forecastWindow', event.target.value as CounterfactualScenarioInput['forecastWindow'])} className="mt-1 w-full border border-[#DDE2E7] rounded p-1.5 font-normal"><option>+6H</option><option>+12H</option><option>+24H</option></select></label>
          <div className="flex gap-2 pt-2 border-t border-[#DDE2E7]"><button onClick={handleRun} disabled={isRunning} className="flex-1 bg-[#1D4E89] text-white rounded px-3 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"><Play className="inline w-3 h-3 mr-1" />RUN SCENARIO</button><button onClick={handleReset} className="px-3 border border-[#DDE2E7] rounded text-[#5F6877] cursor-pointer" title="Reset to baseline"><RotateCcw className="w-3.5 h-3.5" /></button></div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {result && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-[#DDE2E7] rounded p-3"><span className="text-[10px] font-bold text-[#5F6877] block">BASELINE</span><strong className="text-xl text-[#172033]">{result.baselineRisk}%</strong><span className="ml-2 text-xs">{result.baselineRiskLevel}</span></div>
                <div className="bg-white border border-[#DDE2E7] rounded p-3"><span className="text-[10px] font-bold text-[#5F6877] block">SCENARIO</span><strong className="text-xl text-red-700">{result.scenarioRisk}%</strong><span className="ml-2 text-xs">{result.scenarioRiskLevel}</span></div>
              </div>
              <div className="bg-white border border-[#DDE2E7] rounded p-3 text-xs"><strong>Risk Change:</strong> {formatDelta(result.scenarioRisk - result.baselineRisk)} percentage points <span className="ml-3"><strong>Trend:</strong> {result.trend}</span><div className="text-[10px] text-[#5F6877] mt-1">SCENARIO DRIVER EXPLANATION: {result.drivers.join(' • ')}</div></div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">{[['Affected Population', result.impacts.affectedPopulation], ['Settlements at Risk', result.impacts.settlementsAtRisk], ['Roads at Risk', result.impacts.roadsAtRisk], ['Shelter Demand', result.impacts.shelterDemand]].map(([label, item]) => { const value = item as { baseline: number; scenario: number; delta: number }; return <div key={label as string} className="bg-white border border-[#DDE2E7] rounded p-2"><span className="text-[10px] text-[#5F6877] block">{label as string}</span><strong>{value.baseline.toLocaleString('en-IN')} → {value.scenario.toLocaleString('en-IN')}</strong><span className="block text-red-700 text-[10px]">{formatDelta(value.delta)}</span></div>; })}</div>
              <div className="grid md:grid-cols-2 gap-2"><div className="bg-white border border-[#DDE2E7] rounded p-3 text-xs"><h3 className="font-bold mb-2 flex items-center gap-1"><Route className="w-3.5 h-3.5 text-[#1D4E89]" />ROAD / ROUTE CONSEQUENCE</h3><p>{result.roadConsequence.affectedRoadName || 'No selected road failure'}</p><p className="text-[#5F6877]">{result.roadConsequence.previousStatus || 'Current status unavailable'} → {result.roadConsequence.scenarioStatus || 'No change'}</p><p className={result.roadConsequence.reroutingRequired ? 'text-red-700 font-bold mt-1' : 'text-emerald-700 mt-1'}>{result.roadConsequence.reroutingRequired ? 'CURRENT ROUTE: COMPROMISED UNDER SCENARIO • REROUTING REQUIRED' : 'Current route consequence not triggered'}</p></div><div className="bg-white border border-[#DDE2E7] rounded p-3 text-xs"><h3 className="font-bold mb-2">SHELTER CONSEQUENCE</h3><p>Current recommended capacity: <strong>{result.shelterConsequence.currentRecommendedCapacity.toLocaleString('en-IN')}</strong></p><p>Projected remaining capacity: <strong>{result.shelterConsequence.projectedRemainingCapacity.toLocaleString('en-IN')}</strong></p><p className={result.shelterConsequence.additionalShelterRequired ? 'text-red-700 font-bold mt-1' : 'text-emerald-700 mt-1'}>{result.shelterConsequence.additionalShelterRequired ? 'Additional shelter may be required.' : 'Current capacity remains within this estimate.'}</p></div></div>
              <div className="bg-[#EBF3FA] border border-[#B8D5E5] rounded p-3 text-xs"><strong>RESPONSE URGENCY:</strong> {result.responseUrgency.baseline} → {result.responseUrgency.scenario}<p className="text-[10px] text-[#5F6877] mt-1">{result.disclaimer}</p></div>
            </div>
          )}
          <div className="flex-1 min-h-[360px] bg-[#E5E9EC] relative"><NERLeafletMap selectedState={selectedState} selectedDistrict={selectedDistrict} locations={locations} roads={roads} shelters={shelters} fieldReports={fieldReports} layerToggles={layerToggles} onToggleLayer={(key) => setLayerToggles((current) => ({ ...current, [key]: !current[key] }))} selectedLocationId={selectedLocation.id} onSelectLocation={onSelectLocation} activeRouteLine={mapRouteLine} activeRouteFailedLine={mapFailedLine} emergencyMode={Boolean(result)} /></div>
        </section>
      </div>
    </div>
  );
};
