"use client";

import type { Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { FileText, ChevronRight } from "lucide-react";

interface InvoiceListProps {
  invoices: Invoice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function InvoiceList({ invoices, selectedId, onSelect }: InvoiceListProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const statusColors = {
    draft: "bg-secondary text-muted-foreground",
    pending: "bg-warning/10 text-warning-foreground",
    sent: "bg-accent/10 text-accent",
    paid: "bg-accent/10 text-accent",
    overdue: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <button
          key={invoice.id}
          onClick={() => onSelect(invoice.id)}
          className={cn(
            "w-full rounded-lg border p-4 text-left transition-all hover:shadow-sm",
            selectedId === invoice.id
              ? "border-accent bg-accent/5 shadow-sm"
              : "border-border bg-card hover:bg-secondary/50"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                selectedId === invoice.id ? "bg-accent/10" : "bg-secondary"
              )}
            >
              <FileText
                className={cn(
                  "h-5 w-5",
                  selectedId === invoice.id ? "text-accent" : "text-muted-foreground"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {invoice.invoiceNumber}
                </span>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", statusColors[invoice.status])}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-muted-foreground truncate">
                {invoice.clientName}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(invoice.total)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Due {format(parseISO(invoice.dueDate), "MMM d")}
                </span>
              </div>
            </div>

            <ChevronRight
              className={cn(
                "h-5 w-5 shrink-0 self-center",
                selectedId === invoice.id ? "text-accent" : "text-muted-foreground"
              )}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
