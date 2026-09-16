import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { CloudRain } from 'lucide-react';

interface Props {
  hourlyData: { time: string; rainfallMm: number }[];
  locationName: string;
}

export const RainfallTimelineChart: React.FC<Props> = ({ hourlyData, locationName }) => {
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <CloudRain className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Hourly Rainfall Timeline (Past 24h)
          </h4>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
          HOURLY TELEMETRY
        </span>
      </div>

      <div className="flex-1 min-h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5F6877' }} />
            <YAxis tick={{ fontSize: 9, fill: '#5F6877' }} unit="mm" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#172033] text-white p-2 rounded shadow text-xs">
                      <div className="font-bold">{label}</div>
                      <div className="text-blue-300 font-mono">
                        Rainfall: {payload[0].value} mm/h
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rainfallMm"
              stroke="#2563EB"
              fill="#93C5FD"
              fillOpacity={0.4}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
