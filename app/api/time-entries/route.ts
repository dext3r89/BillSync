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
    const entries = activities.map((activity) => ({
      id: String(activity.id),
      matterName: activity.matter || "Unassigned matter",
      clientName: activity.client || "Unassigned client",
      activityType: activity.task_type || activity.type,
      description: activity.narration || `${activity.type} activity`,
      date: activity.start_time.split("T")[0],
      startTime: activity.start_time,
      endTime: activity.end_time,
      duration: getDurationMinutes(activity),
      billable: activity.billable === true || activity.billable === 1,
      confidence: activity.confidence || 0,
    }));

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to load time entries" }, { status: 500 });
  }
}
