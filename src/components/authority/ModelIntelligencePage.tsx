import React from 'react';
import { MonitoredLocation, NERState } from '../../types';
import { DataTruthfulnessBadge } from '../common/DataTruthfulnessBadge';
import { RiskBadge } from '../common/RiskBadge';
import { BrainCircuit, Database, Info, ShieldCheck } from 'lucide-react';
import { formatMetric, isFiniteMetric } from '../../utils/dataNormalization';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  selectedLocation: MonitoredLocation | null;
  backendConnected: boolean | null;
}

const MODEL_FEATURES = [
  '24-hour rainfall',
  '7-day rainfall',
  'Soil moisture',
  'Elevation',
  'Slope angle',
  'Previous landslides within 5 km',
  'Distance to previous landslide'
];

export const ModelIntelligencePage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  selectedLocation,
  backendConnected
}) => {
  const candidateLocations = locations
    .filter((location) => selectedState === 'ALL' || location.state === selectedState)
    .filter((location) => selectedDistrict === 'ALL' || location.district.toLowerCase() === selectedDistrict.toLowerCase())
    .sort((a, b) => b.riskScore - a.riskScore);

  const active = selectedLocation || candidateLocations[0] || null;

  const availabilityFields = active
    ? [active.riskScore, active.rainfall24hMm, active.soilMoisturePct, active.elevationM, active.slopeAngleDeg]
    : [];
  const availableCount = availabilityFields.filter(isFiniteMetric).length;
  const displayCompleteness = availabilityFields.length > 0
    ? Math.round((availableCount / availabilityFields.length) * 100)
    : 0;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F6F7F9] p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
              <BrainCircuit className="w-4 h-4 text-[#1D4E89]" />
              MODEL INTELLIGENCE
            </div>
            <p className="text-xs text-[#5F6877] mt-1">
              Current model-output metadata and data availability. No training metrics are invented when unavailable.
            </p>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded border font-semibold ${
            backendConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {backendConnected ? 'MODEL API REACHABLE' : 'MODEL API UNAVAILABLE'}
          </span>
        </div>

        {!active ? (
          <div className="bg-white border border-[#DDE2E7] rounded-md p-8 text-center text-sm text-[#5F6877]">
            No monitored location is available for model inspection.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 bg-white border border-[#DDE2E7] rounded-md p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#5F6877] uppercase">Active prediction location</span>
                    <h2 className="font-bold text-base text-[#172033] mt-1">{active.name}</h2>
                    <p className="text-xs text-[#5F6877]">{active.district}, {active.state}</p>
                  </div>
                  <RiskBadge level={active.riskLevel} score={active.riskScore} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                  <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded p-3">
                    <span className="text-[10px] text-[#5F6877] block">Probability</span>
                    <strong className="text-sm">{formatMetric(
                      isFiniteMetric(active.riskProbability)
                        ? active.riskProbability! * (active.riskProbability! <= 1 ? 100 : 1)
                        : active.riskScore,
                      '%'
                    )}</strong>
                  </div>
                  <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded p-3">
                    <span className="text-[10px] text-[#5F6877] block">Model version</span>
                    <strong className="text-sm">{active.modelVersion || 'Unavailable'}</strong>
                  </div>
                  <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded p-3">
                    <span className="text-[10px] text-[#5F6877] block">Prediction window</span>
                    <strong className="text-sm">{active.predictionWindow || 'Unavailable'}</strong>
                  </div>
                  <div className="bg-[#F8F9FA] border border-[#DDE2E7] rounded p-3">
                    <span className="text-[10px] text-[#5F6877] block">Confidence</span>
                    <strong className="text-sm">
                      {isFiniteMetric(active.riskConfidence)
                        ? formatMetric(active.riskConfidence! * (active.riskConfidence! <= 1 ? 100 : 1), '%')
                        : 'Unavailable'}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <DataTruthfulnessBadge provenance={active.dataProvenance} />
                  <span className="text-[10px] text-[#5F6877]">
                    Prediction timestamp: {active.riskTimestamp || active.lastUpdated || 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#DDE2E7] rounded-md p-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#1D4E89]" />
                  <h3 className="font-bold text-xs text-[#172033]">DISPLAY DATA COMPLETENESS</h3>
                </div>
                <strong className="text-2xl block mt-3">{displayCompleteness}%</strong>
                <p className="text-[10px] text-[#5F6877] mt-1">
                  This is only completeness of fields currently available to this UI, not model confidence or model accuracy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white border border-[#DDE2E7] rounded-md p-4">
                <h3 className="font-bold text-xs text-[#172033] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1D4E89]" />
                  VERIFIED MODEL INPUT CONTRACT
                </h3>
                <div className="mt-3 space-y-2">
                  {MODEL_FEATURES.map((feature) => (
                    <div key={feature} className="text-xs px-3 py-2 bg-[#F8F9FA] border border-[#DDE2E7] rounded">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#DDE2E7] rounded-md p-4">
                <h3 className="font-bold text-xs text-[#172033] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#1D4E89]" />
                  OUTPUT TRUTHFULNESS
                </h3>
                <div className="mt-3 space-y-3 text-xs text-[#172033]">
                  <div className="border border-emerald-200 bg-emerald-50 rounded p-3">
                    <strong className="block text-emerald-800">REAL MODEL OUTPUT</strong>
                    <span className="text-[11px] text-emerald-900">
                      Backend risk probability, score, level, version and timestamp are shown only when returned by the project API.
                    </span>
                  </div>
                  <div className="border border-amber-200 bg-amber-50 rounded p-3">
                    <strong className="block text-amber-800">PROTOTYPE EXPLANATION</strong>
                    <span className="text-[11px] text-amber-900">
                      Forecast, SHAP-style explanation, adaptive thresholds and related decision-support calculations remain prototype logic unless explicitly replaced by backend model output.
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5F6877]">
                    Accuracy, precision, recall, F1, ROC-AUC, training row count and experiment metrics are intentionally not displayed because this frontend repository does not verify those values.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
