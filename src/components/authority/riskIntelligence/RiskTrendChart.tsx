import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { RiskTrendPoint } from '../../../types';
import { Activity, Info } from 'lucide-react';

interface Props {
  data: RiskTrendPoint[];
  locationName: string;
  adaptiveThreshold?: number;
}

export const RiskTrendChart: React.FC<Props> = ({
  data,
  locationName,
  adaptiveThreshold = 65
}) => {
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#1D4E89]" />
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Temporal Trajectory (Past 24h — Now — Next 24h)
            </h3>
          </div>
          <p className="text-[11px] text-[#5F6877] mt-0.5">
            Empirical historical telemetry aligned with predictive landslide escalation model for {locationName}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#1D4E89]"></span>
            <span className="text-[#5F6877]">Landslide Risk (%)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2 bg-[#93C5FD] rounded-xs"></span>
            <span className="text-[#5F6877]">Rainfall (mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 border-t border-dashed border-red-500"></span>
            <span className="text-[#5F6877]">Adaptive Threshold ({adaptiveThreshold}%)</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 10, fill: '#5F6877' }}
              axisLine={{ stroke: '#DDE2E7' }}
              tickLine={{ stroke: '#DDE2E7' }}
            />
            {/* Left Y Axis: Risk % */}
            <YAxis
              yAxisId="risk"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#5F6877' }}
              axisLine={{ stroke: '#DDE2E7' }}
              tickLine={{ stroke: '#DDE2E7' }}
              unit="%"
            />
            {/* Right Y Axis: Rainfall mm */}
            <YAxis
              yAxisId="rain"
              orientation="right"
              domain={[0, 'dataMax + 20']}
              tick={{ fontSize: 10, fill: '#5F6877' }}
              axisLine={false}
              tickLine={false}
              unit="mm"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as RiskTrendPoint;
                  return (
                    <div className="bg-[#172033] text-white p-2.5 rounded shadow-lg text-xs space-y-1 z-50">
                      <div className="font-bold border-b border-slate-700 pb-1 flex justify-between gap-4">
                        <span>Horizon: {label}</span>
                        <span className="text-slate-300 uppercase text-[10px]">{item.periodType}</span>
                      </div>
                      <div className="flex justify-between gap-4 pt-0.5">
                        <span className="text-slate-300">Landslide Risk:</span>
                        <span className="font-bold text-amber-400 font-mono">{item.riskScore}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-300">Rainfall Influx:</span>
                        <span className="font-mono text-blue-300">{item.rainfallMm} mm</span>
                      </div>
                      {item.confidenceMin !== undefined && (
                        <div className="flex justify-between gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                          <span>Confidence Bound:</span>
                          <span className="font-mono">{item.confidenceMin}% - {item.confidenceMax}%</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Background rainfall bars */}
            <Bar
              yAxisId="rain"
              dataKey="rainfallMm"
              fill="#93C5FD"
              opacity={0.65}
              barSize={18}
              name="Rainfall Influx (mm)"
            />

            {/* Vertical demarcation for NOW */}
            <ReferenceLine
              x="NOW"
              yAxisId="risk"
              stroke="#D97706"
              strokeWidth={2}
              label={{
                value: 'NOW (LIVE TIME)',
                position: 'top',
                fill: '#B45309',
                fontSize: 9,
                fontWeight: 700
              }}
            />

            {/* Adaptive threshold line */}
            <ReferenceLine
              y={adaptiveThreshold}
              yAxisId="risk"
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Risk Line with Confidence Area */}
            <Area
              yAxisId="risk"
              type="monotone"
              dataKey="riskScore"
              stroke="#1D4E89"
              strokeWidth={2.5}
              fill="rgba(29, 78, 137, 0.12)"
              dot={{ r: 3, fill: '#1D4E89', strokeWidth: 1, stroke: '#FFFFFF' }}
              activeDot={{ r: 5, fill: '#B45309' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-[#DDE2E7] flex items-center justify-between text-[10px] text-[#5F6877] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#1D4E89]" />
          <span>Shaded area marks AI risk progression. Solid vertical line divides observed history from projected outlook.</span>
        </div>
        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          PROTOTYPE RECHARTS ENGINE
        </span>
      </div>
    </div>
  );
};
