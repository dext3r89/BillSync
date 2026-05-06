"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import type { Activity } from "@/lib/types";
import { API_BASE_URL, getDurationMinutes } from "@/lib/billing";
import { Briefcase, Clock, Users } from "lucide-react";

export default function ClientsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/activities`);

        if (!response.ok) {
          throw new Error("Could not load clients");
        }

        setActivities(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Clients failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, []);

  const clients = useMemo(() => {
    const clientMap = new Map<string, Activity[]>();

    activities.forEach((activity) => {
      const client = activity.client || "Unassigned client";
      clientMap.set(client, [...(clientMap.get(client) || []), activity]);
    });

    return Array.from(clientMap.entries()).map(([name, clientActivities]) => ({
      name,
      matterCount: new Set(clientActivities.map((activity) => activity.matter).filter(Boolean)).size,
      activityCount: clientActivities.length,
      hours: clientActivities.reduce((sum, activity) => sum + getDurationMinutes(activity), 0) / 60,
    }));
  }, [activities]);

  const totalMatters = clients.reduce((sum, client) => sum + client.matterCount, 0);

  return (
    <>
      <TopBar title="Clients" subtitle="Client list derived from captured activities" />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Clients</p>
              <p className="text-xl font-semibold">{loading ? "..." : clients.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <Briefcase className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Matters</p>
              <p className="text-xl font-semibold">{loading ? "..." : totalMatters}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Activities</p>
              <p className="text-xl font-semibold">{loading ? "..." : activities.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div key={client.name} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{client.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {client.activityCount} captured activities
                  </p>
                </div>
                <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                  {client.matterCount} matters
                </Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {client.hours.toFixed(1)} hours captured
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
