"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", value: 40 },
  { month: "Feb", value: 65 },
  { month: "Mar", value: 58 },
  { month: "Apr", value: 80 },
  { month: "May", value: 74 },
  { month: "Jun", value: 92 },
];

export function RevenueAreaChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="fillGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#fillGold)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
