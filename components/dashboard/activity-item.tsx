import { cn } from "@/lib/utils";
import type { TimeEntry, ActivityType } from "@/lib/types";
import { Mail, FileText, Video, Phone, BookOpen, Gavel, MoreHorizontal } from "lucide-react";

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
  call: "Call",
  research: "Research",
  court: "Court",
  other: "Other",
};

interface ActivityItemProps {
  entry: TimeEntry;
  compact?: boolean;
}

export function ActivityItem({ entry, compact = false }: ActivityItemProps) {
  const Icon = activityIcons[entry.activityType];
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50",
        compact && "p-3"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          entry.billable ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={cn("font-medium text-foreground truncate", compact ? "text-sm" : "text-sm")}>
              {entry.description}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{entry.clientName}</span>
              <span className="text-border">|</span>
              <span>{entry.matterName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium text-foreground">
              {formatDuration(entry.duration)}
            </p>
            <p className="text-xs text-muted-foreground">
              {entry.startTime} - {entry.endTime}
            </p>
          </div>
        </div>

        {!compact && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                entry.billable
                  ? "bg-accent/10 text-accent"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {entry.billable ? "Billable" : "Non-billable"}
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {activityLabels[entry.activityType]}
            </span>
            {entry.status === "captured" && (
              <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning-foreground">
                Needs Review
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
