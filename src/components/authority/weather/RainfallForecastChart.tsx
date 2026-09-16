import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { CloudRain } from 'lucide-react';

interface Props {
  forecast: { time: string; predictedMm: number }[];
}

export const RainfallForecastChart: React.FC<Props> = ({ forecast }) => {
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <CloudRain className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Predicted Rainfall Forecast (Next 24h - 72h)
          </h4>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-[#1D4E89] border border-blue-200">
          IMD GFS / OPEN-METEO
        </span>
      </div>

      <div className="flex-1 min-h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={forecast} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                        Forecast: {payload[0].value} mm
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="predictedMm" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
