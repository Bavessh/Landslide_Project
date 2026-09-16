import React, { useState } from 'react';
import { MonitoredLocation, RoadSegment } from '../../types';
import { intelligenceService } from '../../services/intelligenceService';
import { Sliders, AlertTriangle, ArrowRight, X, Play, RotateCcw } from 'lucide-react';

interface Props {
  location: MonitoredLocation;
  roads: RoadSegment[];
  isOpen: boolean;
  onClose: () => void;
}

export const WhatIfSimulationModal: React.FC<Props> = ({
  location,
  roads,
  isOpen,
  onClose
}) => {
  const [rainfallDelta, setRainfallDelta] = useState<number>(30);
  const [selectedRoadBlock, setSelectedRoadBlock] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<{
    simulatedScore: number;
    simulatedLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    affectedPopulationDelta: number;
    cascadingNotes: string;
    routeSevered: boolean;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    const res = await intelligenceService.runWhatIfSimulation(location.id, {
      additionalRainfallMm: rainfallDelta,
      simulateBlockedRoadId: selectedRoadBlock || undefined
    });
    setSimulationResult(res);
    setIsSimulating(false);
  };

  const handleReset = () => {
    setRainfallDelta(30);
    setSelectedRoadBlock('');
    setSimulationResult(null);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-md border border-[#DDE2E7] shadow-xl w-full max-w-lg overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-4 bg-[#1D4E89] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-300" />
            <h3 className="font-bold text-sm">Counterfactual "What-If" Disaster Simulation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="bg-[#F8F9FA] p-3 rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] block text-[11px]">Target Monitored Slope:</span>
            <strong className="text-sm text-[#172033]">{location.name}</strong>
            <p className="text-[#5F6877] text-[11px] mt-0.5">
              Current Baseline: {location.riskLevel} ({location.riskScore}%) • 24h Rain: {location.rainfall24hMm}mm
            </p>
          </div>

          {/* Scenario Parameters */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="rainfall-slider" className="font-semibold text-[#172033]">
                  Simulated Additional Rainfall Window (+mm in 6h):
                </label>
                <span className="font-mono font-bold text-sm text-[#1D4E89]">+{rainfallDelta} mm</span>
              </div>
              <input
                id="rainfall-slider"
                type="range"
                min="0"
                max="120"
                step="5"
                value={rainfallDelta}
                onChange={(e) => setRainfallDelta(Number(e.target.value))}
                className="w-full accent-[#1D4E89] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5F6877]">
                <span>0 mm (No additional)</span>
                <span>+50 mm (Heavy Cloudburst)</span>
                <span>+120 mm (Extreme Monsoon Event)</span>
              </div>
            </div>

            <div>
              <label htmlFor="road-block-select" className="font-semibold text-[#172033] block mb-1">
                Simulate Structural Lifeline Failure / Road Blockage:
              </label>
              <select
                id="road-block-select"
                value={selectedRoadBlock}
                onChange={(e) => setSelectedRoadBlock(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#DDE2E7] rounded p-2 text-xs text-[#172033] focus:ring-1 focus:ring-[#1D4E89]"
              >
                <option value="">No road failure simulated (normal road state)</option>
                {roads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.name} ({r.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Simulation Output */}
          {simulationResult && (
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded space-y-2.5">
              <div className="font-bold text-xs uppercase text-[#1D4E89] flex items-center justify-between">
                <span>Simulation Outcomes:</span>
                <span className="text-[10px] text-slate-500 font-mono">[PROTOTYPE MODEL INFERENCE]</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-[#5F6877] block">Simulated Risk Score</span>
                  <span
                    className={`font-black text-base ${
                      simulationResult.simulatedScore >= 85
                        ? 'text-red-700'
                        : simulationResult.simulatedScore >= 70
                        ? 'text-orange-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {simulationResult.simulatedScore}% ({simulationResult.simulatedLevel})
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    +{simulationResult.simulatedScore - location.riskScore}% escalation
                  </span>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-[#5F6877] block">Additional Exposed Persons</span>
                  <span className="font-black text-base text-[#172033]">
                    +{simulationResult.affectedPopulationDelta.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Requiring shelter allocation</span>
                </div>
              </div>

              <div className="text-[11px] text-[#172033] bg-white p-2 rounded border border-slate-200">
                <strong>Projected Cascading Failure:</strong> {simulationResult.cascadingNotes}
              </div>

              {simulationResult.routeSevered && (
                <div className="text-[11px] text-red-800 bg-red-50 p-2 rounded border border-red-200 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <span>Immediate evacuation rerouting required: primary arterial access severed under this scenario.</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            {simulationResult && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded border border-slate-300 text-[#5F6877] hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="bg-[#1D4E89] hover:bg-[#153966] text-white font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isSimulating ? 'Computing Stress Model...' : 'Execute What-If Model'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
