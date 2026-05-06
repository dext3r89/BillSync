import type { Activity, BillableEntry, CurrencyCode } from "@/lib/types";

export const API_BASE_URL = "http://localhost:3001";
export const DEFAULT_INCREMENT = 6;
export const DEFAULT_RATE_PER_UNIT = 100;

export function isBillable(activity: Activity) {
  return activity.billable === true || activity.billable === 1;
}

export function getDurationMinutes(activity: Activity) {
  const start = new Date(activity.start_time);
  const end = new Date(activity.end_time);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 60000));
}

export function calculateUnits(durationMinutes: number, increment = DEFAULT_INCREMENT) {
  const safeIncrement = Math.max(1, Number(increment) || DEFAULT_INCREMENT);

  if (durationMinutes <= 0) {
    return 0;
  }

  return Math.ceil(durationMinutes / safeIncrement);
}

function parseMetadata(activity: Activity) {
  if (!activity.metadata) {
    return {};
  }

  if (typeof activity.metadata === "object") {
    return activity.metadata as Record<string, unknown>;
  }

  try {
    return JSON.parse(activity.metadata) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function convertActivityToBillable(
  activity: Activity,
  ratePerUnit: number,
  increment = DEFAULT_INCREMENT
): BillableEntry {
  const metadata = parseMetadata(activity);
  const type = String(activity.type || activity.task_type || "").toLowerCase();

  if (type === "sms" || type === "whatsapp") {
    const units = Math.max(1, Math.ceil(Number(metadata.quantity || 1)));
    const safeRate = Math.max(0, Number(metadata.ratePerUnit || 40));

    return {
      activityId: activity.id,
      client_name: activity.client || "Unassigned client",
      client: activity.client || "Unassigned client",
      matter_id: activity.matter || "Unassigned matter",
      matter: activity.matter || "Unassigned matter",
      date: getActivityDate(activity),
      type: activity.type,
      taskType: activity.task_type || activity.type || "other",
      narration: activity.narration || `${activity.type || "Activity"} work`,
      confidence: Number(activity.confidence || 0),
      durationMinutes: 0,
      billedMinutes: 0,
      units,
      ratePerUnit: safeRate,
      totalCost: units * safeRate,
      billingMethod: "unit",
      isManual: activity.isManual === true || activity.isManual === 1,
    };
  }

  const durationMinutes = getDurationMinutes(activity);
  const units = calculateUnits(durationMinutes, increment);
  const billedMinutes = units * Math.max(1, Number(increment) || DEFAULT_INCREMENT);
  const safeRate = Math.max(0, Number(ratePerUnit) || 0);

  return {
    activityId: activity.id,
    client_name: activity.client || "Unassigned client",
    client: activity.client || "Unassigned client",
    matter_id: activity.matter || "Unassigned matter",
    matter: activity.matter || "Unassigned matter",
    date: getActivityDate(activity),
    type: activity.type,
    taskType: activity.task_type || activity.type || "other",
    narration: activity.narration || `${activity.type || "Activity"} work`,
    confidence: Number(activity.confidence || 0),
    durationMinutes,
    billedMinutes,
    units,
    ratePerUnit: safeRate,
    totalCost: units * safeRate,
    billingMethod: "duration",
    isManual: activity.isManual === true || activity.isManual === 1,
  };
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(currency === "ZAR" ? "en-ZA" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getConfidencePercent(confidence?: number | null) {
  const value = Number(confidence || 0);
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

export function getActivityDate(activity: Activity) {
  return activity.start_time.split("T")[0] || "";
}

export function getActivityTime(activity: Activity, key: "start_time" | "end_time") {
  const date = new Date(activity[key]);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
