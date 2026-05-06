"use client";

import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Send, Printer, Scale } from "lucide-react";
import { format, parseISO } from "date-fns";

interface InvoicePreviewProps {
  invoice: Invoice;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDuration = (minutes: number) => {
    const hours = minutes / 60;
    return hours.toFixed(2);
  };

  const statusColors = {
    draft: "bg-secondary text-muted-foreground",
    pending: "bg-warning/10 text-warning-foreground border-warning/30",
    sent: "bg-accent/10 text-accent border-accent/30",
    paid: "bg-accent/10 text-accent border-accent/30",
    overdue: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Actions Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={statusColors[invoice.status]}
          >
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Due {format(parseISO(invoice.dueDate), "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export PDF
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Send className="mr-1.5 h-4 w-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="p-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Scale className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">BillSync Legal</h2>
                <p className="text-sm text-muted-foreground">Legal Services</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-foreground">INVOICE</h1>
              <p className="mt-1 text-lg font-medium text-accent">{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                From
              </p>
              <div className="mt-2 text-sm text-foreground">
                <p className="font-medium">BillSync Legal Services</p>
                <p className="text-muted-foreground">123 Law Street, Suite 500</p>
                <p className="text-muted-foreground">New York, NY 10001</p>
                <p className="text-muted-foreground">billing@billsync.com</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bill To
              </p>
              <div className="mt-2 text-sm text-foreground">
                <p className="font-medium">{invoice.clientName}</p>
                <p className="text-muted-foreground">{invoice.matterName}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Invoice Date</p>
              <p className="mt-1 text-sm font-medium">
                {format(parseISO(invoice.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="mt-1 text-sm font-medium">
                {format(parseISO(invoice.dueDate), "MMM d, yyyy")}
              </p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3">
              <p className="text-xs text-muted-foreground">Amount Due</p>
              <p className="mt-1 text-sm font-bold text-accent">
                {formatCurrency(invoice.total)}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="mt-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hours
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Rate
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.entries.map((entry) => (
                  <tr key={entry.id} className="text-sm">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.matterName}</p>
                    </td>
                    <td className="py-3 text-center text-muted-foreground">
                      {format(parseISO(entry.date), "MMM d")}
                    </td>
                    <td className="py-3 text-right text-foreground">
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      ${entry.hourlyRate}/hr
                    </td>
                    <td className="py-3 text-right font-medium text-foreground">
                      {formatCurrency((entry.duration / 60) * entry.hourlyRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({(invoice.taxRate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Filing Fees</span>
                  <span className="font-medium">{formatCurrency(invoice.fees)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-base font-semibold">Total Due</span>
                <span className="text-xl font-bold text-accent">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 rounded-lg bg-secondary/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Notes
              </p>
              <p className="mt-2 text-sm text-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Thank you for your business. Payment is due within 30 days.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Questions? Contact billing@billsync.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
