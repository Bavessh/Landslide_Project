import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { RainfallMemoryData } from '../../../types';
import { BrainCircuit, Info, AlertTriangle, Droplets } from 'lucide-react';

interface Props {
  data: RainfallMemoryData;
}

export const RainfallMemoryCard: React.FC<Props> = ({ data }) => {
  const getStatusBadge = () => {
    switch (data.status) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Rainfall Memory (Antecedent Saturation Model)
            </h4>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#1D4E89] border border-blue-200">
            PROTOTYPE RAINFALL MEMORY
          </span>
        </div>

        {/* Status and Metric Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Current Antecedent Memory:</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-xl font-bold font-mono text-blue-900">
                {data.currentValueMm} mm
              </strong>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getStatusBadge()}`}>
                {data.status} MEMORY
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Peak Prior Influx:</span>
            <strong className="text-lg font-bold font-mono text-[#172033] mt-0.5 block">
              {data.peakPastRainfallMm} mm / 24h
            </strong>
          </div>

          <div className="p-2.5 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
            <span className="text-[#5F6877] text-[10px] block">Subsurface Dissipation Rate:</span>
            <span className="text-[11px] text-[#172033] font-medium mt-0.5 block">
              {data.decayRateDescription}
            </span>
          </div>
        </div>

        {/* Recharts Visualization: Pulse Drops vs Memory Sustained */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#172033]">
              Dissociation Phenomenon: Falling Rain vs Sustained Risk
            </span>
            <div className="flex items-center gap-3 text-[10px] text-[#5F6877]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2 bg-blue-300 rounded-xs"></span>
                <span>Rainfall Intensity (mm)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue-700"></span>
                <span>Rainfall Memory (mm)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-red-600"></span>
                <span>Landslide Risk Score (%)</span>
              </span>
            </div>
          </div>

          <div className="h-[180px] w-full bg-slate-50 rounded border border-slate-200 p-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.timeSeries}
                margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748B' }} unit="mm" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#DC2626' }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#172033] text-white p-2 rounded shadow text-xs space-y-1">
                          <div className="font-bold border-b border-slate-700 pb-0.5">Timeline: {label}</div>
                          <div className="text-blue-300">Rainfall: {item.actualRainfallMm} mm</div>
                          <div className="text-blue-400">Antecedent Memory: {item.rainfallMemoryMm} mm</div>
                          <div className="text-amber-400">Landslide Risk: {item.landslideRiskScore}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="actualRainfallMm" fill="#93C5FD" barSize={14} />
                <ReferenceLine x="NOW" yAxisId="left" stroke="#D97706" strokeDasharray="3 3" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rainfallMemoryMm"
                  stroke="#1D4E89"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="landslideRiskScore"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mandatory Explanatory Block */}
      <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-950 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#1D4E89] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#1D4E89]">Critical Geological Guidance: </span>
            <span>{data.explanation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
