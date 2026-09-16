import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity } from 'lucide-react';

interface Props {
  comparisonData: { time: string; rainfallMm: number; riskScore: number }[];
}

export const RainfallRiskComparisonChart: React.FC<Props> = ({ comparisonData }) => {
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#1D4E89]" />
          <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Precipitation vs. Landslide Risk Correlation
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#5F6877]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2 bg-blue-300 rounded-xs"></span>
            <span>Rainfall (mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-red-600"></span>
            <span>Risk Score (%)</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5F6877' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#5F6877' }} unit="mm" />
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
                      <div className="font-bold">{label}</div>
                      <div className="text-blue-300">Rainfall: {item.rainfallMm} mm</div>
                      <div className="text-amber-400">Landslide Risk: {item.riskScore}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar yAxisId="left" dataKey="rainfallMm" fill="#93C5FD" barSize={16} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="riskScore"
              stroke="#DC2626"
              strokeWidth={2}
              dot={{ r: 3, fill: '#DC2626' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
