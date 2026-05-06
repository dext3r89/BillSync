"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface WeeklyChartProps {
  data: { day: string; billable: number; unbilled: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Weekly Hours</h3>
        <p className="text-xs text-muted-foreground">Billable vs unbilled time</p>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}h`, ""]}
            />
            <Bar
              dataKey="billable"
              name="Billable"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="unbilled"
              name="Unbilled"
              fill="oklch(0.68 0 0)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-accent" />
          <span className="text-xs text-muted-foreground">Billable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-muted-foreground/35" />
          <span className="text-xs text-muted-foreground">Unbilled</span>
        </div>
      </div>
    </div>
  );
}
