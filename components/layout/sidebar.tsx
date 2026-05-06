"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  Scale,
  ReceiptText,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Activity Tracking", href: "/dashboard/timeline", icon: Clock },
  { name: "Billing", href: "/billing", icon: ReceiptText },
  { name: "Invoice Preview", href: "/invoice", icon: FileText },
  { name: "Matters", href: "/dashboard/matters", icon: Briefcase },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Scale className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight">BillSync</span>
            <span className="block text-xs text-sidebar-foreground/60">Legal Billing</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Sarah Chen</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Attorney</p>
            </div>
            <Link
              href="/"
              className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
