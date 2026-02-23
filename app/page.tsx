"use client"

import type { CSSProperties } from "react"
import Link from "next/link"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Check,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import { Manrope, Space_Grotesk } from "next/font/google"
import { cn } from "@/lib/utils"

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" })
const body = Manrope({ subsets: ["latin"], variable: "--font-body" })

const themeStyles: CSSProperties = {
  "--sand": "#F5F1E8",
  "--ink": "#0B0D12",
  "--jade": "#1F6F5B",
  "--sea": "#0EA5A2",
  "--sun": "#F4B04F",
  "--mist": "#DCE3EA",
  "--ember": "#F97316",
} as CSSProperties

const placeholderPrompts = [
  "Model leasing velocity for waterfront towers",
  "Generate an investor memo for the mid-market office portfolio",
  "Map tenant demand shifts across the uptown retail corridor",
  "Summarize zoning risks and compliance gaps for the next release",
]

const primarySurfaces = [
  {
    label: "Chat",
    href: "/chat",
    caption: "Conversational signals for pricing, delivery, and supply",
  },
  {
    label: "Search",
    href: "/search",
    caption: "Intent-aware filters on every inventory row",
  },
  {
    label: "Map",
    href: "/map",
    caption: "Spatial overlays, clusters, and live performance",
  },
]

const goldenPaths = [
  {
    title: "Opportunity Scan",
    description:
      "Pre-validated TableSpec JSON surfaces tier-aware leads without invoking an LLM. Fires instantly on click.",
    spec: "tablespecs/opportunity-scan.json",
  },
  {
    title: "Portfolio Gatekeeper",
    description:
      "TableSpec for risk vs reward with enforced tier gating. Static data ensures consistent answers every time.",
    spec: "tablespecs/portfolio-gatekeeper.json",
  },
  {
    title: "Time Table Reporter",
    description:
      "Delivery-ready TableSpec spins event timelines and yield forecasts with audited provenance for every row.",
    spec: "tablespecs/time-table-reporter.json",
  },
]

const trustSignals = [
  "24K+ deals tracked in the Decision Tunnel",
  "Tier gating enforced server-side",
  "Audit-ready provenance & run_id for every flow",
]

function AnimatedPlaceholder({ texts, className }: { texts: string[]; className?: string }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(80)

  useEffect(() => {
    const text = texts[currentTextIndex]

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < text.length) {
          setCurrentText(text.substring(0, currentText.length + 1))
          setTypingSpeed(80)
        } else {
          setIsDeleting(true)
          setTypingSpeed(900)
        }
      } else if (currentText.length > 0) {
        setCurrentText(text.substring(0, currentText.length - 1))
        setTypingSpeed(40)
      } else {
        setIsDeleting(false)
        setCurrentTextIndex((currentTextIndex + 1) % texts.length)
        setTypingSpeed(500)
      }
    }, typingSpeed)

    return () => window.clearTimeout(timeout)
  }, [currentText, currentTextIndex, isDeleting, texts, typingSpeed])

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function EntrestateLanding() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [jumpPrompt, setJumpPrompt] = useState<string | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  const prompts = [
    "Capital stack for urban mixed-use delivery",
    "Neighborhood yield scouting for suburban parcels",
    "Tenant success plan for adaptive reuse assets",
    "Operations playbook for the multifamily portfolio",
    "Liquidity report for a coastal resort transformation",
    "Market re-entry plan for the logistics corridor",
  ]

  const results = [
    {
      id: 1,
      name: "Harborview Mixed-Use Launch",
      location: "Quartermaster District",
      price: "Projected NOI $420k",
      yield: "12% IRR",
      status: "Capital ready",
      tags: ["Mixed-use", "Capital stack", "Investor memo"],
    },
    {
      id: 2,
      name: "Midtown Adaptive Reuse",
      location: "Fulton Warehouse Campus",
      price: "$3.8M reposition",
      yield: "14% stabilised yield",
      status: "Due diligence",
      tags: ["Redevelopment", "Permitting", "Tenant mix"],
    },
    {
      id: 3,
      name: "Sunbelt Logistics Park",
      location: "I-45 Corridor",
      price: "$260k/mo revenue",
      yield: "6.8% cap rate",
      status: "Operations live",
      tags: ["Industrial", "Lease renewals", "Ops playbook"],
    },
  ]

  const quickFilters = ["Leasing", "Investment", "Operations", "Development"]

  const handleSearch = (value?: string) => {
    const nextQuery = (value ?? searchQuery).trim()
    if (!nextQuery) return
    setSearchQuery(nextQuery)
    setShowResults(true)
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
  }

  const handlePromptClick = (prompt: string) => {
    setSearchQuery(prompt)
    setJumpPrompt(prompt)
    handleSearch(prompt)
    window.setTimeout(() => setJumpPrompt(null), 450)
  }

  const mapQuery = encodeURIComponent(searchQuery || "real estate opportunity map")
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=12&output=embed`

  return (
    <div
      className={cn("min-h-screen bg-[var(--sand)] text-[var(--ink)]", body.className)}
      style={themeStyles}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-[var(--sun)]/20 blur-3xl"></div>
          <div className="absolute top-40 -left-20 h-80 w-80 rounded-full bg-[var(--sea)]/15 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[var(--ember)]/15 blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_transparent_60%)]"></div>
        </div>

        <header className="relative z-10 px-6 md:px-12 pt-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[var(--ink)] text-[var(--sand)] flex items-center justify-center font-semibold">
                E
              </div>
              <div>
                <p className={cn("text-lg font-semibold", display.className)}>Entrestate</p>
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">Real Estate Intelligence OS</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-black/60">
              <button type="button" className="hover:text-black transition-colors">How it works</button>
              <button type="button" className="hover:text-black transition-colors">Playbooks</button>
              <button type="button" className="hover:text-black transition-colors">Tools</button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--sand)] text-sm hover:opacity-90 transition-opacity"
              >
                Request access
              </button>
            </div>
          </nav>
        </header>

        <main className="relative z-10 px-6 md:px-12 pb-20">
          <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-12 items-center pt-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-[var(--mist)] text-xs uppercase tracking-[0.3em] text-black/60">
                <Sparkles className="h-3.5 w-3.5 text-[var(--ember)]" />
                New market intelligence every minute
              </div>
              <h1 className={cn("text-4xl md:text-6xl font-semibold mt-6", display.className)}>
                The Entrestate intelligence bar with a live map of every deal.
              </h1>
              <p className="mt-4 text-lg text-black/60 max-w-xl">
                Entrestate blends property data, prompts, and toolchains into a single command flow. Describe the decision
                you need and watch the market radar update in real time.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-full border border-[var(--mist)] bg-white/80 px-5 py-3 text-xs uppercase tracking-[0.3em] text-black/60">
                <span className="font-semibold text-[var(--ink)]">Trust bar</span>
                <div className="flex flex-wrap items-center gap-3 text-[var(--ink)]/80">
                  {trustSignals.map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {primarySurfaces.map((surface) => (
                  <Link
                    key={surface.label}
                    href={surface.href}
                    className="group flex min-w-[180px] flex-col gap-1 rounded-2xl border border-black/10 bg-white/90 p-4 text-left transition hover:border-black/20 hover:shadow-lg"
                  >
                    <span className="text-sm font-semibold text-black">{surface.label}</span>
                    <span className="text-xs text-black/60">{surface.caption}</span>
                  </Link>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSearch()
                }}
                className="relative mt-8"
              >
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-black/50" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                    placeholder={searchFocused ? "" : "Search by tool, workflow, or revenue lane"}
                    className="w-full h-16 pl-14 pr-40 rounded-full bg-white border border-black/10 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--sea)]/40 transition-shadow"
                  />

                  {searchFocused && searchQuery === "" && (
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none">
                      <AnimatedPlaceholder texts={placeholderPrompts} />
                    </div>
                  )}

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-black/50 border-r border-black/10 pr-4"
                    >
                      <MapPin className="h-4 w-4 text-[var(--ember)]" />
                      Market map
                    </button>
                    <button
                      type="submit"
                      className="h-12 w-12 rounded-full bg-[var(--ink)] text-[var(--sand)] flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {searchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-black/10 rounded-3xl p-5 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.6)]"
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-black/50">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--ember)]" />
                        Smart prompts
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 mt-4">
                        {prompts.slice(0, 4).map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            className="group text-left px-4 py-3 rounded-2xl bg-[var(--sand)] border border-black/10 hover:border-black/20 transition-colors"
                            onClick={() => handlePromptClick(prompt)}
                          >
                            <span className="text-sm text-black/70 group-hover:text-black">{prompt}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                {prompts.map((prompt) => (
                  <motion.button
                    key={prompt}
                    type="button"
                    className="px-4 py-2 rounded-full bg-white/70 border border-black/10 text-sm text-black/70 hover:text-black transition-colors"
                    onClick={() => handlePromptClick(prompt)}
                    animate={
                      jumpPrompt === prompt
                        ? { y: [0, -8, 0], scale: [1, 1.03, 1] }
                        : { y: 0, scale: 1 }
                    }
                    transition={{ duration: 0.35 }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>

              <div className="mt-10 grid sm:grid-cols-3 gap-6 text-sm text-black/60">
                  {[
                    { value: "24/7", label: "Data coverage", detail: "Market feeds online" },
                    { value: "98%", label: "Signal accuracy", detail: "Calibrated weekly" },
                    { value: "3.2M SF", label: "Space tracked", detail: "Across 14 markets" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white border border-black/10 flex items-center justify-center text-[var(--ember)] font-semibold">
                      {stat.value}
                    </div>
                    <div>
                      <p className="text-base text-black">{stat.label}</p>
                      <p className="text-xs uppercase tracking-[0.25em] text-black/40">{stat.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <div className="rounded-3xl border border-black/10 bg-white/90 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-black/40">Golden paths</p>
                      <p className={cn("text-2xl font-semibold mt-1", display.className)}>
                        TableSpec-ready flows, no LLM on click.
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--sea)]">
                      Pre-validated TableSpec JSON fires instantly
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {goldenPaths.map((path) => (
                      <div key={path.title} className="rounded-2xl border border-black/10 bg-[var(--sand)] p-5 text-sm text-black">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-black">{path.title}</p>
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--jade)]">TableSpec</span>
                        </div>
                        <p className="mt-3 text-xs text-black/70">{path.description}</p>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[0.7rem]">
                          <span className="text-[var(--ink)]/70">{path.spec}</span>
                          <span className="text-[var(--ink)] font-semibold uppercase tracking-[0.3em]">
                            Static
                          </span>
                        </div>
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-[var(--ink)]"
                        >
                          Preview JSON
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-[32px] bg-white/80 border border-black/10 shadow-[0_30px_100px_-80px_rgba(15,23,42,0.6)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/50">Market pulse</p>
                    <p className={cn("text-2xl font-semibold mt-2", display.className)}>Market pulse health</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-[var(--ink)] text-[var(--sand)] flex items-center justify-center">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {[
                    { label: "Avg decision lead time", value: "38s", trend: "Intent → plan" },
                    { label: "Active assets modeled", value: "4,312", trend: "Across 8 markets" },
                    { label: "Confidence acceleration", value: "92%", trend: "Investor ready" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--sand)] border border-black/10">
                      <div>
                        <p className="text-sm text-black/60">{item.label}</p>
                        <p className="text-lg font-semibold text-black">{item.value}</p>
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--jade)]">{item.trend}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[32px] bg-[var(--ink)] text-[var(--sand)] p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.8)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Trust path</p>
                <p className={cn("text-2xl font-semibold mt-3", display.className)}>
                  Every insight is grounded in verified property data and audit trails.
                </p>
                <div className="mt-6 space-y-3 text-sm text-white/70">
                  {["Property-grade data lineage", "Identity enforced access", "Audit-ready logs"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-[var(--sun)]" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <AnimatePresence>
            {showResults && (
              <motion.section
                ref={resultsRef}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.4 }}
                className="mt-16 bg-white/80 border border-black/10 rounded-[32px] p-8 shadow-[0_30px_110px_-80px_rgba(15,23,42,0.6)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/40">Workflow results</p>
                    <p className={cn("text-2xl font-semibold mt-2", display.className)}>{searchQuery}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className="px-3 py-1.5 rounded-full border border-black/10 text-xs uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 grid lg:grid-cols-[1.1fr,0.9fr] gap-8">
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div key={result.id} className="p-5 rounded-3xl border border-black/10 bg-[var(--sand)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={cn("text-lg font-semibold", display.className)}>{result.name}</p>
                            <p className="text-sm text-black/60">{result.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-black">{result.price}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--jade)]">{result.yield}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {result.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] bg-white border border-black/10 text-black/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-sm text-black/60">{result.status}</p>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--sand)] text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                          >
                            View details
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-white overflow-hidden">
                    <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
                    <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/40">Market map</p>
                    <p className={cn("text-lg font-semibold mt-2", display.className)}>Deal map preview</p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-full bg-[var(--ink)] text-[var(--sand)] text-xs uppercase tracking-[0.2em]"
                      >
                        Connect market API
                      </button>
                    </div>
                    <div className="relative">
                      <iframe
                        title="Market map"
                        src={mapSrc}
                        loading="lazy"
                        className="w-full h-[360px] border-0"
                      ></iframe>
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-black/10 shadow-lg">
                        <p className="text-sm text-black/70">
                          Market nodes refresh with every property query. Connect your feeds for live routing and provenance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="mt-20 grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Signal-first orchestration",
                body: "Blend prompts, tools, and system state to surface the best workflows.",
              },
              {
                title: "Instant system context",
                body: "See every workflow node with dependencies, prompts, and memory injected.",
              },
              {
                title: "Team-ready delivery",
                body: "Share outputs, assign tasks, and route handoffs to clients instantly.",
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-3xl bg-white/80 border border-black/10">
                <p className={cn("text-xl font-semibold", display.className)}>{item.title}</p>
                <p className="mt-3 text-sm text-black/60">{item.body}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}
