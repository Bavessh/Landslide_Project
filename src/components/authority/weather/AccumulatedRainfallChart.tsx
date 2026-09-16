import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Calendar } from 'lucide-react';

interface Props {
  accumulated: { period: string; mm: number; thresholdMm: number }[];
}

export const AccumulatedRainfallChart: React.FC<Props> = ({ accumulated }) => {
  return (
    <div className="bg-white border border-[#DDE2E7] rounded-md p-3.5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[#DDE2E7] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#1D4E89]" />
          <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            Cumulative Rainfall Influx (1h to 7d)
          </h4>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#5F6877] border border-slate-200">
          ANTECEDENT PERIODS
        </span>
      </div>

      <div className="flex-1 min-h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={accumulated} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#5F6877' }} />
            <YAxis tick={{ fontSize: 9, fill: '#5F6877' }} unit="mm" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#172033] text-white p-2 rounded shadow text-xs space-y-1">
                      <div className="font-bold">{label} Cumulative</div>
                      <div className="text-blue-300 font-mono">Influx: {item.mm} mm</div>
                      <div className="text-slate-300 text-[10px]">
                        Critical Trigger Threshold: {item.thresholdMm} mm
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="mm" radius={[4, 4, 0, 0]}>
              {accumulated.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.mm >= entry.thresholdMm ? '#DC2626' : '#1D4E89'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
