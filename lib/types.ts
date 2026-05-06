export interface User {
  id: string;
  email: string;
  name: string;
  role: "attorney" | "paralegal" | "secretary" | "admin";
  hourlyRate: number;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Matter {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  status: "active" | "pending" | "closed";
  practiceArea: string;
  createdAt: string;
  totalHours: number;
  totalBilled: number;
}

export type ActivityType = "email" | "document" | "meeting" | "call" | "research" | "court" | "other";

export interface TimeEntry {
  id: string;
  userId: string;
  matterId: string;
  matterName: string;
  clientName: string;
  activityType: ActivityType;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  billable: boolean;
  status: "captured" | "confirmed" | "edited" | "rejected";
  confidence: number; // 0-100, for auto-captured entries
  hourlyRate: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  matterId: string;
  matterName: string;
  entries: TimeEntry[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  fees: number;
  total: number;
  status: "draft" | "pending" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
  notes?: string;
}

export interface DashboardSummary {
  todayHours: number;
  billableHours: number;
  unbillableHours: number;
  weeklyHours: number;
  pendingInvoices: number;
  pendingAmount: number;
  uncapturedActivities: number;
  recentActivity: TimeEntry[];
  weeklyTrend: { day: string; billable: number; unbillable: number }[];
}

export type CurrencyCode = "ZAR" | "USD";

export interface Activity {
  id: number;
  type: string;
  start_time: string;
  end_time: string;
  source?: string | null;
  metadata?: string | null;
  client?: string | null;
  matter?: string | null;
  task_type?: string | null;
  billable: number | boolean;
  confidence?: number | null;
  narration?: string | null;
  isManual?: number | boolean;
  created_at?: string;
  enriched_at?: string | null;
}

export interface BillableEntry {
  activityId?: number;
  client_name?: string;
  client: string;
  matter_id?: string;
  matter: string;
  date?: string;
  type?: string;
  taskType: string;
  narration: string;
  confidence?: number;
  durationMinutes: number;
  billedMinutes: number;
  units: number;
  ratePerUnit: number;
  totalCost: number;
  billingMethod?: "duration" | "unit";
  isManual?: boolean;
}

export interface ActivityStats {
  totalDailyActivities: number;
  averageConfidence: number;
  dailyHours: number;
}
