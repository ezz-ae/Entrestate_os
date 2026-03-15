"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { useCopilot } from "@/components/copilot-provider"
import { motion, AnimatePresence } from "framer-motion"
import { MarqueePrompts } from "@/components/marketing/marquee-prompts"
import { authClient } from "@/lib/auth/client"
import {
  BarChart3,
  Bell,
  BookmarkPlus,
  Building2,
  CheckCircle2,
  FileText,
  Gauge,
  Layers,
  Loader2,
  Radar,
  Scale,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  WandSparkles,
  Activity,
  ArrowRight,
  Command,
  Globe,
  Paperclip,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_COMPREHENSIVE_PROFILE,
  getComprehensiveProfileFromSignals,
} from "@/lib/profile/comprehensive"
import { generateMediaRichReport } from "@/lib/artifacts/media-report"
import { TransactionNotification } from "@/components/dld/transaction-notification"
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
  stressScore: number | null
  price: number | null
  yield: number | null
  score: number | null
  developerReliabilityScore: number | null
  supplyResilienceScore: number | null
  liquidityResilienceScore: number | null
  pricingDisciplineScore: number | null
  handoverReliabilityScore: number | null
  areaStabilityScore: number | null
  paymentPlanScore: number | null
}

type DldNotificationRow = {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
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

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
}

function displayMessageText(message: any): string {
  const text = messageText(message)
  if (message?.role === "assistant") {
    const cleaned = stripThinkTags(text)
    if (cleaned.toLowerCase().includes("tool result is missing for tool call")) {
      return "Data retrieval failed. Please retry your request."
    }
    return cleaned
  }
  return text
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

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }
  return false
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
      { title: "Decision label", value: "-", subtitle: "STRONG_BUY · BUY · HOLD · WAIT · AVOID" },
      { title: "Data confidence", value: "-", subtitle: "HIGH · MEDIUM · LOW quality tier" },
    ]
  }

  const prices = rows
    .map((row) => toFiniteNumber(row.price_from ?? row.l1_canonical_price))
    .filter((value): value is number => value !== null && value > 0)
  const avgPrice = prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null

  const timingCounts = new Map<string, number>()
  for (const row of rows) {
    const timing = toText(row.timing_label ?? row.l3_timing_signal, "")
    if (!timing) continue
    timingCounts.set(timing, (timingCounts.get(timing) ?? 0) + 1)
  }
  const topTiming = [...timingCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"

  const decisionCounts = new Map<string, number>()
  for (const row of rows) {
    const decisionLabel = toText(row.decision_label_v1, "")
    if (!decisionLabel) continue
    decisionCounts.set(decisionLabel, (decisionCounts.get(decisionLabel) ?? 0) + 1)
  }
  const topDecision = [...decisionCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? topTiming

  const confidenceCounts = new Map<string, number>()
  for (const row of rows) {
    const confidence = toText(row.price_confidence ?? row.l1_confidence, "")
    if (!confidence) continue
    confidenceCounts.set(confidence, (confidenceCounts.get(confidence) ?? 0) + 1)
  }
  const topConfidence = [...confidenceCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"

  const scoreValues = rows
    .map((row) => toFiniteNumber(row.investor_score_v1 ?? row.engine_god_metric))
    .filter((value): value is number => value !== null)
  const avgScore = scoreValues.length > 0 ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length : null

  return [
    { title: "Matched projects", value: rows.length.toLocaleString(), subtitle: "From live inventory scan" },
    { title: "Avg asking price", value: formatAed(avgPrice), subtitle: "Across matched results" },
    { title: "Decision label", value: topDecision, subtitle: `Timing label lead: ${topTiming}` },
    { title: "Data confidence", value: topConfidence, subtitle: `Avg investor score: ${formatMetric(avgScore)}` },
  ]
}

function deriveComparisonRows(toolOutputs: Record<string, unknown>[]): ComparisonRow[] {
  const rows = toolOutputs
    .flatMap((output) => toRows(output.rows))
    .filter((row) => typeof row.name === "string" || typeof row.project_name === "string")

  const unique = new Map<string, ComparisonRow>()
  for (const row of rows) {
    const label = toText(row.name ?? row.project_name)
    if (!label || unique.has(label)) continue

    unique.set(label, {
      label,
      area: toText(row.final_area === null ? row.area : row.final_area),
      developer: toText(row.developer),
      confidence: toText(row.price_confidence ?? row.l1_confidence),
      timingSignal: toText(row.timing_label ?? row.l3_timing_signal),
      stressGrade: toText(row.stress_grade_v1 ?? row.l2_stress_test_grade),
      stressScore: toFiniteNumber(row.stress_score ?? row.engine_stress_test),
      price: toFiniteNumber(row.price_from ?? row.l1_canonical_price),
      yield: toFiniteNumber(row.rental_yield ?? row.l1_canonical_yield),
      score: toFiniteNumber(row.investor_score_v1 ?? row.engine_god_metric),
      developerReliabilityScore: toFiniteNumber(row.developer_reliability_score ?? row.l2_developer_reliability),
      supplyResilienceScore: toFiniteNumber(row.supply_resilience_score),
      liquidityResilienceScore: toFiniteNumber(row.liquidity_resilience_score),
      pricingDisciplineScore: toFiniteNumber(row.pricing_discipline_score),
      handoverReliabilityScore: toFiniteNumber(row.handover_reliability_score),
      areaStabilityScore: toFiniteNumber(row.area_stability_score),
      paymentPlanScore: toFiniteNumber(row.payment_plan_score),
    })

    if (unique.size >= 8) break
  }

  return [...unique.values()]
}

function deriveDldNotifications(toolOutputs: Record<string, unknown>[]): DldNotificationRow[] {
  const notifications: DldNotificationRow[] = []

  for (let index = toolOutputs.length - 1; index >= 0; index -= 1) {
    const output = toolOutputs[index]
    const source = typeof output.source === "string" ? output.source : ""
    const rows = toRows(output.rows)
    if (rows.length === 0) continue

    const isDldFeedSource = source.includes("dld_transaction_feed")

    for (const row of rows) {
      const headline = typeof row.headline === "string" ? row.headline.trim() : ""
      const amount = toFiniteNumber(row.amount)
      if (!headline || amount === null) continue
      if (!isDldFeedSource && !("subline" in row || "badge" in row || "is_notable" in row)) continue

      notifications.push({
        headline,
        subline: typeof row.subline === "string" ? row.subline : "",
        amount,
        badge: typeof row.badge === "string" ? row.badge : null,
        reg_type: typeof row.reg_type === "string" ? row.reg_type : "Ready",
        prop_type: typeof row.prop_type === "string" ? row.prop_type : "Unit",
        is_notable: toBoolean(row.is_notable),
      })

      if (notifications.length >= 8) {
        return notifications
      }
    }
  }

  return notifications
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
    prompt: "Find 2BR projects under AED 2M with BUY timing label and stress grade A or B. Rank by investor_score_v1 and show yield for each.",
    icon: Search,
  },
  {
    label: "Compare Markets",
    description: "Side-by-side analysis of areas or projects across price, yield, and risk metrics.",
    example: "Dubai Marina vs JBR: yield, risk, and timing",
    prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing label. Which is the better entry point right now and why?",
    icon: Scale,
  },
  {
    label: "Stress Test",
    description: "Review real V1 stress grades, scores, and resilience sub-scores for live projects.",
    example: "Show Marina Vista V1 stress grade and sub-scores",
    prompt: "Show the real V1 stress profile for Marina Vista. Return stress_score, stress_grade_v1, developer_reliability_score, supply_resilience_score, liquidity_resilience_score, pricing_discipline_score, handover_reliability_score, area_stability_score, and payment_plan_score.",
    icon: SlidersHorizontal,
  },
  {
    label: "Investor Memo",
    description: "Generate a structured due diligence brief with price reality, developer track record, and risk verdict.",
    example: "Full memo: Marina Vista — pricing, risk, verdict",
    prompt: "Generate a full investor memo for Marina Vista. Include: price reality check versus area average, developer reliability score, stress grade assessment, timing label context, and final investment verdict.",
    icon: FileText,
  },
]

const commandPrompts = [
  {
    label: "Screen",
    prompt: "Find 2BR projects under AED 2M with BUY timing label and stress grade A or B. Rank by investor_score_v1.",
    icon: Search,
  },
  {
    label: "Compare",
    prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing label. Which is the better entry point?",
    icon: Scale,
  },
  {
    label: "Stress test",
    prompt: "Show Marina Vista stress_score, stress_grade_v1, timing_label, investor_score_v1, and all real V1 resilience sub-scores.",
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
        ? `Compare ${selectedRow.label} with top alternatives in ${selectedRow.area} using price, yield, stress grade, and timing label.`
        : "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing label.",
  },
  {
    id: "screen",
    title: "/screen",
    description: "Find ranked projects with constraints.",
    icon: Search,
    buildPrompt: () =>
      "Find 2BR projects under AED 2M with BUY timing label and stress grade A or B. Rank by investor_score_v1.",
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
    id: "risk",
    title: "/risk",
    description: "Show real V1 stress metrics.",
    icon: SlidersHorizontal,
    buildPrompt: ({ selectedRow }) =>
      `Show the real V1 stress profile for ${selectedRow?.label ?? "Marina Vista"}. Return stress_score, stress_grade_v1, timing_label, investor_score_v1, decision_label_v1, and all V1 resilience sub-scores.`,
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
  const { data: session } = authClient.useSession()
  const canUpload = Boolean(session?.user)
  const searchParams = useSearchParams()
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
  const [slashActiveIndex, setSlashActiveIndex] = useState(0)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [activeCanvasTab, setActiveCanvasTab] = useState<"overview" | "projects" | "simulator" | "transactions" | "export">("overview")
  const prevComparisonCount = useRef(0)
  const prevDldCount = useRef(0)
  const prevSelectedProject = useRef("")
  const initialPromptRef = useRef<string | null>(null)

  const { messages, sendMessage, status, error, stop } = useCopilot()

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
  const submitBlocked = input.trim().length === 0 || chatBlocked || isBusy
  const usageStatusLabel = useMemo(() => {
    if (limit === null) return "Unlimited · ⌘↵ to send"
    if (chatBlocked) {
      return "Usage cooling down · ⌘↵ to send"
    }
    return "Free access · ⌘↵ to send"
  }, [chatBlocked, limit])

  const toolOutputs = useMemo(() => extractToolOutputs(messages as any[]), [messages])
  const workspaceCards = useMemo(() => deriveWorkspaceCards(toolOutputs), [toolOutputs])
  const comparisonRows = useMemo(() => deriveComparisonRows(toolOutputs), [toolOutputs])
  const dldNotifications = useMemo(() => deriveDldNotifications(toolOutputs), [toolOutputs])
  const dataFreshness = useMemo(() => resolveDataFreshness(toolOutputs), [toolOutputs])

  const latestAssistantMessage = useMemo(() => {
    const assistant = [...(messages as any[])].reverse().find((message) => message.role === "assistant")
    return assistant ?? null
  }, [messages])

  const latestAssistantText = useMemo(() => {
    if (!latestAssistantMessage) return ""
    return displayMessageText(latestAssistantMessage)
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

  // Auto-switch canvas tab when new data arrives
  useEffect(() => {
    if (comparisonRows.length > prevComparisonCount.current) {
      setActiveCanvasTab("projects")
    }
    prevComparisonCount.current = comparisonRows.length
  }, [comparisonRows.length])

  useEffect(() => {
    if (dldNotifications.length > prevDldCount.current) {
      setActiveCanvasTab("transactions")
    }
    prevDldCount.current = dldNotifications.length
  }, [dldNotifications.length])

  useEffect(() => {
    if (selectedProject && selectedProject !== prevSelectedProject.current) {
      setActiveCanvasTab("simulator")
    }
    prevSelectedProject.current = selectedProject
  }, [selectedProject])

  const selectedRow = useMemo(
    () => comparisonRows.find((row) => row.label === selectedProject) ?? null,
    [comparisonRows, selectedProject],
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

  const riskMetrics = useMemo(() => {
    if (!selectedRow) return null

    return [
      { label: "Stress score", value: formatMetric(selectedRow.stressScore) },
      { label: "Stress grade", value: selectedRow.stressGrade || "-" },
      { label: "Timing label", value: selectedRow.timingSignal || "-" },
      { label: "Investor score", value: formatMetric(selectedRow.score) },
      { label: "Developer reliability", value: formatMetric(selectedRow.developerReliabilityScore) },
      { label: "Supply resilience", value: formatMetric(selectedRow.supplyResilienceScore) },
      { label: "Liquidity resilience", value: formatMetric(selectedRow.liquidityResilienceScore) },
      { label: "Pricing discipline", value: formatMetric(selectedRow.pricingDisciplineScore) },
      { label: "Handover reliability", value: formatMetric(selectedRow.handoverReliabilityScore) },
      { label: "Area stability", value: formatMetric(selectedRow.areaStabilityScore) },
      { label: "Payment plan", value: formatMetric(selectedRow.paymentPlanScore) },
    ]
  }, [selectedRow])

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
        "Find BUY timing label projects under AED 2M in Dubai Marina with stress grade A or B.",
        "Which Dubai area offers the best yield-to-price ratio right now?",
        "Compare Emaar vs Damac reliability — which developer carries lower delivery risk?",
        "What does a BUY signal mean and how is it calculated in this platform?",
      ]
    }

    return [
      `Generate a full investor memo for ${selectedRow.label} — pricing, risk, developer track record, and verdict.`,
      `How does ${selectedRow.label} compare to top alternatives in ${selectedRow.area} on yield and risk grade?`,
      `Show the real V1 stress profile for ${selectedRow.label}, including all resilience sub-scores.`,
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

  const sendPrompt = async (prompt: string): Promise<boolean> => {
    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) return false

    if (isBusy) {
      setLimitMessage("Please wait for the current analysis to finish.")
      return false
    }

    if (chatBlocked) {
      setLimitMessage("Free usage is cooling down. Please try again soon.")
      return false
    }

    setLimitMessage(null)
    await sendMessage({ text: cleanedPrompt })

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

    return true
  }

  useEffect(() => {
    const promptParam = searchParams?.get("prompt") ?? searchParams?.get("q")
    if (!promptParam) return
    if (initialPromptRef.current === promptParam) return
    initialPromptRef.current = promptParam
    setInput(promptParam)

    if (!hasConversation) {
      void sendPrompt(promptParam).then((sent) => {
        if (sent) setInput("")
      })
    }
  }, [hasConversation, searchParams, sendPrompt])

  const activateSlashCommand = async (command: SlashCommand) => {
    const prompt = command.buildPrompt({ selectedRow })
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
        const submitted = await sendPrompt(value)
        if (submitted) {
          setInput("")
        }
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

    const submitted = await sendPrompt(value)
    if (submitted) {
      setInput("")
    }
  }

  const runRiskBriefInChat = async () => {
    if (!selectedRow) return

    const prompt = `Show the real V1 stress profile for ${selectedRow.label}. Return stress_score, stress_grade_v1, timing_label, investor_score_v1, decision_label_v1, developer_reliability_score, supply_resilience_score, liquidity_resilience_score, pricing_discipline_score, handover_reliability_score, area_stability_score, and payment_plan_score.`

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
            risk: riskMetrics,
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

      // Notify ReportNudge that a new report is available
      window.dispatchEvent(new CustomEvent("entrestate:report-created"))
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
    const placeholders = [
      "Ask anything about the real estate market...",
      "Find 2BR projects under AED 2M in Dubai Marina...",
      "Compare Emaar vs Damac reliability scores...",
      "What is the rental yield in Business Bay today?",
      "Show the V1 stress profile for Marina Vista...",
    ]

    return (
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          {/* ── Badge ── */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-primary bg-primary/5 rounded-full border border-primary/10 backdrop-blur-sm shadow-inner cursor-default group">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span className="tracking-wide uppercase">Neural Decision Engine v4.2</span>
              <div className="h-3 w-px bg-primary/20 mx-1" />
              <span className="text-primary/60 font-medium italic">Live UAE Data Feed</span>
            </div>
          </div>

          {/* ── Headline ── */}
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium text-foreground leading-[1.1] tracking-tight mb-8">
            The future of real estate<br />
            <span className="text-muted-foreground/40 italic">is intelligent.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mb-12 font-medium leading-relaxed">
            Screen properties, compare markets, and review real V1 stress signals with institutional-grade intelligence.
          </p>

          {/* ── Marquee ── */}
          <div className="w-full mb-16 select-none">
            <MarqueePrompts onPromptSelect={(prompt) => { void sendPrompt(prompt) }} />
          </div>

          {/* ── Example Chips ── */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 max-w-4xl">
            {capabilityCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => void sendPrompt(card.prompt)}
                className="px-6 py-3 bg-card/60 backdrop-blur-md hover:bg-card border border-border/40 hover:border-primary/40 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-95"
              >
                {card.label}
              </button>
            ))}
          </div>

          {/* ── Input Shell ── */}
          <div className="w-full max-w-3xl group mb-20">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200" />
              
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_8px_30px_rgba(47,90,166,0.1)] focus-within:border-primary/40 transition-all">
                <form onSubmit={submitMessage}>
                  <div className="relative min-h-[120px] p-2">
                    <Textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => { void onInputKeyDown(event) }}
                      placeholder="Describe your investment goal, budget, or a specific project to analyse…"
                      className="min-h-[120px] w-full bg-transparent border-0 focus-visible:ring-0 resize-none py-4 px-4 text-base relative z-10 shadow-none placeholder:text-muted-foreground/30"
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

                  <div className="flex items-center justify-between p-3 border-t border-border/10">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-xl"
                        disabled={!canUpload}
                        title={canUpload ? "Attach file" : "Log in to attach files"}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-xl">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        type="submit"
                        disabled={submitBlocked}
                        className="h-10 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        <span className="font-semibold">Analyze</span>
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DLD Transacted AED 4.2B Today
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Verified High Confidence Grade A/B only</span>
            </div>
          </div>

          {/* ── Writes, brainstorms... text ── */}
          <div className="mt-20 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground/90 leading-tight mb-6">
              Intelligence that <span className="text-primary italic">thinks</span> with you.
            </h2>
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4">
              Explore the Knowledge Engine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
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
              className="h-7 px-2.5 text-xs lg:hidden"
            >
              {canvasOpen ? "Hide canvas" : "Show canvas"}
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitBlocked}
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
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitBlocked}
            >
              <WandSparkles className="h-3 w-3" />
              <span className="max-w-48 truncate">{suggestion}</span>
            </button>
          ))}
        </div>

        <div id="chat-container" className="relative z-10 h-[58vh] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-background/55 p-3 backdrop-blur-sm md:h-[60vh] lg:h-[65vh]">
          {(messages as any[]).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
              Ask for anything real estate. Compare projects, simulate scenarios, draft reports, and run live intelligence from one chat.
            </div>
          ) : null}

          {(messages as any[]).map((message) => {
            const cleanMessage = message.role === "assistant"
              ? stripThinkTags(messageText(message))
              : displayMessageText(message)

            return (
              <div
                key={message.id}
                className={`animate-msg-in ${message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[95%]"}`}
              >
                {message.role === "user" ? (
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/85 px-4 py-3 text-sm text-primary-foreground shadow-[0_12px_24px_-14px_rgba(37,99,235,0.5)]">
                    {cleanMessage || "..."}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background/95 via-card/90 to-background/85 px-4 py-3.5 text-sm text-foreground shadow-[0_16px_28px_-18px_rgba(56,189,248,0.3)]">
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </p>
                    <ChatMarkdown text={cleanMessage || "Running analysis..."} />
                  </div>
                )}
              </div>
            )
          })}

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
            {limitMessage}
          </p>
        ) : null}

        {!limitMessage && isLimitError ? (
          <p className="mt-3 text-sm text-amber-600">
            Free usage is cooling down. Please try again soon.
          </p>
        ) : null}

        {error && !isLimitError ? <p className="mt-3 text-sm text-red-500">{error.message}</p> : null}
      </section>

      <aside className={`overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-5 lg:sticky lg:top-28 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:block ${canvasOpen ? "block" : "hidden"}`}>

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
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">DLD Notification Feed</p>
          </div>

          {dldNotifications.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ask for notable DLD deals to populate live transaction notifications.</p>
          ) : (
            <div className="space-y-2">
              {dldNotifications.map((txn, index) => (
                <TransactionNotification key={`chat-dld-${index}-${txn.headline}`} txn={txn} />
              ))}
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
            <p className="text-xs font-semibold text-foreground">V1 Risk Breakdown</p>
          </div>

          {!selectedRow ? (
            <p className="text-xs text-muted-foreground">Select a project from the comparison table to review its real V1 stress metrics.</p>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground">{selectedRow.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selectedRow.area} • {selectedRow.developer}
              </p>

              {riskMetrics ? (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {riskMetrics.map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button type="button" className="mt-3 w-full gap-1.5" variant="secondary" onClick={() => void runRiskBriefInChat()}>
                <TrendingUp className="h-3.5 w-3.5" />
                Open V1 risk brief in AI chat
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
