"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
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
import type { Activity } from "@/lib/types";
import {
  API_BASE_URL,
  formatDuration,
  getActivityDate,
  getActivityTime,
  getConfidencePercent,
  getDurationMinutes,
  isBillable,
} from "@/lib/billing";
import { AlertCircle, CheckCircle, Clock, DollarSign, Filter, X } from "lucide-react";

export default function TimelinePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedMatter, setSelectedMatter] = useState("all");
  const [selectedActivityType, setSelectedActivityType] = useState("all");
  const [selectedBillable, setSelectedBillable] = useState("all");
  const [sortOption, setSortOption] = useState("date_desc");
  const [reviewActivity, setReviewActivity] = useState<Activity | null>(null);
  const [reviewForm, setReviewForm] = useState({
    client: "",
    matter: "",
    narration: "",
    task_type: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/activities`);

        if (!response.ok) {
          throw new Error("Could not load activities");
        }

        setActivities(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Activities failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, []);

  const clients = useMemo(
    () => Array.from(new Set(activities.map((activity) => activity.client).filter(Boolean))) as string[],
    [activities]
  );

  const matters = useMemo(
    () => Array.from(new Set(activities.map((activity) => activity.matter).filter(Boolean))) as string[],
    [activities]
  );

  const activityTypes = useMemo(
    () => Array.from(new Set(activities.map((activity) => activity.task_type || activity.type).filter(Boolean))) as string[],
    [activities]
  );

  const filteredActivities = useMemo(() => {
    const filtered = activities.filter((activity) => {
      if (selectedClient !== "all" && activity.client !== selectedClient) {
        return false;
      }
      if (selectedMatter !== "all" && activity.matter !== selectedMatter) {
        return false;
      }
      if (
        selectedActivityType !== "all" &&
        (activity.task_type || activity.type) !== selectedActivityType
      ) {
        return false;
      }
      if (selectedBillable !== "all" && isBillable(activity) !== (selectedBillable === "true")) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "date_asc") {
        return a.start_time.localeCompare(b.start_time);
      }

      if (sortOption === "confidence") {
        return getConfidencePercent(a.confidence) - getConfidencePercent(b.confidence);
      }

      if (sortOption === "duration") {
        return getDurationMinutes(b) - getDurationMinutes(a);
      }

      return b.start_time.localeCompare(a.start_time);
    });
  }, [activities, selectedActivityType, selectedBillable, selectedClient, selectedMatter, sortOption]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};

    filteredActivities.forEach((activity) => {
      const date = getActivityDate(activity);
      groups[date] = groups[date] || [];
      groups[date].push(activity);
    });

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        if (sortOption === "date_asc") {
          return a.start_time.localeCompare(b.start_time);
        }

        if (sortOption === "confidence") {
          return getConfidencePercent(a.confidence) - getConfidencePercent(b.confidence);
        }

        if (sortOption === "duration") {
          return getDurationMinutes(b) - getDurationMinutes(a);
        }

        return b.start_time.localeCompare(a.start_time);
      });
    });

    return groups;
  }, [filteredActivities, sortOption]);

  const sortedDates = Object.keys(groupedActivities).sort((a, b) =>
    sortOption === "date_asc" ? a.localeCompare(b) : b.localeCompare(a)
  );

  const stats = useMemo(() => {
    const totalMinutes = filteredActivities.reduce(
      (sum, activity) => sum + getDurationMinutes(activity),
      0
    );
    const billableMinutes = filteredActivities
      .filter(isBillable)
      .reduce((sum, activity) => sum + getDurationMinutes(activity), 0);
    const needsReview = filteredActivities.filter(
      (activity) => getConfidencePercent(activity.confidence) < 75
    ).length;

    return {
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      needsReview,
      confirmed: filteredActivities.length - needsReview,
    };
  }, [filteredActivities]);

  const hasFilters =
    selectedClient !== "all" ||
    selectedMatter !== "all" ||
    selectedActivityType !== "all" ||
    selectedBillable !== "all";

  function clearFilters() {
    setSelectedClient("all");
    setSelectedMatter("all");
    setSelectedActivityType("all");
    setSelectedBillable("all");
  }

  function openReview(activity: Activity) {
    setReviewActivity(activity);
    setReviewForm({
      client: activity.client || "",
      matter: activity.matter || "",
      narration: activity.narration || "",
      task_type: activity.task_type || activity.type || "",
    });
  }

  async function saveReview(action: "save" | "confirm" | "decline") {
    if (!reviewActivity) {
      return;
    }

    const payload =
      action === "decline"
        ? { action: "decline" }
        : {
            ...reviewForm,
            confidence: action === "confirm" ? 1 : reviewActivity.confidence,
          };

    const response = await fetch(`${API_BASE_URL}/activities/${reviewActivity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Could not update activity review");
      return;
    }

    setActivities((current) =>
      current.map((activity) =>
        activity.id === reviewActivity.id
          ? {
              ...activity,
              ...reviewForm,
              billable: action === "decline" ? 0 : activity.billable,
              confidence: action === "confirm" ? 1 : activity.confidence,
            }
          : activity
      )
    );
    setReviewActivity(null);
  }

  return (
    <>
      <TopBar title="Activities" subtitle="Review real activity logs from SQLite" />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}. Check that the backend is running on {API_BASE_URL}.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-xl font-semibold">{loading ? "..." : `${stats.totalHours.toFixed(1)}h`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <DollarSign className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="text-xl font-semibold">{loading ? "..." : `${stats.billableHours.toFixed(1)}h`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <CheckCircle className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">High Confidence</p>
              <p className="text-xl font-semibold">{loading ? "..." : stats.confirmed}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <AlertCircle className="h-5 w-5 text-warning-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-xl font-semibold">{loading ? "..." : stats.needsReview}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
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
                <SelectValue placeholder="All matters" />
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

            <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
              <SelectTrigger>
                <SelectValue placeholder="All task types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All task types</SelectItem>
                {activityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBillable} onValueChange={setSelectedBillable}>
              <SelectTrigger>
                <SelectValue placeholder="All entries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entries</SelectItem>
                <SelectItem value="true">Billable only</SelectItem>
                <SelectItem value="false">Non-billable only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Date desc</SelectItem>
                <SelectItem value="date_asc">Date asc</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Loading activities...
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No activities found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Captured activities will appear here as soon as the backend stores them.
              </p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {groupedActivities[date].length} activities
                  </span>
                </div>

                <div className="space-y-3">
                  {groupedActivities[date].map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-lg border border-border bg-card p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-foreground">
                              {activity.task_type || activity.type}
                            </h4>
                            <Badge
                              variant="secondary"
                              className={
                                isBillable(activity)
                                  ? "bg-accent/10 text-accent hover:bg-accent/20"
                                  : "bg-secondary text-muted-foreground"
                              }
                            >
                              {isBillable(activity) ? "Billable" : "Non-billable"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getConfidencePercent(activity.confidence)}% confidence
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-foreground/80">
                            {activity.narration || `${activity.type} activity`}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {activity.client || "Unassigned client"} / {activity.matter || "Unassigned matter"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatDuration(getDurationMinutes(activity))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getActivityTime(activity, "start_time")} - {getActivityTime(activity, "end_time")}
                          </p>
                          {getConfidencePercent(activity.confidence) < 75 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => openReview(activity)}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-accent"
                          style={{ width: `${getConfidencePercent(activity.confidence)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={Boolean(reviewActivity)} onOpenChange={(open) => !open && setReviewActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Activity</DialogTitle>
            <DialogDescription>
              Confirm or correct the low-confidence classification.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="review-client">Client</Label>
              <Input
                id="review-client"
                value={reviewForm.client}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, client: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-matter">Matter</Label>
              <Input
                id="review-matter"
                value={reviewForm.matter}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, matter: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-task">Task Type</Label>
              <Input
                id="review-task"
                value={reviewForm.task_type}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, task_type: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-narration">Narration</Label>
              <Textarea
                id="review-narration"
                value={reviewForm.narration}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, narration: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => saveReview("decline")}>
              Decline
            </Button>
            <Button variant="secondary" onClick={() => saveReview("save")}>
              Edit & Save
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => saveReview("confirm")}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
