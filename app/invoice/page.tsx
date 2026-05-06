"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BillableEntry, CurrencyCode } from "@/lib/types";
import {
  API_BASE_URL,
  DEFAULT_INCREMENT,
  DEFAULT_RATE_PER_UNIT,
  calculateUnits,
  formatCurrency,
  formatDuration,
} from "@/lib/billing";
import { ArrowLeft, Download, FileText } from "lucide-react";

type MatterGroup = {
  matter: string;
  entries: BillableEntry[];
  totalUnits: number;
  totalMinutes: number;
  totalCost: number;
};

type ClientGroup = {
  client: string;
  matters: MatterGroup[];
  totalUnits: number;
  totalMinutes: number;
  totalCost: number;
};

function groupEntries(entries: BillableEntry[]): ClientGroup[] {
  const clients = new Map<string, Map<string, BillableEntry[]>>();

  entries.forEach((entry) => {
    if (!clients.has(entry.client)) {
      clients.set(entry.client, new Map());
    }

    const matters = clients.get(entry.client);
    matters?.set(entry.matter, [...(matters.get(entry.matter) || []), entry]);
  });

  return Array.from(clients.entries()).map(([client, matters]) => {
    const matterGroups = Array.from(matters.entries()).map(([matter, matterEntries]) => ({
      matter,
      entries: matterEntries,
      totalUnits: matterEntries.reduce((sum, entry) => sum + entry.units, 0),
      totalMinutes: matterEntries.reduce((sum, entry) => sum + entry.billedMinutes, 0),
      totalCost: matterEntries.reduce((sum, entry) => sum + entry.totalCost, 0),
    }));

    return {
      client,
      matters: matterGroups,
      totalUnits: matterGroups.reduce((sum, matter) => sum + matter.totalUnits, 0),
      totalMinutes: matterGroups.reduce((sum, matter) => sum + matter.totalMinutes, 0),
      totalCost: matterGroups.reduce((sum, matter) => sum + matter.totalCost, 0),
    };
  });
}

function toCsvValue(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function InvoicePage() {
  const [baseEntries, setBaseEntries] = useState<BillableEntry[]>([]);
  const [ratePerUnit, setRatePerUnit] = useState(DEFAULT_RATE_PER_UNIT);
  const [increment, setIncrement] = useState(DEFAULT_INCREMENT);
  const [currency, setCurrency] = useState<CurrencyCode>("ZAR");
  const [groupBy, setGroupBy] = useState<"client" | "matter">("client");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedMatter, setSelectedMatter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntries() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/billing/entries`);

        if (!response.ok) {
          throw new Error("Could not load invoice entries");
        }

        setBaseEntries(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invoice entries failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, []);

  const clients = useMemo(
    () => Array.from(new Set(baseEntries.map((entry) => entry.client))),
    [baseEntries]
  );

  const matters = useMemo(
    () => Array.from(new Set(baseEntries.map((entry) => entry.matter))),
    [baseEntries]
  );

  const entries = useMemo(() => {
    return baseEntries
      .filter((entry) => selectedClient === "all" || entry.client === selectedClient)
      .filter((entry) => selectedMatter === "all" || entry.matter === selectedMatter)
      .filter((entry) => !startDate || (entry.date || "") >= startDate)
      .filter((entry) => !endDate || (entry.date || "") <= endDate)
      .map((entry) => {
        if (entry.billingMethod === "unit") {
          return entry;
        }

        const units = calculateUnits(entry.durationMinutes, increment);
        const billedMinutes = units * increment;

        return {
          ...entry,
          units,
          billedMinutes,
          ratePerUnit,
          totalCost: units * ratePerUnit,
        };
      });
  }, [baseEntries, endDate, increment, ratePerUnit, selectedClient, selectedMatter, startDate]);

  const groupedEntries = useMemo(() => groupEntries(entries), [entries]);

  const matterGroupedEntries = useMemo(() => {
    const mattersByName = new Map<string, BillableEntry[]>();

    entries.forEach((entry) => {
      mattersByName.set(entry.matter, [...(mattersByName.get(entry.matter) || []), entry]);
    });

    return Array.from(mattersByName.entries()).map(([matter, matterEntries]) => ({
      matter,
      clients: groupEntries(matterEntries),
      totalUnits: matterEntries.reduce((sum, entry) => sum + entry.units, 0),
      totalMinutes: matterEntries.reduce((sum, entry) => sum + entry.billedMinutes, 0),
      totalCost: matterEntries.reduce((sum, entry) => sum + entry.totalCost, 0),
    }));
  }, [entries]);

  const totals = useMemo(
    () => ({
      units: entries.reduce((sum, entry) => sum + entry.units, 0),
      minutes: entries.reduce((sum, entry) => sum + entry.billedMinutes, 0),
      cost: entries.reduce((sum, entry) => sum + entry.totalCost, 0),
    }),
    [entries]
  );

  function exportGhostPracticeCsv() {
    const headers = [
      "client_name",
      "matter_id",
      "date",
      "narration",
      "units",
      "rate",
      "total_amount",
    ];
    const rows = entries.map((entry) => [
      entry.client_name || entry.client,
      entry.matter_id || entry.matter,
      entry.date || "",
      entry.narration,
      entry.units,
      entry.ratePerUnit,
      entry.totalCost,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => toCsvValue(value)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ghost-practice-billing-entries.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64">
        <TopBar title="Invoice Preview" subtitle="Grouped by client and matter from real billing entries" />

        <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/billing">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Billing
            </Button>
          </Link>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as "client" | "matter")}>
              <SelectTrigger>
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">By Client</SelectItem>
                <SelectItem value="matter">By Matter</SelectItem>
              </SelectContent>
            </Select>

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

            <Select value={selectedMatter} onValueChange={setSelectedMatter}>
              <SelectTrigger>
                <SelectValue placeholder="Matter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All matters</SelectItem>
                {matters.map((matter) => (
                  <SelectItem key={matter} value={matter}>
                    {matter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              aria-label="Start date"
              onChange={(event) => setStartDate(event.target.value)}
            />

            <Input
              type="date"
              value={endDate}
              aria-label="End date"
              onChange={(event) => setEndDate(event.target.value)}
            />

            <Input
              min="0"
              type="number"
              value={ratePerUnit}
              aria-label="Rate per unit"
              onChange={(event) => setRatePerUnit(Number(event.target.value) || 0)}
            />

            <Select value={String(increment)} onValueChange={(value) => setIncrement(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZAR">ZAR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={exportGhostPracticeCsv}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export Billing Entries - Ghost Practice Ready
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h1 className="text-2xl font-semibold text-foreground">BillSync Invoice</h1>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedClient === "all" ? "All clients" : selectedClient}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right text-sm">
              <div>
                <p className="text-muted-foreground">Units</p>
                <p className="font-semibold text-foreground">{totals.units}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hours</p>
                <p className="font-semibold text-foreground">{(totals.minutes / 60).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold text-accent">
                  {formatCurrency(totals.cost, currency)}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Loading invoice preview...
            </div>
          ) : groupedEntries.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No billable entries are available for this invoice.
            </div>
          ) : groupBy === "client" ? (
            <div className="space-y-8 pt-6">
              {groupedEntries.map((clientGroup) => (
                <section key={clientGroup.client} className="space-y-5">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">
                      Client
                    </Label>
                    <h2 className="text-lg font-semibold text-foreground">
                      {clientGroup.client}
                    </h2>
                  </div>

                  {clientGroup.matters.map((matterGroup) => (
                    <div
                      key={`${clientGroup.client}-${matterGroup.matter}`}
                      className="rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {matterGroup.matter}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {matterGroup.entries.length} entries
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-foreground">
                            {formatCurrency(matterGroup.totalCost, currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {matterGroup.totalUnits} units / {formatDuration(matterGroup.totalMinutes)}
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-border">
                        {matterGroup.entries.map((entry) => (
                          <div
                            key={entry.activityId || entry.narration}
                            className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1fr_80px_120px_120px]"
                          >
                            <p className="text-foreground">{entry.narration}</p>
                            <p className="text-muted-foreground md:text-right">
                              {entry.units} units
                            </p>
                            <p className="text-muted-foreground md:text-right">
                              {formatCurrency(entry.ratePerUnit, currency)}
                            </p>
                            <p className="font-medium text-foreground md:text-right">
                              {formatCurrency(entry.totalCost, currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-8 pt-6">
              {matterGroupedEntries.map((matterGroup) => (
                <section key={matterGroup.matter} className="space-y-5">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">
                      Matter
                    </Label>
                    <h2 className="text-lg font-semibold text-foreground">
                      {matterGroup.matter}
                    </h2>
                  </div>

                  {matterGroup.clients.map((clientGroup) => (
                    <div
                      key={`${matterGroup.matter}-${clientGroup.client}`}
                      className="rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {clientGroup.client}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {clientGroup.matters.flatMap((matter) => matter.entries).length} entries
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-foreground">
                            {formatCurrency(clientGroup.totalCost, currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {clientGroup.totalUnits} units / {formatDuration(clientGroup.totalMinutes)}
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-border">
                        {clientGroup.matters.flatMap((matter) => matter.entries).map((entry) => (
                          <div
                            key={entry.activityId || entry.narration}
                            className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1fr_80px_120px_120px]"
                          >
                            <p className="text-foreground">{entry.narration}</p>
                            <p className="text-muted-foreground md:text-right">
                              {entry.units} units
                            </p>
                            <p className="text-muted-foreground md:text-right">
                              {formatCurrency(entry.ratePerUnit, currency)}
                            </p>
                            <p className="font-medium text-foreground md:text-right">
                              {formatCurrency(entry.totalCost, currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
