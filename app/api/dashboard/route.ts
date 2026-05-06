import { NextResponse } from "next/server";
import { API_BASE_URL, getDurationMinutes, isBillable } from "@/lib/billing";
import type { Activity, BillableEntry } from "@/lib/types";

export async function GET() {
  try {
    const [activityResponse, billingResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/activities`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/billing/entries`, { cache: "no-store" }),
    ]);

    if (!activityResponse.ok || !billingResponse.ok) {
      throw new Error("Backend dashboard requests failed");
    }

    const activities = (await activityResponse.json()) as Activity[];
    const entries = (await billingResponse.json()) as BillableEntry[];

    return NextResponse.json({
      totalActivities: activities.length,
      totalHours: activities.reduce((sum, activity) => sum + getDurationMinutes(activity), 0) / 60,
      totalBillableHours:
        activities.filter(isBillable).reduce((sum, activity) => sum + getDurationMinutes(activity), 0) /
        60,
      estimatedRevenue: entries.reduce((sum, entry) => sum + entry.totalCost, 0),
      recentActivities: activities.slice(0, 5),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard summary" }, { status: 500 });
  }
}
