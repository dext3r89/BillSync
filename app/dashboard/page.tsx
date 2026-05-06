"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Activity, ActivityStats, BillableEntry, CurrencyCode } from "@/lib/types";
import {
  API_BASE_URL,
  formatCurrency,
  formatDuration,
  getActivityDate,
  getActivityTime,
  getConfidencePercent,
  getDurationMinutes,
  isBillable,
} from "@/lib/billing";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [entries, setEntries] = useState<BillableEntry[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [currency] = useState<CurrencyCode>("ZAR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [activityResponse, billingResponse, statsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/activities`),
          fetch(`${API_BASE_URL}/billing/entries`),
          fetch(`${API_BASE_URL}/activities/stats`),
        ]);

        if (!activityResponse.ok) {
          throw new Error("Could not load activities");
        }

        if (!billingResponse.ok) {
          throw new Error("Could not load billing entries");
        }

        if (!statsResponse.ok) {
          throw new Error("Could not load activity stats");
        }

        setActivities(await activityResponse.json());
        setEntries(await billingResponse.json());
        setActivityStats(await statsResponse.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dashboard data failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const billableActivities = activities.filter(isBillable);
    const totalMinutes = activities.reduce(
      (sum, activity) => sum + getDurationMinutes(activity),
      0
    );
    const billableMinutes = entries.reduce(
      (sum, entry) => sum + entry.billedMinutes,
      0
    );
    const estimatedRevenue = entries.reduce(
      (sum, entry) => sum + entry.totalCost,
      0
    );
    const needsReview = activities.filter(
      (activity) => getConfidencePercent(activity.confidence) < 75
    ).length;

    return {
      totalActivities: activities.length,
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      estimatedRevenue,
      billableActivities: billableActivities.length,
      needsReview,
      averageConfidence: getConfidencePercent(activityStats?.averageConfidence),
      totalDailyActivities: activityStats?.totalDailyActivities || 0,
      dailyHours: activityStats?.dailyHours || 0,
    };
  }, [activities, activityStats, entries]);

  const dailyRequirement = useMemo(() => {
    const minimumHours = 5.6;
    const progress = Math.min(100, (stats.dailyHours / minimumHours) * 100);

    return {
      minimumHours,
      progress,
      isBelow: stats.dailyHours < minimumHours,
    };
  }, [stats.dailyHours]);

  const weeklyTrend = useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = new Map<string, { day: string; billable: number; unbilled: number }>();

    activities.forEach((activity) => {
      const date = new Date(activity.start_time);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = getActivityDate(activity);
      const existing = buckets.get(key) || {
        day: dayLabels[date.getDay()],
        billable: 0,
        unbilled: 0,
      };
      const hours = getDurationMinutes(activity) / 60;

      if (isBillable(activity)) {
        existing.billable += hours;
      } else {
        existing.unbilled += hours;
      }

      buckets.set(key, existing);
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, value]) => ({
        day: value.day,
        billable: Number(value.billable.toFixed(2)),
        unbilled: Number(value.unbilled.toFixed(2)),
      }));
  }, [activities]);

  const recentActivities = activities.slice(0, 5);

  return (
    <>
      <TopBar title="Dashboard" subtitle="Live activity and billing overview" />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total Activities"
            value={loading ? "..." : stats.totalActivities}
            subtitle={`${stats.totalHours.toFixed(1)}h captured`}
            icon={Clock}
            variant="accent"
          />
          <StatCard
            title="Daily Activities"
            value={loading ? "..." : stats.totalDailyActivities}
            subtitle="Captured today"
            icon={Clock}
          />
          <StatCard
            title="Billable Hours"
            value={loading ? "..." : `${stats.billableHours.toFixed(1)}h`}
            subtitle={`${stats.billableActivities} billable activities`}
            icon={TrendingUp}
          />
          <StatCard
            title="Estimated Revenue"
            value={loading ? "..." : formatCurrency(stats.estimatedRevenue, currency)}
            subtitle="From rounded billable units"
            icon={DollarSign}
          />
          <StatCard
            title="Avg Confidence"
            value={loading ? "..." : `${stats.averageConfidence}%`}
            subtitle="Across activities"
            icon={TrendingUp}
          />
          <StatCard
            title="Needs Review"
            value={loading ? "..." : stats.needsReview}
            subtitle="Confidence below 75%"
            icon={AlertCircle}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Recent Activities
                </h2>
                <p className="text-sm text-muted-foreground">
                  Latest captured records from SQLite
                </p>
              </div>
              <Link href="/dashboard/timeline">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                  Loading activities...
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                  No activities have been captured yet.
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {activity.narration || `${activity.type} activity`}
                          </p>
                          {isBillable(activity) && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              Billable
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.client || "Unassigned client"} / {activity.matter || "Unassigned matter"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm">
                        <p className="font-medium text-foreground">
                          {formatDuration(getDurationMinutes(activity))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getActivityTime(activity, "start_time")} - {getActivityTime(activity, "end_time")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{ width: `${getConfidencePercent(activity.confidence)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getConfidencePercent(activity.confidence)}% confidence
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <WeeklyChart data={weeklyTrend} />

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Daily Requirement
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum {dailyRequirement.minimumHours.toFixed(1)} hours/day
                  </p>
                </div>
                <span
                  className={
                    dailyRequirement.isBelow
                      ? "text-sm font-medium text-warning-foreground"
                      : "text-sm font-medium text-accent"
                  }
                >
                  {stats.dailyHours.toFixed(1)}h
                </span>
              </div>
              <Progress
                value={dailyRequirement.progress}
                className="mt-4 bg-secondary [&>div]:bg-accent"
              />
              {dailyRequirement.isBelow && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Today is tracking below the daily target.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Invoice Summary
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Billable entries</span>
                  <span className="font-medium text-foreground">{entries.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total units</span>
                  <span className="font-medium text-foreground">
                    {entries.reduce((sum, entry) => sum + entry.units, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preview total</span>
                  <span className="font-medium text-accent">
                    {formatCurrency(stats.estimatedRevenue, currency)}
                  </span>
                </div>
              </div>
              <Link href="/invoice">
                <Button className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <FileText className="mr-1.5 h-4 w-4" />
                  Preview Invoice
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
