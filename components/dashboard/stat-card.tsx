import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "accent";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-shadow hover:shadow-sm",
        variant === "accent"
          ? "border-accent/20 bg-accent/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-accent" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            variant === "accent" ? "bg-accent/10" : "bg-secondary"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              variant === "accent" ? "text-accent" : "text-muted-foreground"
            )}
          />
        </div>
      </div>
    </div>
  );
}
