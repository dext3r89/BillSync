"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BillableEntry, CurrencyCode } from "@/lib/types";
import {
  API_BASE_URL,
  DEFAULT_INCREMENT,
  DEFAULT_RATE_PER_UNIT,
  calculateUnits,
  formatCurrency,
  formatDuration,
  getConfidencePercent,
} from "@/lib/billing";
import { Calculator, FileText, Plus, Settings } from "lucide-react";

export default function BillingPage() {
  const [baseEntries, setBaseEntries] = useState<BillableEntry[]>([]);
  const [ratePerUnit, setRatePerUnit] = useState(DEFAULT_RATE_PER_UNIT);
  const [increment, setIncrement] = useState(DEFAULT_INCREMENT);
  const [currency, setCurrency] = useState<CurrencyCode>("ZAR");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    type: "SMS",
    client: "",
    matter: "",
    date: new Date().toISOString().split("T")[0],
    narration: "",
    duration: "",
    quantity: "1",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/billing/entries`);

      if (!response.ok) {
        throw new Error("Could not load billing entries");
      }

      setBaseEntries(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing entries failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  const entries = useMemo(() => {
    return baseEntries.map((entry) => {
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
  }, [baseEntries, increment, ratePerUnit]);

  async function saveManualEntry() {
    const response = await fetch(`${API_BASE_URL}/activities/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...manualForm,
        duration: Number(manualForm.duration || 0),
        quantity: Number(manualForm.quantity || 1),
      }),
    });

    if (!response.ok) {
      setError("Manual entry could not be saved");
      return;
    }

    setManualOpen(false);
    setManualForm({
      type: "SMS",
      client: "",
      matter: "",
      date: new Date().toISOString().split("T")[0],
      narration: "",
      duration: "",
      quantity: "1",
    });
    await loadEntries();
  }

  const totals = useMemo(
    () => ({
      units: entries.reduce((sum, entry) => sum + entry.units, 0),
      billedMinutes: entries.reduce((sum, entry) => sum + entry.billedMinutes, 0),
      cost: entries.reduce((sum, entry) => sum + entry.totalCost, 0),
    }),
    [entries]
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64">
        <TopBar title="Billing" subtitle="Convert real activities into rounded billable units" />

        <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="flex justify-end">
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => setManualOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            + Add Manual Entry
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Billing Settings</h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate per unit</Label>
                <Input
                  id="rate"
                  min="0"
                  type="number"
                  value={ratePerUnit}
                  onChange={(event) => setRatePerUnit(Number(event.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="increment">Increment</Label>
                <Select value={String(increment)} onValueChange={(value) => setIncrement(Number(value))}>
                  <SelectTrigger id="increment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZAR">ZAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/5 p-5">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Totals</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Units</span>
                <span className="font-medium">{totals.units}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billed time</span>
                <span className="font-medium">{formatDuration(totals.billedMinutes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-accent">
                  {formatCurrency(totals.cost, currency)}
                </span>
              </div>
            </div>
            <Link href="/invoice">
              <Button className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <FileText className="mr-1.5 h-4 w-4" />
                Invoice Preview
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Loading billable entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
              No billable activities are available yet.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.activityId || `${entry.client}-${entry.matter}-${entry.narration}`}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                        Billable
                      </Badge>
                      <Badge variant="secondary">{entry.taskType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {getConfidencePercent(entry.confidence)}% confidence
                      </span>
                    </div>
                    <h3 className="mt-3 font-medium text-foreground">
                      {entry.narration}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.client} / {entry.matter}
                    </p>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:w-[520px]">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="font-medium">{formatDuration(entry.durationMinutes)}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Billed</p>
                      <p className="font-medium">{formatDuration(entry.billedMinutes)}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Units</p>
                      <p className="font-medium">{entry.units}</p>
                    </div>
                    <div className="rounded-lg bg-accent/5 p-3">
                      <p className="text-xs text-muted-foreground">Cost</p>
                      <p className="font-medium text-accent">
                        {formatCurrency(entry.totalCost, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </main>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Entry</DialogTitle>
            <DialogDescription>
              Capture SMS, WhatsApp, or telephone work as a billable activity.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-type">Type</Label>
              <Select
                value={manualForm.type}
                onValueChange={(value) =>
                  setManualForm((current) => ({ ...current, type: value }))
                }
              >
                <SelectTrigger id="manual-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Telephone">Telephone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="manual-client">Client</Label>
                <Input
                  id="manual-client"
                  value={manualForm.client}
                  onChange={(event) =>
                    setManualForm((current) => ({ ...current, client: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manual-matter">Matter</Label>
                <Input
                  id="manual-matter"
                  value={manualForm.matter}
                  onChange={(event) =>
                    setManualForm((current) => ({ ...current, matter: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-date">Date</Label>
              <Input
                id="manual-date"
                type="date"
                value={manualForm.date}
                onChange={(event) =>
                  setManualForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-narration">Narration</Label>
              <Textarea
                id="manual-narration"
                value={manualForm.narration}
                onChange={(event) =>
                  setManualForm((current) => ({ ...current, narration: event.target.value }))
                }
              />
            </div>

            {manualForm.type === "Telephone" ? (
              <div className="grid gap-2">
                <Label htmlFor="manual-duration">Duration (minutes)</Label>
                <Input
                  id="manual-duration"
                  min="0"
                  type="number"
                  value={manualForm.duration}
                  onChange={(event) =>
                    setManualForm((current) => ({ ...current, duration: event.target.value }))
                  }
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="manual-quantity">Quantity</Label>
                <Input
                  id="manual-quantity"
                  min="1"
                  type="number"
                  value={manualForm.quantity}
                  onChange={(event) =>
                    setManualForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">Default rate: R40 per message.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={saveManualEntry}
            >
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
