"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react"
import { useCopilot } from "@/components/copilot-provider"
import {
  BarChart3,
  BookmarkPlus,
  Building2,
  CheckCircle2,
  FileText,
  Gauge,
  Loader2,
  Radar,
  Scale,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_COMPREHENSIVE_PROFILE,
  getComprehensiveProfileFromSignals,
} from "@/lib/profile/comprehensive"
import { generateMediaRichReport } from "@/lib/artifacts/media-report"
import type {
  ComprehensiveProfile,
  ComprehensiveProfileMemoryEntry,
  ComprehensiveProfileReportAudience,
  ComprehensiveProfileReportTemplate,
} from "@/lib/profile/types"

type ChatInterfaceProps = {
  id?: string
  initialLimit?: number | null
  initialRemaining?: number | null
  initialBlocked?: boolean
  initialCooldownSecondsRemaining?: number | null
}

type WorkspaceCard = {
  title: string
  value: string
  subtitle: string
}

type ComparisonRow = {
  label: string
  area: string
  developer: string
  confidence: string
  timingSignal: string
  stressGrade: string
  price: number | null
  yield: number | null
  score: number | null
}

type ReportDraftResult = {
  status: "idle" | "saving" | "saved" | "error"
  message?: string
  reportId?: string
  enabledExports?: string[]
}

type ShortlistResult = {
  status: "idle" | "saving" | "saved" | "error"
  message?: string
}

type SlashCommandContext = {
  selectedRow: ComparisonRow | null
  assumptions: string
}

type SlashCommand = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  buildPrompt: (context: SlashCommandContext) => string
}

function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0

  const inlineFormat = (s: string): React.ReactNode => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={idx}>{part.slice(2, -2)}</strong>
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={idx}>{part.slice(1, -1)}</em>
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={idx} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">{part.slice(1, -1)}</code>
      return part
    })
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      nodes.push(<p key={i} className="mt-3 mb-1 text-xs font-semibold text-foreground/80 uppercase tracking-wide">{inlineFormat(line.slice(4))}</p>)
    } else if (line.startsWith("## ")) {
      nodes.push(<p key={i} className="mt-4 mb-1.5 text-sm font-bold text-foreground border-b border-border/40 pb-1">{inlineFormat(line.slice(3))}</p>)
    } else if (line.startsWith("# ")) {
      nodes.push(<p key={i} className="mt-4 mb-1.5 text-base font-bold text-foreground">{inlineFormat(line.slice(2))}</p>)
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i} className="leading-relaxed">{inlineFormat(lines[i].slice(2))}</li>)
        i++
      }
      nodes.push(<ul key={`ul-${i}`} className="my-2 ml-4 list-disc space-y-0.5 text-sm">{items}</ul>)
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} className="leading-relaxed">{inlineFormat(lines[i].replace(/^\d+\. /, ""))}</li>)
        i++
      }
      nodes.push(<ol key={`ol-${i}`} className="my-2 ml-4 list-decimal space-y-0.5 text-sm">{items}</ol>)
      continue
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(<p key={i} className="leading-relaxed text-sm">{inlineFormat(line)}</p>)
    }
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
}

function messageText(message: any): string {
  if (typeof message.content === "string") return message.content
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
      .trim()
  }
  return ""
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry))
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  return fallback
}

function formatAed(value: number | null) {
  if (value === null) return "-"
  return `AED ${Math.round(value).toLocaleString()}`
}

function formatMetric(value: number | null, decimals = 1) {
  if (value === null) return "-"
  return value.toFixed(decimals)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function formatCooldownDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function inferReportAudience(
  transcript: string,
  memoryEntry: ComprehensiveProfileMemoryEntry | null,
): ComprehensiveProfileReportAudience {
  const text = `${transcript} ${memoryEntry?.contextNotes ?? ""} ${(memoryEntry?.tags ?? []).join(" ")}`.toLowerCase()

  if (["instagram", "linkedin", "social", "post", "campaign", "audience growth"].some((token) => text.includes(token))) {
    return "social"
  }
  if (["board", "executive", "c-suite", "management summary", "ceo"].some((token) => text.includes(token))) {
    return "executive"
  }
  if (["investor", "fund", "irr", "cap rate", "dscr", "returns", "portfolio"].some((token) => text.includes(token))) {
    return "investor"
  }

  return "client"
}

function formatReportAudienceLabel(audience: ComprehensiveProfileReportAudience): string {
  if (audience === "social") return "Social"
  if (audience === "investor") return "Investor"
  if (audience === "executive") return "Executive"
  return "Client"
}

function findBestMemoryEntry(
  transcript: string,
  memoryEntries: ComprehensiveProfileMemoryEntry[],
): ComprehensiveProfileMemoryEntry | null {
  if (memoryEntries.length === 0) {
    return null
  }

  const text = transcript.toLowerCase()

  const byName = memoryEntries.find((entry) => text.includes(entry.clientName.toLowerCase()))
  if (byName) {
    return byName
  }

  const byTag = memoryEntries.find((entry) =>
    entry.tags.some((tag) => tag && text.includes(tag.toLowerCase())),
  )

  return byTag ?? null
}

function findBestReportTemplate(
  templates: ComprehensiveProfileReportTemplate[],
  audience: ComprehensiveProfileReportAudience,
  memoryEntry: ComprehensiveProfileMemoryEntry | null,
): ComprehensiveProfileReportTemplate | null {
  if (templates.length === 0) {
    return null
  }

  const audienceTemplates = templates.filter((template) => template.audience === audience)
  const searchableTemplates = audienceTemplates.length > 0 ? audienceTemplates : templates

  if (memoryEntry) {
    const clientName = memoryEntry.clientName.toLowerCase()
    const matchedByClient = searchableTemplates.find((template) => {
      const haystack = `${template.name} ${template.outline}`.toLowerCase()
      return haystack.includes(clientName)
    })
    if (matchedByClient) {
      return matchedByClient
    }

    const matchedByTag = searchableTemplates.find((template) => {
      const haystack = `${template.name} ${template.outline}`.toLowerCase()
      return memoryEntry.tags.some((tag) => haystack.includes(tag.toLowerCase()))
    })
    if (matchedByTag) {
      return matchedByTag
    }
  }

  return searchableTemplates[0] ?? null
}

function resolvePreferredExportFormat(enabledExports: string[] | undefined): "pdf" | "json" | "branded" {
  if (!enabledExports || enabledExports.length === 0) {
    return "pdf"
  }
  if (enabledExports.includes("pdf")) {
    return "pdf"
  }
  if (enabledExports.includes("json")) {
    return "json"
  }
  if (enabledExports.includes("brandedFiles")) {
    return "branded"
  }
  return "pdf"
}

function normalizeToPercent(value: number | null, max: number) {
  if (value === null || max <= 0) return 0
  return clamp((value / max) * 100, 8, 100)
}

function buildSparklinePath(values: number[], width = 220, height = 64) {
  if (values.length === 0) return ""
  if (values.length === 1) {
    const y = height / 2
    return `M0 ${y} L${width} ${y}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

function buildAreaPath(linePath: string, width = 220, height = 64) {
  if (!linePath) return ""
  return `${linePath} L${width} ${height} L0 ${height} Z`
}

function extractToolOutputs(messages: any[]): Record<string, unknown>[] {
  const outputs: Record<string, unknown>[] = []

  for (const message of messages) {
    if (Array.isArray(message.toolInvocations)) {
      for (const invocation of message.toolInvocations) {
        const result = toRecord(invocation?.result)
        if (result) outputs.push(result)
      }
    }

    if (!Array.isArray(message.parts)) continue
    for (const part of message.parts) {
      if (part?.type === "dynamic-tool" && part.output) {
        const output = toRecord(part.output)
        if (output) outputs.push(output)
      }
      if (typeof part?.type === "string" && part.type.startsWith("tool-") && part.output) {
        const output = toRecord(part.output)
        if (output) outputs.push(output)
      }
    }
  }

  return outputs
}

function deriveWorkspaceCards(toolOutputs: Record<string, unknown>[]): WorkspaceCard[] {
  const rows = toolOutputs
    .flatMap((output) => toRows(output.rows))
    .filter((row) => Object.keys(row).length > 0)

  if (rows.length === 0) {
    return [
      { title: "Matched projects", value: "0", subtitle: "Ask a question to screen inventory" },
      { title: "Avg asking price", value: "-", subtitle: "Appears after a search query" },
      { title: "Market signal", value: "-", subtitle: "BUY · HOLD · WAIT timing signal" },
      { title: "Data confidence", value: "-", subtitle: "HIGH · MEDIUM · LOW quality tier" },
    ]
  }

  const prices = rows
    .map((row) => toFiniteNumber(row.l1_canonical_price))
    .filter((value): value is number => value !== null && value > 0)
  const avgPrice = prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null

  const timingCounts = new Map<string, number>()
  for (const row of rows) {
    const timing = toText(row.l3_timing_signal, "")
    if (!timing) continue
    timingCounts.set(timing, (timingCounts.get(timing) ?? 0) + 1)
  }
  const topTiming = [...timingCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"

  const confidenceCounts = new Map<string, number>()
  for (const row of rows) {
    const confidence = toText(row.l1_confidence, "")
    if (!confidence) continue
    confidenceCounts.set(confidence, (confidenceCounts.get(confidence) ?? 0) + 1)
  }
  const topConfidence = [...confidenceCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"

  const scoreValues = rows
    .map((row) => toFiniteNumber(row.engine_god_metric))
    .filter((value): value is number => value !== null)
  const avgScore = scoreValues.length > 0 ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length : null

  return [
    { title: "Matched projects", value: rows.length.toLocaleString(), subtitle: "From live inventory scan" },
    { title: "Avg asking price", value: formatAed(avgPrice), subtitle: "Across matched results" },
    { title: "Market signal", value: topTiming, subtitle: "Dominant timing signal in results" },
    { title: "Data confidence", value: topConfidence, subtitle: `Avg investor score: ${formatMetric(avgScore)}` },
  ]
}

function deriveComparisonRows(toolOutputs: Record<string, unknown>[]): ComparisonRow[] {
  const rows = toolOutputs
    .flatMap((output) => toRows(output.rows))
    .filter((row) => typeof row.name === "string")

  const unique = new Map<string, ComparisonRow>()
  for (const row of rows) {
    const label = toText(row.name)
    if (!label || unique.has(label)) continue

    unique.set(label, {
      label,
      area: toText(row.final_area === null ? row.area : row.final_area),
      developer: toText(row.developer),
      confidence: toText(row.l1_confidence),
      timingSignal: toText(row.l3_timing_signal),
      stressGrade: toText(row.l2_stress_test_grade),
      price: toFiniteNumber(row.l1_canonical_price),
      yield: toFiniteNumber(row.l1_canonical_yield),
      score: toFiniteNumber(row.engine_god_metric),
    })

    if (unique.size >= 8) break
  }

  return [...unique.values()]
}

function resolveDataFreshness(toolOutputs: Record<string, unknown>[]) {
  for (let index = toolOutputs.length - 1; index >= 0; index -= 1) {
    const value = toolOutputs[index]?.data_as_of
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }
  return null
}

const capabilityCards = [
  {
    label: "Screen Properties",
    description: "Find ranked projects by budget, area, and return profile using live scoring data.",
    example: "2BR under AED 2M, BUY signal, Grade A risk",
    prompt: "Find 2BR projects under AED 2M with BUY timing signal and stress grade A or B. Rank by investor score and show yield for each.",
    icon: Search,
  },
  {
    label: "Compare Markets",
    description: "Side-by-side analysis of areas or projects across price, yield, and risk metrics.",
    example: "Dubai Marina vs JBR: yield, risk, and timing",
    prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing signal. Which is the better entry point right now and why?",
    icon: Scale,
  },
  {
    label: "Stress Test",
    description: "Model cash flows, DSCR, and investment risk under different market scenarios.",
    example: "7% vacancy, 5.5% mortgage, 30% down payment",
    prompt: "Stress-test a 2BR investment under AED 2M in Dubai. Assumptions: 30% down payment, 5.25% interest rate, 6% vacancy, 18% operating costs. Show net cash flow, DSCR, and stress-adjusted returns.",
    icon: SlidersHorizontal,
  },
  {
    label: "Investor Memo",
    description: "Generate a structured due diligence brief with price reality, developer track record, and risk verdict.",
    example: "Full memo: Marina Vista — pricing, risk, verdict",
    prompt: "Generate a full investor memo for Marina Vista. Include: price reality check versus area average, developer reliability score, stress grade assessment, timing signal context, and final investment verdict.",
    icon: FileText,
  },
]

const commandPrompts = [
  {
    label: "Screen",
    prompt: "Find 2BR projects under AED 2M with BUY timing signal and stress grade A or B. Rank by investor score.",
    icon: Search,
  },
  {
    label: "Compare",
    prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing signal. Which is the better entry point?",
    icon: Scale,
  },
  {
    label: "Stress test",
    prompt: "Stress-test a 2BR under AED 2M in Dubai: 30% down, 5.25% interest, 6% vacancy. Show DSCR and net cash flow.",
    icon: Radar,
  },
  {
    label: "Investor memo",
    prompt: "Generate a full investor memo for Marina Vista: price reality, area risk, developer diligence, stress test, and verdict.",
    icon: FileText,
  },
]

const slashCommands: SlashCommand[] = [
  {
    id: "compare",
    title: "/compare",
    description: "Run a direct area or project comparison.",
    icon: Scale,
    buildPrompt: ({ selectedRow }) =>
      selectedRow
        ? `Compare ${selectedRow.label} with top alternatives in ${selectedRow.area} using price, yield, stress grade, and timing signal.`
        : "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing signal.",
  },
  {
    id: "screen",
    title: "/screen",
    description: "Find ranked projects with constraints.",
    icon: Search,
    buildPrompt: () =>
      "Find 2BR projects under AED 2M with BUY timing signal and stress grade A or B. Rank by engine_god_metric.",
  },
  {
    id: "memo",
    title: "/memo",
    description: "Generate full investor memo.",
    icon: FileText,
    buildPrompt: ({ selectedRow }) =>
      `Generate an investor memo for ${selectedRow?.label ?? "Marina Vista"} with price reality, area risk, developer due diligence, and stress test.`,
  },
  {
    id: "simulate",
    title: "/simulate",
    description: "Run scenario stress simulation.",
    icon: SlidersHorizontal,
    buildPrompt: ({ selectedRow, assumptions }) =>
      `Run a scenario analysis for ${selectedRow?.label ?? "a target project"}. Assumptions: ${assumptions}. Return stress narrative, confidence, and what changes the conclusion.`,
  },
  {
    id: "price",
    title: "/price",
    description: "Run price reality check.",
    icon: Gauge,
    buildPrompt: ({ selectedRow }) => `Run price reality check for ${selectedRow?.label ?? "Marina Vista"}.`,
  },
]

export function ChatInterface({
  initialLimit = 20,
  initialRemaining = 20,
  initialBlocked = false,
  initialCooldownSecondsRemaining = null,
}: ChatInterfaceProps) {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const [limit, setLimit] = useState<number | null>(initialLimit)
  const [remaining, setRemaining] = useState<number | null>(initialRemaining)
  const [cooldownBlocked, setCooldownBlocked] = useState(initialBlocked)
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number | null>(
    initialCooldownSecondsRemaining,
  )
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const [reportDraft, setReportDraft] = useState<ReportDraftResult>({ status: "idle" })
  const [shortlistResult, setShortlistResult] = useState<ShortlistResult>({ status: "idle" })
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveProfile>(DEFAULT_COMPREHENSIVE_PROFILE)
  const [selectedMemoryEntryId, setSelectedMemoryEntryId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedAudienceOverride, setSelectedAudienceOverride] = useState<"" | ComprehensiveProfileReportAudience>("")

  const [selectedProject, setSelectedProject] = useState<string>("")
  const [downPaymentPct, setDownPaymentPct] = useState(30)
  const [interestRatePct, setInterestRatePct] = useState(5.25)
  const [vacancyPct, setVacancyPct] = useState(6)
  const [opexPct, setOpexPct] = useState(18)
  const [slashActiveIndex, setSlashActiveIndex] = useState(0)
  const [canvasOpen, setCanvasOpen] = useState(false)

  const { messages, sendMessage, status, error } = useCopilot()

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false

    const loadUsage = async () => {
      try {
        const response = await fetch("/api/account/chat-usage", { cache: "no-store" })
        if (!response.ok) return
        const payload = (await response.json()) as {
          usage?: {
            limit?: number | null
            remaining?: number | null
            blocked?: boolean
            cooldownSecondsRemaining?: number | null
          }
        }
        if (cancelled) return
        if (payload.usage) {
          setLimit(payload.usage.limit ?? null)
          setRemaining(payload.usage.remaining ?? null)
          setCooldownBlocked(Boolean(payload.usage.blocked))
          setCooldownSecondsRemaining(payload.usage.cooldownSecondsRemaining ?? null)
        }
      } catch {
        // keep server defaults
      }
    }

    void loadUsage()
    return () => {
      cancelled = true
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    let cancelled = false

    const loadProfileContext = async () => {
      try {
        const response = await fetch("/api/account/profile", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          profile?: {
            inferredSignals?: unknown
            comprehensiveProfile?: ComprehensiveProfile
          }
        }

        if (cancelled || !payload.profile) {
          return
        }

        const fromApi = payload.profile.comprehensiveProfile
        const fallback = getComprehensiveProfileFromSignals(payload.profile.inferredSignals)
        setComprehensiveProfile(fromApi ?? fallback)
      } catch {
        // Keep defaults when unavailable.
      }
    }

    void loadProfileContext()

    return () => {
      cancelled = true
    }
  }, [mounted])

  useEffect(() => {
    if (!cooldownBlocked || !cooldownSecondsRemaining || cooldownSecondsRemaining <= 0) return

    const interval = window.setInterval(() => {
      setCooldownSecondsRemaining((current) => {
        if (!current || current <= 1) {
          setCooldownBlocked(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [cooldownBlocked, cooldownSecondsRemaining])

  const chatBlocked = cooldownBlocked || (limit !== null && (remaining ?? 0) <= 0)
  const usageError = error?.message ?? ""
  const isLimitError =
    usageError.includes("429") ||
    usageError.toLowerCase().includes("cool") ||
    usageError.toLowerCase().includes("limit")
  const isBusy = status === "submitted" || status === "streaming"
  const submitBlocked = isBusy || input.trim().length === 0 || chatBlocked
  const usageStatusLabel = useMemo(() => {
    if (limit === null) return "Unlimited · ⌘↵ to send"
    if (chatBlocked) {
      if (cooldownSecondsRemaining && cooldownSecondsRemaining > 0) {
        return `Cooldown ${formatCooldownDuration(cooldownSecondsRemaining)} · ⌘↵ to send`
      }
      return "Cooldown active · ⌘↵ to send"
    }
    return `${Math.max(remaining ?? 0, 0)}/${limit} messages left · ⌘↵ to send`
  }, [chatBlocked, cooldownSecondsRemaining, limit, remaining])

  const toolOutputs = useMemo(() => extractToolOutputs(messages as any[]), [messages])
  const workspaceCards = useMemo(() => deriveWorkspaceCards(toolOutputs), [toolOutputs])
  const comparisonRows = useMemo(() => deriveComparisonRows(toolOutputs), [toolOutputs])
  const dataFreshness = useMemo(() => resolveDataFreshness(toolOutputs), [toolOutputs])

  const latestAssistantMessage = useMemo(() => {
    const assistant = [...(messages as any[])].reverse().find((message) => message.role === "assistant")
    return assistant ?? null
  }, [messages])

  const latestAssistantText = useMemo(() => {
    if (!latestAssistantMessage) return ""
    return messageText(latestAssistantMessage)
  }, [latestAssistantMessage])

  const hasConversation = useMemo(() => {
    const stream = messages as any[]
    if (stream.length > 0) return true
    return status === "submitted" || status === "streaming"
  }, [messages, status])

  useEffect(() => {
    if (!hasConversation) setCanvasOpen(false)
  }, [hasConversation])

  useEffect(() => {
    setSelectedMemoryEntryId((current) =>
      current && !comprehensiveProfile.memoryEntries.some((entry) => entry.id === current) ? "" : current,
    )
  }, [comprehensiveProfile.memoryEntries])

  useEffect(() => {
    setSelectedTemplateId((current) =>
      current && !comprehensiveProfile.reportTemplates.some((template) => template.id === current) ? "" : current,
    )
  }, [comprehensiveProfile.reportTemplates])

  useEffect(() => {
    if (comparisonRows.length === 0) {
      setSelectedProject("")
      return
    }

    setSelectedProject((current) => {
      const exists = comparisonRows.some((row) => row.label === current)
      return exists ? current : comparisonRows[0].label
    })
  }, [comparisonRows])

  const selectedRow = useMemo(
    () => comparisonRows.find((row) => row.label === selectedProject) ?? null,
    [comparisonRows, selectedProject],
  )
  const simulationAssumptions = useMemo(
    () =>
      `down payment ${downPaymentPct}%, interest ${interestRatePct.toFixed(2)}%, vacancy ${vacancyPct}%, operating cost ${opexPct}%`,
    [downPaymentPct, interestRatePct, vacancyPct, opexPct],
  )

  const selectedMemoryEntry = useMemo(
    () =>
      selectedMemoryEntryId
        ? comprehensiveProfile.memoryEntries.find((entry) => entry.id === selectedMemoryEntryId) ?? null
        : null,
    [comprehensiveProfile.memoryEntries, selectedMemoryEntryId],
  )

  const selectedTemplate = useMemo(
    () =>
      selectedTemplateId
        ? comprehensiveProfile.reportTemplates.find((template) => template.id === selectedTemplateId) ?? null
        : null,
    [comprehensiveProfile.reportTemplates, selectedTemplateId],
  )

  const simulationMetrics = useMemo(() => {
    if (!selectedRow || selectedRow.price === null || selectedRow.price <= 0) return null

    const price = selectedRow.price
    const yieldPct = selectedRow.yield ?? 0
    const loanAmount = price * (1 - downPaymentPct / 100)
    const monthlyRate = interestRatePct / 100 / 12
    const amortizationMonths = 25 * 12
    const monthlyPayment =
      monthlyRate === 0
        ? loanAmount / amortizationMonths
        : (loanAmount * monthlyRate * (1 + monthlyRate) ** amortizationMonths) /
          ((1 + monthlyRate) ** amortizationMonths - 1)

    const grossAnnualRent = price * (yieldPct / 100)
    const vacancyLoss = grossAnnualRent * (vacancyPct / 100)
    const effectiveAnnualRent = grossAnnualRent - vacancyLoss
    const operatingCost = effectiveAnnualRent * (opexPct / 100)
    const annualDebtService = monthlyPayment * 12
    const annualNetCashFlow = effectiveAnnualRent - operatingCost - annualDebtService
    const dscr = annualDebtService > 0 ? (effectiveAnnualRent - operatingCost) / annualDebtService : null

    const stressPenaltyByGrade: Record<string, number> = {
      A: 0.04,
      B: 0.08,
      C: 0.12,
      D: 0.18,
      "-": 0.1,
    }
    const stressPenalty = stressPenaltyByGrade[selectedRow.stressGrade] ?? 0.1
    const stressAdjustedCashFlow = annualNetCashFlow * (1 - stressPenalty)

    return {
      loanAmount,
      monthlyPayment,
      grossAnnualRent,
      effectiveAnnualRent,
      annualNetCashFlow,
      stressAdjustedCashFlow,
      dscr,
    }
  }, [selectedRow, downPaymentPct, interestRatePct, vacancyPct, opexPct])

  const chartCaps = useMemo(() => {
    const maxPrice = Math.max(...comparisonRows.map((row) => row.price ?? 0), 0)
    const maxYield = Math.max(...comparisonRows.map((row) => row.yield ?? 0), 0)
    const maxScore = Math.max(...comparisonRows.map((row) => row.score ?? 0), 0)
    return { maxPrice, maxYield, maxScore }
  }, [comparisonRows])

  const scoreSeries = useMemo(
    () => comparisonRows.slice(0, 6).map((row) => row.score ?? 0),
    [comparisonRows],
  )
  const yieldSeries = useMemo(
    () => comparisonRows.slice(0, 6).map((row) => row.yield ?? 0),
    [comparisonRows],
  )
  const scoreSparkPath = useMemo(() => buildSparklinePath(scoreSeries), [scoreSeries])
  const yieldSparkPath = useMemo(() => buildSparklinePath(yieldSeries), [yieldSeries])

  const dynamicSuggestions = useMemo(() => {
    if (!selectedRow) {
      return [
        "Find BUY signal projects under AED 2M in Dubai Marina with stress grade A or B.",
        "Which Dubai area offers the best yield-to-price ratio right now?",
        "Compare Emaar vs Damac reliability — which developer carries lower delivery risk?",
        "What does a BUY signal mean and how is it calculated in this platform?",
      ]
    }

    return [
      `Generate a full investor memo for ${selectedRow.label} — pricing, risk, developer track record, and verdict.`,
      `How does ${selectedRow.label} compare to top alternatives in ${selectedRow.area} on yield and risk grade?`,
      `Stress test ${selectedRow.label}: model 8% vacancy, 5.5% interest rate, and conservative rent assumptions.`,
      `What are the key investment risks for ${selectedRow.label} and what would change the outlook?`,
    ]
  }, [selectedRow])

  const slashQuery = useMemo(() => {
    const trimmed = input.trimStart()
    if (!trimmed.startsWith("/")) return ""
    return trimmed.slice(1).toLowerCase()
  }, [input])

  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return slashCommands
    return slashCommands.filter(
      (command) =>
        command.id.includes(slashQuery) ||
        command.title.includes(slashQuery) ||
        command.description.toLowerCase().includes(slashQuery),
    )
  }, [slashQuery])

  const isSlashPaletteOpen = input.trimStart().startsWith("/")

  useEffect(() => {
    setSlashActiveIndex(0)
  }, [slashQuery])

  const sendPrompt = async (prompt: string) => {
    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt || isBusy) return
    if (chatBlocked) {
      if (cooldownSecondsRemaining && cooldownSecondsRemaining > 0) {
        setLimitMessage(
          `Free usage is cooling down. You can send again in ${formatCooldownDuration(cooldownSecondsRemaining)}.`,
        )
      } else {
        setLimitMessage("Free usage is cooling down. Please try again soon.")
      }
      return
    }

    setLimitMessage(null)
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: cleanedPrompt }],
    })

    if (limit !== null) {
      setRemaining((prev) => {
        const current = prev ?? limit
        const nextRemaining = Math.max(current - 1, 0)
        if (nextRemaining === 0) {
          setCooldownBlocked(true)
        }
        return nextRemaining
      })
    }
  }

  const activateSlashCommand = async (command: SlashCommand) => {
    const prompt = command.buildPrompt({ selectedRow, assumptions: simulationAssumptions })
    setInput("")
    await sendPrompt(prompt)
  }

  const onInputKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault()
      const value = input.trim()
      if (!value) return
      if (value.startsWith("/") && filteredSlashCommands.length > 0) {
        const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
        if (command) await activateSlashCommand(command)
      } else {
        await sendPrompt(value)
        setInput("")
      }
      return
    }

    if (!isSlashPaletteOpen || filteredSlashCommands.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSlashActiveIndex((current) => (current + 1) % filteredSlashCommands.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSlashActiveIndex((current) => (current - 1 + filteredSlashCommands.length) % filteredSlashCommands.length)
      return
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault()
      const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
      if (command) {
        await activateSlashCommand(command)
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setInput("")
    }
  }

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = input.trim()
    if (!value) return

    if (value.startsWith("/") && filteredSlashCommands.length > 0) {
      const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
      if (command) await activateSlashCommand(command)
      return
    }

    await sendPrompt(value)
    setInput("")
  }

  const runSimulationInChat = async () => {
    if (!selectedRow) return

    const prompt = [
      `Run a scenario analysis for ${selectedRow.label}.`,
      `Assumptions: ${simulationAssumptions}.`,
      "Return stress narrative, what would change conclusion, and risk flags.",
    ].join(" ")

    await sendPrompt(prompt)
  }

  const saveToShortlist = async () => {
    if (!selectedRow) return

    setShortlistResult({ status: "saving" })
    try {
      const createRes = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Chat Shortlist ${new Date().toISOString().slice(0, 10)}` }),
      })

      const createPayload = await createRes.json().catch(() => ({}))
      if (!createRes.ok) {
        setShortlistResult({
          status: "error",
          message:
            typeof createPayload?.error === "string"
              ? createPayload.error
              : "Could not create shortlist (Team tier may be required).",
        })
        return
      }

      const watchlistId = typeof createPayload?.watchlist?.id === "string" ? createPayload.watchlist.id : ""
      if (!watchlistId) {
        setShortlistResult({ status: "error", message: "Shortlist creation returned no identifier." })
        return
      }

      const itemRes = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedRow.label }),
      })
      const itemPayload = await itemRes.json().catch(() => ({}))
      if (!itemRes.ok) {
        setShortlistResult({
          status: "error",
          message:
            typeof itemPayload?.error === "string"
              ? itemPayload.error
              : "Could not add selected project to shortlist.",
        })
        return
      }

      setShortlistResult({ status: "saved", message: "Selected project saved to shortlist." })
    } catch {
      setShortlistResult({ status: "error", message: "Could not save shortlist right now." })
    }
  }

  const saveReportDraft = async () => {
    const reportContent = latestAssistantText.trim()
    if (!reportContent) {
      setReportDraft({
        status: "error",
        message: "Ask a question first to generate report content.",
      })
      return
    }

    setReportDraft({ status: "saving" })
    try {
      const matchedMemoryEntry = selectedMemoryEntry ?? findBestMemoryEntry(reportContent, comprehensiveProfile.memoryEntries)
      const audience = selectedAudienceOverride || inferReportAudience(reportContent, matchedMemoryEntry)
      const chosenTemplate = selectedTemplate ?? findBestReportTemplate(
        comprehensiveProfile.reportTemplates,
        audience,
        matchedMemoryEntry,
      )

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Chat Report — ${new Date().toLocaleString()}`,
          clientName: matchedMemoryEntry?.clientName,
          templateId: chosenTemplate?.id,
          audience,
          content: {
            transcript: reportContent,
            cards: workspaceCards,
            comparison: comparisonRows,
            scenario: simulationMetrics,
            generatedAt: new Date().toISOString(),
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const fallbackMessage = response.status === 403
          ? "Report export requires Team tier."
          : "Could not save report right now."
        setReportDraft({
          status: "error",
          message: typeof payload?.error === "string" ? payload.error : fallbackMessage,
        })
        return
      }

      const reportId = typeof payload?.report?.id === "string" ? payload.report.id : undefined
      const enabledExports = Array.isArray(payload?.enabledExports)
        ? payload.enabledExports.filter((item: unknown): item is string => typeof item === "string")
        : undefined

      const saveContextParts = [
        chosenTemplate?.name ? `template: ${chosenTemplate.name}` : null,
        matchedMemoryEntry?.clientName ? `client: ${matchedMemoryEntry.clientName}` : null,
        audience ? `audience: ${formatReportAudienceLabel(audience)}` : null,
      ].filter((item): item is string => Boolean(item))

      setReportDraft({
        status: "saved",
        message:
          saveContextParts.length > 0
            ? `Report saved (${saveContextParts.join(" · ")}).`
            : "Report saved.",
        reportId,
        enabledExports,
      })
    } catch {
      setReportDraft({
        status: "error",
        message: "Could not save report right now.",
      })
    }
  }

  const reportDownloadHref = useMemo(() => {
    if (!reportDraft.reportId) {
      return null
    }
    const format = resolvePreferredExportFormat(reportDraft.enabledExports)
    return `/api/reports/${reportDraft.reportId}/download?format=${format}`
  }, [reportDraft.reportId, reportDraft.enabledExports])

  if (!hasConversation) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Real Estate AI Chat</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Screen properties, compare markets, stress test investments, and generate investor memos — powered by live UAE data.
          </p>
        </div>

        {/* Capability tiles */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {capabilityCards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.label}
                type="button"
                disabled={isBusy || chatBlocked}
                onClick={() => void sendPrompt(card.prompt)}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="rounded-xl border border-border/50 bg-background/60 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{card.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.description}</p>
                <p className="mt-2 line-clamp-1 text-[11px] text-primary/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  → {card.example}
                </p>
              </button>
            )
          })}
        </div>

        {/* Input card */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70">
          <form onSubmit={submitMessage}>
            <div className="relative p-4 pb-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => { void onInputKeyDown(event) }}
                placeholder="Ask about a project, area, or investment scenario. Type / for quick commands."
                className="min-h-28 resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
                disabled={chatBlocked}
              />

              {isSlashPaletteOpen ? (
                <div className="absolute bottom-[100%] left-4 right-4 mb-2 rounded-xl border border-border/70 bg-card/98 p-2 shadow-xl backdrop-blur">
                  {filteredSlashCommands.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">No matching commands.</p>
                  ) : (
                    filteredSlashCommands.map((command, index) => {
                      const Icon = command.icon
                      const isActive = index === slashActiveIndex
                      return (
                        <button
                          key={command.id}
                          type="button"
                          onClick={() => void activateSlashCommand(command)}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${isActive ? "bg-primary/10" : "hover:bg-background"}`}
                        >
                          <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span>
                            <span className="block text-xs font-semibold text-foreground">{command.title}</span>
                            <span className="block text-[11px] text-muted-foreground">{command.description}</span>
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {slashCommands.slice(0, 4).map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => setInput(`/${cmd.id}`)}
                    className="rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    /{cmd.id}
                  </button>
                ))}
                <span className="hidden text-[11px] text-muted-foreground sm:block">· ⌘↵ to send</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                {limit !== null ? (
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {Math.max(remaining ?? 0, 0)}/{limit} left
                  </p>
                ) : null}
                <Button type="submit" disabled={submitBlocked}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Analyse
                </Button>
              </div>
            </div>
          </form>
        </div>

        {limitMessage ? (
          <p className="mt-3 text-sm text-amber-500">
            {limitMessage} <Link href="/pricing" className="underline">Upgrade</Link>
          </p>
        ) : null}
        {isLimitError ? (
          <p className="mt-3 text-sm text-amber-500">
            Free window is cooling down. <Link href="/pricing" className="underline">Upgrade for uninterrupted access</Link>
          </p>
        ) : null}
        {error && !isLimitError ? <p className="mt-3 text-sm text-red-400">{error.message}</p> : null}
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-5">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">AI Chat</p>
            {dataFreshness ? (
              <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                Data: {new Date(dataFreshness).toLocaleDateString()}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs ${status === "streaming" ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status === "streaming" ? "animate-pulse bg-primary" : "bg-emerald-400"}`} />
              {status === "streaming" ? "Analysing" : "Ready"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCanvasOpen((current) => !current)}
              className="h-7 px-2.5 text-xs"
            >
              {canvasOpen ? "Hide workspace" : "Open workspace"}
            </Button>
          </div>
        </div>

        <div className="relative z-10 mb-3 flex flex-wrap gap-1.5">
          {commandPrompts.map((command) => {
            const Icon = command.icon
            return (
              <button
                key={command.label}
                type="button"
                onClick={() => void sendPrompt(command.prompt)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon className="h-3 w-3" />
                {command.label}
              </button>
            )
          })}

          {dynamicSuggestions.slice(0, 2).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendPrompt(suggestion)}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <WandSparkles className="h-3 w-3" />
              <span className="max-w-48 truncate">{suggestion}</span>
            </button>
          ))}
        </div>

        <div id="chat-container" className="relative z-10 h-[58vh] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-background/55 p-3 backdrop-blur-sm md:h-[60vh]">
          {(messages as any[]).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
              Ask for anything real estate. Compare projects, simulate scenarios, draft reports, and run live intelligence from one chat.
            </div>
          ) : null}

          {(messages as any[]).map((message) => (
            <div
              key={message.id}
              className={`animate-msg-in ${message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[95%]"}`}
            >
              {message.role === "user" ? (
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/85 px-4 py-3 text-sm text-primary-foreground shadow-[0_12px_24px_-14px_rgba(37,99,235,0.5)]">
                  {messageText(message) || "..."}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background/95 via-card/90 to-background/85 px-4 py-3.5 text-sm text-foreground shadow-[0_16px_28px_-18px_rgba(56,189,248,0.3)]">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI
                  </p>
                  <ChatMarkdown text={messageText(message) || "Running analysis..."} />
                </div>
              )}
            </div>
          ))}

          {status === "streaming" ? (
            <div className="mr-auto max-w-[92%]">
              <div className="inline-flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/90 to-background/85 px-4 py-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="chat-dot-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="chat-dot-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="chat-dot-3 h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Analysing live market data
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={submitMessage} className="relative z-10 mt-4 space-y-3">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                void onInputKeyDown(event)
              }}
              placeholder="Ask for project screening, price checks, area risk briefs, and full investor memos."
              className="min-h-20 resize-y text-base"
            />

            {isSlashPaletteOpen ? (
              <div className="absolute bottom-[100%] left-0 right-0 mb-2 rounded-xl border border-border/70 bg-card/95 p-2 shadow-xl backdrop-blur">
                {filteredSlashCommands.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">No matching commands.</p>
                ) : (
                  filteredSlashCommands.map((command, index) => {
                    const Icon = command.icon
                    const isActive = index === slashActiveIndex
                    return (
                      <button
                        key={command.id}
                        type="button"
                        onClick={() => void activateSlashCommand(command)}
                        className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition ${
                          isActive ? "bg-primary/12" : "hover:bg-background"
                        }`}
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 text-primary" />
                        <span>
                          <span className="block text-xs font-medium text-foreground">{command.title}</span>
                          <span className="block text-[11px] text-muted-foreground">{command.description}</span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {usageStatusLabel}
            </p>
            <Button type="submit" disabled={submitBlocked} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {status === "streaming" ? "Analysing…" : "Send"}
            </Button>
          </div>
        </form>

        {limitMessage ? (
          <p className="mt-3 text-sm text-amber-600">
            {limitMessage} <Link href="/pricing" className="underline">Upgrade</Link>
          </p>
        ) : null}

        {isLimitError ? (
          <p className="mt-3 text-sm text-amber-600">
            Free window is cooling down. <Link href="/pricing" className="underline">Upgrade for uninterrupted access</Link>
          </p>
        ) : null}

        {error && !isLimitError ? <p className="mt-3 text-sm text-red-500">{error.message}</p> : null}
      </section>

      <aside className={`overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-5 ${canvasOpen ? "block" : "hidden"}`}>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Decision Canvas</h3>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Live</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {workspaceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-border bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.title}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{card.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{card.subtitle}</p>
            </article>
          ))}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Performance Curves</p>
          </div>
          {comparisonRows.length < 2 ? (
            <p className="text-xs text-muted-foreground">Run a comparison query to see score and yield trend curves.</p>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card/90 to-background/80 p-2">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Investor Score</p>
                <svg viewBox="0 0 220 64" className="h-16 w-full">
                  <path d={buildAreaPath(scoreSparkPath)} fill="rgba(59,130,246,0.16)" />
                  <path d={scoreSparkPath} stroke="rgb(59,130,246)" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card/90 to-background/80 p-2">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">Gross Yield %</p>
                <svg viewBox="0 0 220 64" className="h-16 w-full">
                  <path d={buildAreaPath(yieldSparkPath)} fill="rgba(34,197,94,0.16)" />
                  <path d={yieldSparkPath} stroke="rgb(34,197,94)" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Project Comparison</p>
          </div>

          {comparisonRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ask to compare projects or areas to populate this panel.</p>
          ) : (
            <div className="space-y-2">
              {comparisonRows.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => setSelectedProject(row.label)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                    row.label === selectedProject
                      ? "border-primary/60 bg-primary/12 shadow-[0_14px_28px_-20px_rgba(37,99,235,0.5)]"
                      : "border-border/60 bg-gradient-to-br from-card/90 to-background/80 hover:border-primary/30"
                  }`}
                >
                  <p className="truncate text-xs font-medium text-foreground">{row.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {row.area} • {row.stressGrade} • {row.timingSignal} • {row.confidence}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${normalizeToPercent(row.score, chartCaps.maxScore)}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${normalizeToPercent(row.yield, chartCaps.maxYield)}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-sky-500"
                        style={{ width: `${normalizeToPercent(row.price, chartCaps.maxPrice)}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatAed(row.price)} • Yield {formatMetric(row.yield)}% • Score {formatMetric(row.score)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Investment Simulator</p>
          </div>

          {!selectedRow ? (
            <p className="text-xs text-muted-foreground">Select a project from the comparison table to model its cash flows and risk.</p>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground">{selectedRow.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selectedRow.area} • {selectedRow.developer}
              </p>

              <div className="mt-3 space-y-2.5">
                <label className="block text-[11px] text-muted-foreground">
                  Down payment ({downPaymentPct.toFixed(0)}%)
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={1}
                    value={downPaymentPct}
                    onChange={(event) => setDownPaymentPct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>

                <label className="block text-[11px] text-muted-foreground">
                  Interest ({interestRatePct.toFixed(2)}%)
                  <input
                    type="range"
                    min={2}
                    max={9}
                    step={0.05}
                    value={interestRatePct}
                    onChange={(event) => setInterestRatePct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>

                <label className="block text-[11px] text-muted-foreground">
                  Vacancy ({vacancyPct.toFixed(0)}%)
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={1}
                    value={vacancyPct}
                    onChange={(event) => setVacancyPct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>

                <label className="block text-[11px] text-muted-foreground">
                  Operating costs ({opexPct.toFixed(0)}%)
                  <input
                    type="range"
                    min={8}
                    max={35}
                    step={1}
                    value={opexPct}
                    onChange={(event) => setOpexPct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
              </div>

              {simulationMetrics ? (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Loan amount", value: formatAed(simulationMetrics.loanAmount) },
                    { label: "Monthly mortgage", value: formatAed(simulationMetrics.monthlyPayment) },
                    { label: "Net annual rent", value: formatAed(simulationMetrics.effectiveAnnualRent) },
                    { label: "Annual cash flow", value: formatAed(simulationMetrics.annualNetCashFlow), highlight: (simulationMetrics.annualNetCashFlow ?? 0) >= 0 },
                    { label: "Stress cash flow", value: formatAed(simulationMetrics.stressAdjustedCashFlow) },
                    { label: "DSCR ratio", value: formatMetric(simulationMetrics.dscr, 2) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className={`mt-0.5 text-xs font-semibold tabular-nums ${item.highlight ? "text-emerald-400" : "text-foreground"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button type="button" className="mt-3 w-full gap-1.5" variant="secondary" onClick={() => void runSimulationInChat()}>
                <TrendingUp className="h-3.5 w-3.5" />
                Run in AI chat
              </Button>

              <Button type="button" className="mt-2 w-full gap-1.5" variant="outline" onClick={() => void saveToShortlist()}>
                <BookmarkPlus className="h-3.5 w-3.5" />
                Save to watchlist
              </Button>

              {shortlistResult.message ? (
                <p className={`mt-2 text-xs ${shortlistResult.status === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
                  {shortlistResult.message}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Report Export</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Save the AI's analysis as a structured investor report you can download and share.
          </p>

          <div className="mt-3 space-y-2.5">
            <label className="block text-[11px] text-muted-foreground">
              Client context
              <select
                value={selectedMemoryEntryId}
                onChange={(event) => setSelectedMemoryEntryId(event.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs text-foreground"
              >
                <option value="">Auto-detect from chat</option>
                {comprehensiveProfile.memoryEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.clientName.trim() || "Untitled client memory"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] text-muted-foreground">
              Report template
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs text-foreground"
              >
                <option value="">Auto-select best template</option>
                {comprehensiveProfile.reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {(template.name.trim() || "Untitled template") +
                      ` (${formatReportAudienceLabel(template.audience)})`}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] text-muted-foreground">
              Audience
              <select
                value={selectedAudienceOverride}
                onChange={(event) =>
                  setSelectedAudienceOverride(event.target.value as "" | ComprehensiveProfileReportAudience)
                }
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs text-foreground"
              >
                <option value="">Auto-infer from chat</option>
                <option value="client">Client</option>
                <option value="social">Social</option>
                <option value="investor">Investor</option>
                <option value="executive">Executive</option>
              </select>
            </label>
          </div>

          <Button
            type="button"
            onClick={saveReportDraft}
            disabled={reportDraft.status === "saving"}
            className="mt-3 w-full"
            variant="secondary"
          >
            {reportDraft.status === "saving" ? "Saving report..." : "Save report draft"}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              const chatContent = document.getElementById('chat-container');
              if (chatContent) {
                const pdf = await generateMediaRichReport(chatContent.outerHTML);
                const link = document.createElement('a');
                link.href = pdf;
                link.download = 'media-report.pdf';
                link.click();
              }
            }}
            disabled={reportDraft.status === "saving"}
            className="mt-3 w-full"
            variant="secondary"
          >
            Download Media Report
          </Button>

          {reportDraft.message ? (
            <p className={`mt-2 text-xs ${reportDraft.status === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
              {reportDraft.message}
            </p>
          ) : null}

          {reportDownloadHref ? (
            <Link
              href={reportDownloadHref}
              className="mt-2 inline-block text-xs text-primary underline"
            >
              Download report
            </Link>
          ) : null}
        </div>

        {latestAssistantText ? (
          <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest output</p>
            <p className="mt-2 line-clamp-6 text-xs text-foreground">{latestAssistantText}</p>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
