'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartProps {
  categoryData: Array<{ name: string; count: number }>;
  timeSeriesData: Array<{ date: string; issues: number }>;
  severityData: Array<{ name: string; value: number; color: string }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

export function DashboardCharts({
  categoryData,
  timeSeriesData,
  severityData,
}: ChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Issues by Category */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-foreground">Issues by Category</h3>
          <p className="text-xs text-muted-foreground">Distribution across vulnerability types</p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#888888" />
              <YAxis tick={{ fontSize: 11 }} stroke="#888888" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Issues Over Time */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-foreground">Issues Trend (Last 30 Days)</h3>
          <p className="text-xs text-muted-foreground">Historical volume of flagged findings</p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" />
              <YAxis tick={{ fontSize: 11 }} stroke="#888888" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="issues"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Issues by Severity Donut */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-foreground">Severity Distribution</h3>
          <p className="text-xs text-muted-foreground">Proportion by risk rating</p>
        </div>
        <div className="h-60 w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-foreground">
              {severityData.reduce((acc, curr) => acc + curr.value, 0)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs mt-2">
          {severityData.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground capitalize text-[11px]">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
