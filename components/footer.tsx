"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useNewReport, markReportSeen } from "@/hooks/use-new-report"
import { LATEST_LIBRARY_REPORT } from "@/lib/latest-library-report"
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Database,
  ExternalLink,
  CheckCircle2,
  FileText,
  Mail,
  BookOpen,
} from "lucide-react"

// ── Navigation structure ──────────────────────────────────────────────────────

const columns = [
  {
    heading: "Product",
    links: [
      { label: "AI Copilot", href: "/chat" },
      { label: "Areas Intelligence", href: "/areas" },
      { label: "Developer Profiles", href: "/developers" },
      { label: "Properties", href: "/properties" },
      { label: "Market Data", href: "/top-data" },
      { label: "Reports Library", href: "/reports/library" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Partners & APIs", href: "/docs/partners-apis" },
      { label: "AI Tools", href: "/ai" },
      { label: "Pricing", href: "/plans" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Data & Research",
    links: [
      { label: "Dubai Land Department", href: "/docs/data-information" },
      { label: "Source of Truth Registry", href: "/docs/source-of-truth-registry" },
      { label: "Generated Reports", href: "/reports/generated" },
      { label: "Investor KPI Audit", href: "/docs/investor-metrics-audit" },
      { label: "Articles", href: "/docs/articles" },
      { label: "Market Score", href: "/market-score" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Investor Relations", href: "/investor-relations" },
      { label: "Careers", href: "/careers" },
      { label: "Industry", href: "/docs/industry" },
      { label: "Media", href: "/media" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Data Usage", href: "/data-usage" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Status", href: "/status" },
      { label: "Support", href: "/support" },
    ],
  },
]

const trustBadges = [
  { icon: Database, label: "DLD Data Sourced", sub: "Dubai Land Department" },
  { icon: ShieldCheck, label: "SOC 2 Compliant", sub: "Data security standards" },
  { icon: CheckCircle2, label: "Verified Listings", sub: "Cross-referenced records" },
  { icon: MapPin, label: "UAE Market Focus", sub: "Dubai · Abu Dhabi · Sharjah" },
]

// ── Social icons (inline SVG) ─────────────────────────────────────────────────

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Footer() {
  const { report, dismiss } = useNewReport()
  const [reportEmailSent, setReportEmailSent] = useState(false)
  const [reportSending, setReportSending] = useState(false)

  // Library report email state
  const [libraryEmail, setLibraryEmail] = useState("")
  const [libraryEmailSent, setLibraryEmailSent] = useState(false)
  const [libraryEmailSending, setLibraryEmailSending] = useState(false)

  const handleEmailReport = async () => {
    if (!report || reportSending) return
    setReportSending(true)
    try {
      await fetch(`/api/reports/${report.id}/email`, { method: "POST" })
      setReportEmailSent(true)
      markReportSeen(report.id)
    } catch {
      setReportEmailSent(true)
    } finally {
      setReportSending(false)
    }
  }

  const handleLibraryEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!libraryEmail.trim() || libraryEmailSending) return
    setLibraryEmailSending(true)
    try {
      await fetch("/api/library-report/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: libraryEmail }),
      })
      setLibraryEmailSent(true)
      setLibraryEmail("")
    } catch {
      setLibraryEmailSent(true)
    } finally {
      setLibraryEmailSending(false)
    }
  }

  return (
    <footer className="border-t border-border/60 bg-background">

      {/* ── CTA / Newsletter strip ─────────────────────────────────────── */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-6 py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div className="max-w-lg">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                Decision Intelligence Platform
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Built for professionals who need precision, not noise.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Market coverage, project evidence, and investor-first workflows for UAE real estate operators. Backed by live DLD data.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
                >
                  Open Copilot
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  View Plans
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Talk to Sales
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — report card OR newsletter, never both */}
            <div className="w-full max-w-sm shrink-0">
              {report && !reportEmailSent ? (
                /* ── New report available ── */
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Report ready</p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground leading-snug">
                          {report.title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(report.id)}
                      className="mt-0.5 shrink-0 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                    Your AI-generated report is saved in your library. Want a copy sent directly to your inbox?
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleEmailReport}
                      disabled={reportSending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {reportSending ? "Sending…" : "Email me this report"}
                    </button>
                    <Link
                      href={`/reports/${report.publicId}`}
                      onClick={() => dismiss(report.id)}
                      className="flex items-center justify-center rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      View
                    </Link>
                  </div>

                  <p className="mt-3 text-[10px] text-muted-foreground/40">
                    Generated {new Date(report.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                    {" · "}
                    <Link href="/account/reports" className="underline underline-offset-2 hover:text-muted-foreground/60">
                      All reports
                    </Link>
                  </p>
                </div>
              ) : reportEmailSent ? (
                /* ── Email sent confirmation ── */
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Report on its way</p>
                      <p className="text-xs text-muted-foreground">Check your inbox shortly.</p>
                    </div>
                  </div>
                  <Link
                    href="/account/reports"
                    className="text-xs text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground"
                  >
                    View all reports →
                  </Link>
                </div>
              ) : (
                /* ── Default: latest published library report ── */
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Latest Report</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/50">{LATEST_LIBRARY_REPORT.date} · {LATEST_LIBRARY_REPORT.category}</p>
                    </div>
                  </div>

                  <p className="mb-1 font-serif text-sm font-medium leading-snug text-foreground line-clamp-2">
                    {LATEST_LIBRARY_REPORT.title}
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {LATEST_LIBRARY_REPORT.subtitle}
                  </p>

                  {/* Read button */}
                  <Link
                    href={LATEST_LIBRARY_REPORT.href}
                    className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-secondary/60"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    Open &amp; read report
                  </Link>

                  {/* Email form */}
                  {libraryEmailSent ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <p className="text-xs text-emerald-400">Report sent — check your inbox.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleLibraryEmail} className="flex gap-2">
                      <input
                        type="email"
                        value={libraryEmail}
                        onChange={(e) => setLibraryEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="submit"
                        disabled={libraryEmailSending}
                        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        {libraryEmailSending ? "…" : "Email me"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust badges ──────────────────────────────────────────────── */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 text-muted-foreground/60">
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="mx-1.5 text-muted-foreground/30">·</span>
                  <span className="text-[11px] text-muted-foreground/50">{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main link grid ────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-5 flex items-center gap-2">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="h-3 w-3 rounded-sm bg-foreground" />
                <div className="h-3 w-3 rounded-sm bg-foreground/50" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
              </div>
              <span className="text-base font-medium tracking-tight text-foreground">entrestate</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The decision infrastructure for UAE real estate — market data, project intelligence, and investor workflows in one place.
            </p>
            <div className="mt-5 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_2px_rgba(52,211,153,0.4)]" />
              <span className="text-[11px] text-muted-foreground/60">All systems operational</span>
              <Link href="/status" className="ml-1 text-[11px] text-muted-foreground/40 underline underline-offset-2 hover:text-muted-foreground">
                Status
              </Link>
            </div>

            {/* Social links */}
            <div className="mt-5 flex items-center gap-2.5">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground/60 transition-colors hover:border-border hover:text-foreground"
              >
                <LinkedInIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground/60 transition-colors hover:border-border hover:text-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground/60 transition-colors hover:border-border hover:text-foreground"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Region badge */}
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card/40 px-2.5 py-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/60">Dubai, United Arab Emirates</span>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <p className="text-[11px] text-muted-foreground/50">
                &copy; {new Date().getFullYear()} Entrestate Technologies. All rights reserved.
              </p>
              <span className="hidden text-muted-foreground/20 sm:inline">·</span>
              <p className="text-[11px] text-muted-foreground/40">
                Registered in the United Arab Emirates
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Cookies", href: "/cookies" },
                { label: "Sitemap", href: "/sitemap.xml" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="hidden sm:block w-px h-3 bg-border/40" />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}
