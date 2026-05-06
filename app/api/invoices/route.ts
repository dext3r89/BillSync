import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/billing";
import type { BillableEntry } from "@/lib/types";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/billing/entries`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Backend billing request failed");
    }

    const entries = (await response.json()) as BillableEntry[];
    const invoiceGroups = new Map<string, BillableEntry[]>();

    entries.forEach((entry) => {
      const key = `${entry.client} / ${entry.matter}`;
      invoiceGroups.set(key, [...(invoiceGroups.get(key) || []), entry]);
    });

    const invoices = Array.from(invoiceGroups.entries()).map(([name, invoiceEntries], index) => ({
      id: `invoice-${index + 1}`,
      invoiceNumber: `LIVE-${String(index + 1).padStart(4, "0")}`,
      name,
      entries: invoiceEntries,
      total: invoiceEntries.reduce((sum, entry) => sum + entry.totalCost, 0),
      status: "draft",
    }));

    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Invoice persistence is not implemented yet. Use /invoice for live preview." },
    { status: 501 }
  );
}
