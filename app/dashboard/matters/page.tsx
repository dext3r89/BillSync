"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity, CurrencyCode } from "@/lib/types";
import {
  API_BASE_URL,
  DEFAULT_RATE_PER_UNIT,
  calculateUnits,
  formatCurrency,
  getDurationMinutes,
  isBillable,
} from "@/lib/billing";
import { Briefcase, Clock, DollarSign } from "lucide-react";

export default function MattersPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currency] = useState<CurrencyCode>("ZAR");
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/activities`);

        if (!response.ok) {
          throw new Error("Could not load matters");
        }

        setActivities(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Matters failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, []);

  const matters = useMemo(() => {
    const matterMap = new Map<string, Activity[]>();

    activities.forEach((activity) => {
      const matter = activity.matter || "Unassigned matter";
      matterMap.set(matter, [...(matterMap.get(matter) || []), activity]);
    });

    return Array.from(matterMap.entries()).map(([name, matterActivities]) => {
      const totalMinutes = matterActivities.reduce(
        (sum, activity) => sum + getDurationMinutes(activity),
        0
      );
      const revenue = matterActivities
        .filter(isBillable)
        .reduce(
          (sum, activity) => sum + calculateUnits(getDurationMinutes(activity), 6) * DEFAULT_RATE_PER_UNIT,
          0
        );

      return {
        name,
        client: matterActivities[0]?.client || "Unassigned client",
        hours: totalMinutes / 60,
        revenue,
        activityCount: matterActivities.length,
        status: matterActivities.some((activity) => {
          const activityDate = new Date(activity.start_time);
          const ageMs = Date.now() - activityDate.getTime();

          return !Number.isNaN(activityDate.getTime()) && ageMs <= 30 * 24 * 60 * 60 * 1000;
        })
          ? "active"
          : "inactive",
      };
    });
  }, [activities]);

  const clients = useMemo(
    () => Array.from(new Set(matters.map((matter) => matter.client))),
    [matters]
  );

  const filteredMatters = useMemo(() => {
    const term = search.trim().toLowerCase();

    return matters.filter((matter) => {
      const matchesSearch =
        !term ||
        matter.name.toLowerCase().includes(term) ||
        matter.client.toLowerCase().includes(term);

      return (
        matchesSearch &&
        (selectedClient === "all" || matter.client === selectedClient) &&
        (selectedStatus === "all" || matter.status === selectedStatus)
      );
    });
  }, [matters, search, selectedClient, selectedStatus]);

  const totalHours = matters.reduce((sum, matter) => sum + matter.hours, 0);
  const totalRevenue = matters.reduce((sum, matter) => sum + matter.revenue, 0);

  return (
    <>
      <TopBar title="Matters" subtitle="Matters derived from real captured activities" />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Matters</p>
              <p className="text-xl font-semibold">{loading ? "..." : matters.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Hours</p>
              <p className="text-xl font-semibold">{loading ? "..." : `${totalHours.toFixed(1)}h`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <DollarSign className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Estimated Revenue</p>
              <p className="text-xl font-semibold">
                {loading ? "..." : formatCurrency(totalRevenue, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_220px_180px]">
          <Input
            value={search}
            placeholder="Search by client or matter ID"
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Matter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Client
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Activities
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Hours
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMatters.map((matter) => (
                <tr key={matter.name}>
                  <td className="px-6 py-4 font-medium text-foreground">{matter.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{matter.client}</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="secondary">{matter.activityCount}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">{matter.hours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {formatCurrency(matter.revenue, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
