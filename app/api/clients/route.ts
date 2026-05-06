import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/billing";
import type { Activity } from "@/lib/types";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/activities`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Backend activities request failed");
    }

    const activities = (await response.json()) as Activity[];
    const clients = Array.from(
      new Set(activities.map((activity) => activity.client).filter(Boolean))
    ).map((name, index) => ({
      id: `client-${index + 1}`,
      name,
      matterCount: new Set(
        activities
          .filter((activity) => activity.client === name)
          .map((activity) => activity.matter)
          .filter(Boolean)
      ).size,
    }));

    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}
