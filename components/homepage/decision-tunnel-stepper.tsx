"use client"

import { useState, useEffect, useRef } from "react"
import { Zap, BarChart3, ShieldCheck, FileText, ArrowRight, ChevronRight } from "lucide-react"
import Link from "next/link"

const STEPS = [
  {
    step: "01",
    label: "Intent",
    tagline: "Define what success looks like",
    detail:
      "Set your goal — gross yield target, capital growth horizon, stress resilience threshold, or Golden Visa qualifying value. The platform structures ambiguity into a scorable brief before any data is touched.",
    icon: Zap,
    accent: "blue",
    accentClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-500/8",
    glowClass: "shadow-blue-500/10",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    barClass: "bg-blue-400",
    example: "\"I want AED 2M apartments in Dubai with 7%+ gross yield and a developer with no delays.\"",
  },
  {
    step: "02",
    label: "Evidence",
    tagline: "Five-layer data scoring",
    detail:
      "Every project is scored across a structured evidence stack — L1 Canonical DLD records, L2 Derived yield and pricing signals, L3 Dynamic supply and absorption data, L4 External sentiment, and L5 Raw transaction history. No single data point decides.",
    icon: BarChart3,
    accent: "violet",
    accentClass: "text-violet-400",
    borderClass: "border-violet-500/30",
    bgClass: "bg-violet-500/8",
    glowClass: "shadow-violet-500/10",
    badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    barClass: "bg-violet-400",
    example: "L1 → L2 → L3 → L4 → L5 — each layer cross-validates the last.",
  },
  {
    step: "03",
    label: "Judgment",
    tagline: "Structured signals, not gut feel",
    detail:
      "Composite scores replace intuition. Each project receives a BUY / HOLD / WAIT signal, a developer reliability grade (A–F), a stress resilience score, and an absorption rate. The system reasons — it does not recommend.",
    icon: ShieldCheck,
    accent: "emerald",
    accentClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-500/8",
    glowClass: "shadow-emerald-500/10",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barClass: "bg-emerald-400",
    example: "BUY · Developer Grade A · Stress Score 82 · Absorption 94%",
  },
  {
    step: "04",
    label: "Action",
    tagline: "Export-ready decision artifacts",
    detail:
      "Generate an investor memo, export a scored shortlist, or share a structured report — each with a full auditable evidence trail. Every output is signed to a specific data version, so decisions can be reviewed and reproduced.",
    icon: FileText,
    accent: "amber",
    accentClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/8",
    glowClass: "shadow-amber-500/10",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    barClass: "bg-amber-400",
    example: "Investor memo · PDF export · Shared shortlist · Evidence log",
  },
]

const AUTO_INTERVAL = 4000

export function DecisionTunnelStepper() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = STEPS[active]

  const startCycle = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    setProgress(0)
    const startTime = Date.now()

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / AUTO_INTERVAL) * 100, 100))
    }, 30)

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length)
    }, AUTO_INTERVAL)
  }

  useEffect(() => {
    if (!paused) {
      startCycle()
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(0)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused])

  const handleStepClick = (i: number) => {
    setActive(i)
    setPaused(false)
  }

  const Icon = step.icon

  return (
    <div className="w-full">
      {/* ── Step tabs ── */}
      <div className="relative mb-6 flex items-center justify-between gap-0">
        {STEPS.map((s, i) => {
          const SIcon = s.icon
          const isActive = i === active
          const isPast = i < active

          return (
            <div key={s.step} className="flex flex-1 items-center">
              <button
                onClick={() => handleStepClick(i)}
                className={`group relative flex flex-1 flex-col items-center gap-1.5 py-3 transition-all duration-300 ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                {/* Circle */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? `${s.borderClass} ${s.bgClass} shadow-lg ${s.glowClass}`
                      : isPast
                        ? "border-border/60 bg-card"
                        : "border-border/30 bg-background"
                  }`}
                >
                  <SIcon className={`h-4 w-4 ${isActive ? s.accentClass : "text-muted-foreground/50"} transition-colors duration-300`} />
                </div>

                {/* Label */}
                <span className={`text-[11px] font-semibold transition-colors duration-300 ${isActive ? s.accentClass : "text-muted-foreground/50"}`}>
                  {s.label}
                </span>

                {/* Active progress bar */}
                {isActive && !paused && (
                  <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 overflow-hidden rounded-full bg-border/40">
                    <div
                      className={`h-full transition-none ${s.barClass}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div className={`flex shrink-0 items-center transition-colors duration-500 ${i < active ? "text-muted-foreground/40" : "text-border/40"}`}>
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Active step panel ── */}
      <div
        className={`relative overflow-hidden rounded-2xl border ${step.borderClass} ${step.bgClass} p-6 md:p-8 shadow-xl ${step.glowClass} transition-all duration-500`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background step number */}
        <div
          className="pointer-events-none absolute -right-3 -top-4 select-none font-black leading-none opacity-[0.04]"
          aria-hidden
          style={{ fontSize: "120px", WebkitTextStroke: "2px currentColor" }}
        >
          {step.step}
        </div>

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
          {/* Left — icon + label */}
          <div className="flex shrink-0 flex-col items-start gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${step.borderClass} ${step.bgClass}`}>
              <Icon className={`h-7 w-7 ${step.accentClass}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{step.step} of 04</p>
              <p className={`mt-0.5 font-serif text-2xl font-medium ${step.accentClass}`}>{step.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">{step.tagline}</p>
            </div>
          </div>

          {/* Right — detail */}
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-foreground/80 md:text-[15px] md:leading-7">
              {step.detail}
            </p>

            {/* Example callout */}
            <div className={`mt-5 rounded-xl border ${step.borderClass} bg-background/40 px-4 py-3`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-1">Example</p>
              <p className={`text-xs font-mono leading-relaxed ${step.accentClass} opacity-80`}>{step.example}</p>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === active ? `w-6 ${step.barClass}` : "w-1.5 bg-border/50"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStepClick((active - 1 + STEPS.length) % STEPS.length)}
              className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              ← Prev
            </button>
            {active < STEPS.length - 1 ? (
              <button
                onClick={() => handleStepClick(active + 1)}
                className={`flex items-center gap-1.5 rounded-lg border ${step.borderClass} px-4 py-1.5 text-xs font-medium ${step.accentClass} transition-colors hover:bg-background/50`}
              >
                Next stage
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <Link
                href="/chat"
                className={`flex items-center gap-1.5 rounded-lg border ${step.borderClass} px-4 py-1.5 text-xs font-medium ${step.accentClass} transition-colors hover:bg-background/50`}
              >
                Try it now
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
