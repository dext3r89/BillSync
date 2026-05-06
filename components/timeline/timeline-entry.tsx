"use client";

import { cn } from "@/lib/utils";
import type { TimeEntry, ActivityType } from "@/lib/types";
import {
  Mail,
  FileText,
  Video,
  Phone,
  BookOpen,
  Gavel,
  MoreHorizontal,
  Check,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const activityIcons: Record<ActivityType, typeof Mail> = {
  email: Mail,
  document: FileText,
  meeting: Video,
  call: Phone,
  research: BookOpen,
  court: Gavel,
  other: MoreHorizontal,
};

const activityLabels: Record<ActivityType, string> = {
  email: "Email",
  document: "Document",
  meeting: "Meeting",
  call: "Phone Call",
  research: "Research",
  court: "Court",
  other: "Other",
};

interface TimelineEntryProps {
  entry: TimeEntry;
  onConfirm?: (id: string) => void;
  onEdit?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function TimelineEntry({
  entry,
  onConfirm,
  onEdit,
  onReject,
}: TimelineEntryProps) {
  const Icon = activityIcons[entry.activityType];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatAmount = (minutes: number, rate: number) => {
    const hours = minutes / 60;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(hours * rate);
  };

  const needsReview = entry.status === "captured";

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-5 transition-all",
        needsReview
          ? "border-warning/30 bg-warning/5 shadow-sm"
          : "border-border hover:shadow-sm"
      )}
    >
      {/* Status indicator line */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          entry.billable ? "bg-accent" : "bg-muted-foreground/30"
        )}
      />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            entry.billable
              ? "bg-accent/10 text-accent"
              : "bg-secondary text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-foreground">
                  {activityLabels[entry.activityType]}
                </h4>
                {needsReview && (
                  <Badge variant="outline" className="border-warning/50 text-warning-foreground bg-warning/10 text-xs">
                    Needs Review
                  </Badge>
                )}
                {entry.confidence < 90 && (
                  <span className="text-xs text-muted-foreground">
                    {entry.confidence}% confidence
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-foreground/80">
                {entry.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium">{entry.clientName}</span>
                <span className="text-border">|</span>
                <span>{entry.matterName}</span>
              </div>
            </div>

            {/* Time and Amount */}
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold text-foreground">
                {formatDuration(entry.duration)}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.startTime} - {entry.endTime}
              </p>
              {entry.billable && (
                <p className="mt-1 text-sm font-medium text-accent">
                  {formatAmount(entry.duration, entry.hourlyRate)}
                </p>
              )}
            </div>
          </div>

          {/* Footer with badges and actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  entry.billable
                    ? "bg-accent/10 text-accent hover:bg-accent/20"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {entry.billable ? "Billable" : "Non-billable"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                ${entry.hourlyRate}/hr
              </Badge>
              {entry.status === "confirmed" && (
                <Badge variant="secondary" className="text-xs bg-accent/10 text-accent">
                  <Check className="mr-1 h-3 w-3" />
                  Confirmed
                </Badge>
              )}
            </div>

            {needsReview && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onReject?.(entry.id)}
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => onEdit?.(entry.id)}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => onConfirm?.(entry.id)}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Confirm
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
