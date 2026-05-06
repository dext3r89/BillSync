"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import type { Activity, BillableEntry, CurrencyCode } from "@/lib/types";
import {
  API_BASE_URL,
  formatCurrency,
  getDurationMinutes,
  isBillable,
} from "@/lib/billing";
import { BarChart3, Clock, DollarSign, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [entries, setEntries] = useState<BillableEntry[]>([]);
  const [currency] = useState<CurrencyCode>("ZAR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError(null);

        const [activityResponse, billingResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/activities`),
          fetch(`${API_BASE_URL}/billing/entries`),
        ]);

        if (!activityResponse.ok || !billingResponse.ok) {
          throw new Error("Could not load report data");
        }

        setActivities(await activityResponse.json());
        setEntries(await billingResponse.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Report data failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const stats = useMemo(() => {
    const totalMinutes = activities.reduce(
      (sum, activity) => sum + getDurationMinutes(activity),
      0
    );
    const billableMinutes = activities
      .filter(isBillable)
      .reduce((sum, activity) => sum + getDurationMinutes(activity), 0);
    const revenue = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const utilization = totalMinutes === 0 ? 0 : (billableMinutes / totalMinutes) * 100;

    return {
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      revenue,
      utilization,
    };
  }, [activities, entries]);

  const byTaskType = useMemo(() => {
    const taskMap = new Map<string, number>();

    activities.forEach((activity) => {
      const taskType = activity.task_type || activity.type || "other";
      taskMap.set(taskType, (taskMap.get(taskType) || 0) + getDurationMinutes(activity));
    });

    return Array.from(taskMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [activities]);

  return (
    <>
      <TopBar title="Reports" subtitle="Live activity and billing analytics" />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
            <DollarSign className="h-5 w-5 text-accent" />
            <p className="mt-3 text-sm text-muted-foreground">Estimated Revenue</p>
            <p className="text-2xl font-semibold">
              {loading ? "..." : formatCurrency(stats.revenue, currency)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Billable Hours</p>
            <p className="text-2xl font-semibold">
              {loading ? "..." : `${stats.billableHours.toFixed(1)}h`}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Utilization</p>
            <p className="text-2xl font-semibold">
              {loading ? "..." : `${stats.utilization.toFixed(0)}%`}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Captured Hours</p>
            <p className="text-2xl font-semibold">
              {loading ? "..." : `${stats.totalHours.toFixed(1)}h`}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Time by Task Type</h2>
          <div className="mt-5 space-y-4">
            {byTaskType.map(([taskType, minutes]) => {
              const percent = stats.totalHours === 0 ? 0 : (minutes / 60 / stats.totalHours) * 100;

              return (
                <div key={taskType}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{taskType}</span>
                    <span className="text-muted-foreground">{(minutes / 60).toFixed(1)}h</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
