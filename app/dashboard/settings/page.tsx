"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/billing";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Bot,
  FolderSearch,
  Mail,
  Download,
  RefreshCw,
  Save,
} from "lucide-react";

const currentUser = {
  name: "BillSync User",
  email: "user@billsync.local",
  role: "attorney",
  hourlyRate: 100,
};

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [autoCapture, setAutoCapture] = useState(true);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    outlookPolling: "inactive",
    documentTracker: "inactive",
  });

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);

        if (response.ok) {
          const status = await response.json();
          setSystemStatus({
            outlookPolling: status.outlookPolling || "inactive",
            documentTracker: status.documentTracker || "inactive",
          });
        }
      } catch {
        setSystemStatus({ outlookPolling: "inactive", documentTracker: "inactive" });
      }
    }

    loadStatus();
  }, []);

  function reconnectOutlook() {
    window.location.href = `${API_BASE_URL}/auth/microsoft`;
  }

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Bot className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Personal Information
              </h3>
              <p className="text-sm text-muted-foreground">
                Update your personal details
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={currentUser.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={currentUser.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue={currentUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attorney">Attorney</SelectItem>
                      <SelectItem value="paralegal">Paralegal</SelectItem>
                      <SelectItem value="secretary">Secretary</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    defaultValue={currentUser.hourlyRate}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Save className="mr-1.5 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Firm Information
              </h3>
              <p className="text-sm text-muted-foreground">
                Your organization details
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firm-name">Firm Name</Label>
                  <Input id="firm-name" defaultValue="BillSync Legal Services" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm-address">Address</Label>
                  <Input
                    id="firm-address"
                    defaultValue="123 Law Street, Suite 500, New York, NY 10001"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Email Notifications
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose what updates you receive via email
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Time Entry Reminders
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Get reminded to review captured time entries
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Weekly Digest
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Receive a weekly summary of your activity
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Invoice Notifications
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Get notified when invoices are paid or overdue
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Time Capture Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure automatic time capture behavior
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Auto-Capture Enabled
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Automatically capture time from emails, documents, and meetings
                    </p>
                  </div>
                  <Switch
                    checked={autoCapture}
                    onCheckedChange={setAutoCapture}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Duration</Label>
                  <Select defaultValue="6">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="6">6 minutes (0.1h)</SelectItem>
                      <SelectItem value="15">15 minutes (0.25h)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Activities shorter than this won&apos;t be captured
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Subscription Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your billing and subscription
              </p>

              <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Professional Plan</p>
                    <p className="text-sm text-muted-foreground">
                      $49/user/month - billed annually
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Upgrade
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground">
                  Included Features
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>- Unlimited time entries</li>
                  <li>- AI-powered time capture</li>
                  <li>- Invoicing & billing</li>
                  <li>- Analytics & reporting</li>
                  <li>- Priority support</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Payment Method
              </h3>

              <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Visa ending in 4242
                    </p>
                    <p className="text-xs text-muted-foreground">Expires 12/26</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">Password</h3>
              <p className="text-sm text-muted-foreground">
                Update your password regularly for security
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Update Password
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>

              <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {twoFactor ? "Enabled" : "Not enabled"}
                    </p>
                  </div>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Data Export
              </h3>
              <p className="text-sm text-muted-foreground">
                Download your data for compliance or backup
              </p>

              <div className="mt-6 flex gap-3">
                <Button variant="outline">
                  <Download className="mr-1.5 h-4 w-4" />
                  Export Time Entries
                </Button>
                <Button variant="outline">
                  <Download className="mr-1.5 h-4 w-4" />
                  Export Invoices
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Activity Intelligence
              </h3>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Enable AI Enhancement
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Improve low-confidence classifications where available
                    </p>
                  </div>
                </div>
                <Switch checked={aiEnhancement} onCheckedChange={setAiEnhancement} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Outlook Integration
              </h3>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {systemStatus.outlookPolling === "active" ? "Connected" : "Disconnected"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Microsoft Graph activity capture
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={reconnectOutlook}>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Reconnect
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">
                Document Tracker
              </h3>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center gap-3">
                  <FolderSearch className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {systemStatus.documentTracker === "active" ? "Active" : "Inactive"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Local chokidar watcher
                    </p>
                  </div>
                </div>
                <span
                  className={
                    systemStatus.documentTracker === "active"
                      ? "h-2.5 w-2.5 rounded-full bg-accent"
                      : "h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
