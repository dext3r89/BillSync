import { NextResponse } from "next/server";
import { API_BASE_URL, getDurationMinutes } from "@/lib/billing";
import type { Activity } from "@/lib/types";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/activities`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Backend activities request failed");
    }

    const activities = (await response.json()) as Activity[];
    const matterMap = new Map<string, Activity[]>();

    activities.forEach((activity) => {
      const key = activity.matter || "Unassigned matter";
      matterMap.set(key, [...(matterMap.get(key) || []), activity]);
    });

    const matters = Array.from(matterMap.entries()).map(([matter, matterActivities], index) => ({
      id: `matter-${index + 1}`,
      name: matter,
      clientName: matterActivities[0]?.client || "Unassigned client",
      totalHours:
        matterActivities.reduce((sum, activity) => sum + getDurationMinutes(activity), 0) / 60,
      activityCount: matterActivities.length,
    }));

    return NextResponse.json(matters);
  } catch {
    return NextResponse.json({ error: "Failed to load matters" }, { status: 500 });
  }
}
