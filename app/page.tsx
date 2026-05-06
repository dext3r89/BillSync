import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Scale,
  Clock,
  FileText,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Automated Time Capture",
    description:
      "Automatically captures time spent on emails, documents, meetings, and calls. No more manual timesheets.",
  },
  {
    icon: FileText,
    title: "Smart Invoice Generation",
    description:
      "Generate professional invoices with one click. Itemized entries, custom rates, and instant delivery.",
  },
  {
    icon: Zap,
    title: "AI-Powered Classification",
    description:
      "Intelligent activity detection assigns the right matter and billing code automatically.",
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description:
      "Built for legal industry standards. Secure, auditable, and compliant with bar requirements.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track billable hours, revenue, and productivity with comprehensive reporting dashboards.",
  },
  {
    icon: CheckCircle,
    title: "Easy Review & Approval",
    description:
      "Review auto-captured entries, confirm or edit with a single click. Full audit trail included.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">BillSync</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                Log In
              </Link>
            </Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">
                Trusted by 500+ law firms worldwide
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
              Time Capture and Billing,{" "}
              <span className="text-accent">Automated</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Stop losing billable hours. BillSync automatically captures your work
              across emails, documents, and meetings, then generates professional
              invoices in seconds.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8" asChild>
                <Link href="/dashboard">
                  View Dashboard Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-10">
              <div>
                <p className="text-3xl font-bold text-foreground">95%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Time capture accuracy
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">6hrs</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saved per attorney weekly
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">23%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  More billable hours captured
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for Modern Law Firms
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to capture time, manage billing, and grow your
              practice. No complexity, just results.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-primary p-8 md:p-12 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Ready to capture more billable time?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Join hundreds of law firms already using BillSync to streamline
                their billing workflow.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8"
                  asChild
                >
                  <Link href="/dashboard">
                    Explore the Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Scale className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">BillSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BillSync Legal Technologies. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
