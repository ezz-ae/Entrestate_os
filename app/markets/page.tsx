"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ExplorerChat } from "@/components/explorer-chat"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { sendExplorerChatMessage, useExplorerChatStore } from "@/lib/explorer-chat-store"
import type { MarketScoreSummary } from "@/lib/market-score/types"
import { getSavedSearchById, saveSearch, removeSavedSearch } from "@/lib/saved-searches"
import {
  ArrowRight,
  Sparkles,
  BookmarkPlus,
  Copy,
  Download,
  CornerDownRight,
  Play,
  ChevronDown,
  Layers,
  Info,
} from "lucide-react"

/* ================================================================
   SCRIPTS — short labels, full detail only on expand
   ================================================================ */

interface ScriptInput {
  id: string
  label: string
  placeholder: string
  type: "text" | "select" | "number" | "range"
  options?: string[]
  suffix?: string
}

interface Script {
  label: string
  detail: string
  depth: "starter" | "advanced" | "premium"
  inputs?: ScriptInput[]
}

interface Category {
  id: string
  name: string
  color: string
  scripts: Script[]
}

const categories: Category[] = [
  {
    id: "discover",
    name: "Property Discovery",
    color: "border-l-blue-500",
    scripts: [
      { label: "Under budget + proven yield", detail: "Find apartments under budget with proven yield", depth: "starter", inputs: [
        { id: "budget", label: "Max Budget", placeholder: "1,000,000", type: "number", suffix: "AED" },
        { id: "yield", label: "Min Yield", placeholder: "6", type: "number", suffix: "%" },
        { id: "area", label: "Area", placeholder: "Any area", type: "text" },
      ]},
      { label: "By feature + delivery year", detail: "Studios with specific features delivered recently", depth: "starter", inputs: [
        { id: "feature", label: "Feature", placeholder: "e.g. balcony, sea view", type: "text" },
        { id: "area", label: "Area", placeholder: "e.g. JVC, Marina", type: "text" },
        { id: "years", label: "Delivered within", placeholder: "2", type: "number", suffix: "years" },
      ]},
      { label: "Below area median", detail: "Units below area median price by bedroom type", depth: "starter", inputs: [
        { id: "bedrooms", label: "Bedrooms", placeholder: "2", type: "select", options: ["Studio", "1", "2", "3", "4+"] },
        { id: "area", label: "Area", placeholder: "e.g. Business Bay", type: "text" },
      ]},
      { label: "Villa match under budget", detail: "Villas matching criteria under budget", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Dubai Hills", type: "text" },
        { id: "bedrooms", label: "Min Bedrooms", placeholder: "4", type: "number" },
        { id: "budget", label: "Max Budget", placeholder: "5,000,000", type: "number", suffix: "AED" },
      ]},
      { label: "Listed near DLD trade price", detail: "Ready units where listed price is near DLD traded value", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. JLT", type: "text" },
        { id: "gap", label: "Max Price Gap", placeholder: "10", type: "number", suffix: "%" },
      ]},
      { label: "Off-plan by developer + year", detail: "Off-plan projects by developer delivering soon", depth: "starter", inputs: [
        { id: "developer", label: "Developer", placeholder: "e.g. Emaar", type: "text" },
        { id: "year", label: "Delivery Year", placeholder: "2025", type: "select", options: ["2025", "2026", "2027", "2028"] },
      ]},
      { label: "Townhouses under budget", detail: "Townhouses in area under budget", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Dubailand", type: "text" },
        { id: "budget", label: "Max Budget", placeholder: "2,000,000", type: "number", suffix: "AED" },
      ]},
      { label: "Near landmark + radius", detail: "Properties near landmark within radius", depth: "advanced", inputs: [
        { id: "landmark", label: "Near", placeholder: "e.g. Dubai Metro", type: "text" },
        { id: "radius", label: "Radius", placeholder: "1", type: "number", suffix: "km" },
      ]},
      { label: "Low vacancy buildings", detail: "Units in buildings with low vacancy rate", depth: "advanced", inputs: [
        { id: "vacancy", label: "Max Vacancy", placeholder: "20", type: "number", suffix: "%" },
      ]},
      { label: "Recent price drops", detail: "Properties where price dropped recently", depth: "advanced", inputs: [
        { id: "drop", label: "Min Drop", placeholder: "10", type: "number", suffix: "%" },
        { id: "period", label: "Period", placeholder: "6 months", type: "select", options: ["3 months", "6 months", "12 months"] },
      ]},
      { label: "High floor + view", detail: "High-floor units with view under budget", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Marina", type: "text" },
        { id: "floor", label: "Min Floor", placeholder: "20", type: "number" },
        { id: "budget", label: "Max Budget", placeholder: "2,000,000", type: "number", suffix: "AED" },
      ]},
      { label: "New launches under price", detail: "New projects launched recently under starting price", depth: "starter", inputs: [
        { id: "period", label: "Launched in", placeholder: "Q4 2024", type: "select", options: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025"] },
        { id: "budget", label: "Max Price", placeholder: "1,500,000", type: "number", suffix: "AED" },
      ]},
    ],
  },
  {
    id: "compare",
    name: "Compare",
    color: "border-l-emerald-500",
    scripts: [
      { label: "Area vs Area", detail: "Compare two areas for investment", depth: "starter", inputs: [
        { id: "area1", label: "Area A", placeholder: "e.g. JVC", type: "text" },
        { id: "area2", label: "Area B", placeholder: "e.g. Business Bay", type: "text" },
        { id: "type", label: "Unit Type", placeholder: "Studio", type: "select", options: ["Studio", "1BR", "2BR", "3BR", "Villa"] },
      ]},
      { label: "Listing-to-trade gap", detail: "Compare two areas by listing-to-trade gap", depth: "starter", inputs: [
        { id: "area1", label: "Area A", placeholder: "e.g. Downtown", type: "text" },
        { id: "area2", label: "Area B", placeholder: "e.g. Marina", type: "text" },
      ]},
      { label: "Developer vs Developer", detail: "Compare two developers side by side", depth: "starter", inputs: [
        { id: "dev1", label: "Developer A", placeholder: "e.g. Emaar", type: "text" },
        { id: "dev2", label: "Developer B", placeholder: "e.g. DAMAC", type: "text" },
      ]},
      { label: "Off-plan vs ready yields", detail: "Off-plan vs ready yields in area", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Dubai Hills", type: "text" },
      ]},
      { label: "Cheapest buildings ranked", detail: "Compare cheapest buildings in area by trade price", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. JLT", type: "text" },
        { id: "count", label: "How many", placeholder: "5", type: "number" },
      ]},
      { label: "Absorption + days on market", detail: "Compare areas on absorption, days on market, yield", depth: "advanced", inputs: [
        { id: "area1", label: "Area A", placeholder: "e.g. Dubai South", type: "text" },
        { id: "area2", label: "Area B", placeholder: "e.g. JVC", type: "text" },
      ]},
      { label: "Emirates by villa value", detail: "Compare emirates by villa value per sqft", depth: "starter", inputs: [
        { id: "e1", label: "Emirate A", placeholder: "e.g. Fujairah", type: "text" },
        { id: "e2", label: "Emirate B", placeholder: "e.g. Ajman", type: "text" },
      ]},
      { label: "Waterfront projects over time", detail: "Compare developer waterfront projects over time", depth: "advanced", inputs: [
        { id: "dev1", label: "Developer A", placeholder: "e.g. Nakheel", type: "text" },
        { id: "dev2", label: "Developer B", placeholder: "e.g. Meraas", type: "text" },
      ]},
      { label: "High-rise vs mid-rise", detail: "High-rise vs mid-rise value retention in area", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Marina", type: "text" },
      ]},
      { label: "Top projects per emirate", detail: "Compare top projects per emirate by proven yield", depth: "premium", inputs: [
        { id: "count", label: "Top per emirate", placeholder: "3", type: "number" },
      ]},
    ],
  },
  {
    id: "invest",
    name: "Investment Analysis",
    color: "border-l-amber-500",
    scripts: [
      { label: "Best yield under budget", detail: "Best proven yield properties under budget across UAE", depth: "starter", inputs: [
        { id: "budget", label: "Max Budget", placeholder: "1,000,000", type: "number", suffix: "AED" },
      ]},
      { label: "Cash-on-cash with payment plan", detail: "Cash-on-cash return for off-plan with payment plan", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. MBR City", type: "text" },
        { id: "plan", label: "Payment Split", placeholder: "60/40", type: "select", options: ["50/50", "60/40", "70/30", "80/20"] },
      ]},
      { label: "Yield above threshold (DLD backed)", detail: "Areas with yield above threshold backed by DLD data", depth: "starter", inputs: [
        { id: "yield", label: "Min Yield", placeholder: "7", type: "number", suffix: "%" },
      ]},
      { label: "Portfolio builder", detail: "Build a portfolio to maximize yield across areas", depth: "premium", inputs: [
        { id: "budget", label: "Total Budget", placeholder: "3,000,000", type: "number", suffix: "AED" },
        { id: "areas", label: "Number of Areas", placeholder: "3", type: "number" },
      ]},
      { label: "Break-even timeline", detail: "Break-even timeline at current rental rate", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Dubai Hills", type: "text" },
        { id: "type", label: "Unit Type", placeholder: "2BR", type: "select", options: ["Studio", "1BR", "2BR", "3BR", "Villa"] },
      ]},
      { label: "Service charge impact", detail: "Service charge impact on net yield — top buildings by fee", depth: "advanced", inputs: [
        { id: "count", label: "How many", placeholder: "10", type: "number" },
      ]},
      { label: "Rent covers mortgage?", detail: "Properties where rent covers mortgage percentage", depth: "advanced", inputs: [
        { id: "coverage", label: "Min Coverage", placeholder: "80", type: "number", suffix: "%" },
      ]},
      { label: "Capital appreciation leaders", detail: "Capital appreciation leaders by area and type", depth: "starter", inputs: [
        { id: "from", label: "From", placeholder: "2022", type: "select", options: ["2020", "2021", "2022", "2023"] },
        { id: "to", label: "To", placeholder: "2024", type: "select", options: ["2023", "2024", "2025"] },
      ]},
      { label: "Advertised vs actual yield", detail: "Which studios actually achieve advertised yields?", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "Any area", type: "text" },
      ]},
      { label: "Risk-adjusted yield ranking", detail: "Rank areas by risk-adjusted yield", depth: "premium", inputs: [
        { id: "type", label: "Unit Type", placeholder: "Any", type: "select", options: ["Any", "Studio", "1BR", "2BR", "3BR", "Villa"] },
      ]},
    ],
  },
  {
    id: "whatif",
    name: "What-If Scenarios",
    color: "border-l-rose-500",
    scripts: [
      { label: "If I wait X months?", detail: "If I wait, what happens to prices based on velocity?", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. JVC", type: "text" },
        { id: "months", label: "Wait", placeholder: "6", type: "number", suffix: "months" },
      ]},
      { label: "If rates go up?", detail: "If rates go up, which areas lose buyers first?", depth: "advanced", inputs: [
        { id: "increase", label: "Rate Increase", placeholder: "1", type: "number", suffix: "%" },
      ]},
      { label: "Off-plan now vs ready", detail: "Off-plan now vs ready — total cost over years", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Dubai Hills", type: "text" },
        { id: "years", label: "Over", placeholder: "5", type: "number", suffix: "years" },
      ]},
      { label: "Metro impact radius", detail: "If metro opens, what is the price impact radius?", depth: "premium", inputs: [
        { id: "location", label: "Location", placeholder: "e.g. Dubai South", type: "text" },
      ]},
      { label: "If vacancy doubles?", detail: "If vacancy doubles, how far does yield drop?", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Marina", type: "text" },
      ]},
      { label: "Negotiate below DLD average?", detail: "If I negotiate below asking, am I at or below DLD average?", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. JBR", type: "text" },
        { id: "discount", label: "Discount", placeholder: "15", type: "number", suffix: "%" },
      ]},
      { label: "New supply impact", detail: "What happens to area if X new units deliver next quarter?", depth: "advanced", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Business Bay", type: "text" },
        { id: "units", label: "New Units", placeholder: "2000", type: "number" },
      ]},
      { label: "Rent vs buy over time", detail: "Rent vs buy comparison over time", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "e.g. Downtown", type: "text" },
        { id: "years", label: "Over", placeholder: "10", type: "number", suffix: "years" },
      ]},
      { label: "Service charge hike?", detail: "If service charges increase, which buildings become unprofitable?", depth: "premium", inputs: [
        { id: "increase", label: "Increase", placeholder: "20", type: "number", suffix: "%" },
      ]},
    ],
  },
  {
    id: "market",
    name: "Market Intelligence",
    color: "border-l-cyan-500",
    scripts: [
      { label: "Widest price gap areas", detail: "Areas with widest gap between portal price and DLD reality", depth: "starter", inputs: [
        { id: "count", label: "How many", placeholder: "5", type: "number" },
      ]},
      { label: "Listings growing > transactions", detail: "Where are listings growing faster than transactions?", depth: "advanced", inputs: [
        { id: "type", label: "Type", placeholder: "Any", type: "select", options: ["Any", "Apartment", "Villa", "Townhouse"] },
      ]},
      { label: "Negative momentum areas", detail: "Areas where price momentum just turned negative", depth: "advanced", inputs: [
        { id: "period", label: "Period", placeholder: "Last quarter", type: "select", options: ["Last month", "Last quarter", "Last 6 months"] },
      ]},
      { label: "Most stale listings", detail: "Buildings with most stale listings", depth: "advanced", inputs: [
        { id: "days", label: "Min Days", placeholder: "90", type: "number" },
      ]},
      { label: "Volume trend by area", detail: "Transaction volume trend by area", depth: "starter", inputs: [
        { id: "period", label: "Period", placeholder: "12 months", type: "select", options: ["6 months", "12 months", "24 months"] },
      ]},
      { label: "Oversupply signals", detail: "Listing-to-supply ratio above threshold", depth: "advanced", inputs: [
        { id: "ratio", label: "Min Ratio", placeholder: "2.5", type: "number", suffix: "x" },
      ]},
      { label: "Most honest pricing", detail: "Areas with most honest pricing (low gap)", depth: "starter", inputs: [
        { id: "gap", label: "Max Gap", placeholder: "10", type: "number", suffix: "%" },
      ]},
      { label: "Distressed sale indicators", detail: "Price drops + high days on market signals", depth: "premium" },
      { label: "Supply squeeze areas", detail: "Transactions up, listings down — squeeze areas", depth: "premium", inputs: [
        { id: "period", label: "Period", placeholder: "Last quarter", type: "select", options: ["Last month", "Last quarter", "Last 6 months"] },
      ]},
    ],
  },
  {
    id: "developer",
    name: "Developer Intelligence",
    color: "border-l-violet-500",
    scripts: [
      { label: "On-time delivery ranking", detail: "Rank top developers by on-time delivery rate", depth: "starter", inputs: [
        { id: "count", label: "How many", placeholder: "10", type: "number" },
      ]},
      { label: "Tightest asking-to-trade gap", detail: "Developers with tightest asking-to-trade price gap", depth: "advanced", inputs: [
        { id: "count", label: "How many", placeholder: "10", type: "number" },
      ]},
      { label: "Portfolio by area", detail: "Developer portfolio concentration by area", depth: "advanced", inputs: [
        { id: "developer", label: "Developer", placeholder: "e.g. DAMAC", type: "text" },
      ]},
      { label: "Price appreciation by developer", detail: "Average price appreciation by developer", depth: "starter", inputs: [
        { id: "years", label: "Over", placeholder: "3", type: "number", suffix: "years" },
      ]},
      { label: "New developers entering UAE", detail: "New developers entering UAE market by year", depth: "starter", inputs: [
        { id: "year", label: "Year", placeholder: "2024", type: "select", options: ["2022", "2023", "2024", "2025"] },
      ]},
      { label: "Off-plan appreciation pre-handover", detail: "Developer off-plan appreciation before handover", depth: "advanced", inputs: [
        { id: "developer", label: "Developer", placeholder: "Any", type: "text" },
      ]},
      { label: "Payment plan comparison", detail: "Payment plan comparison across active off-plan", depth: "starter", inputs: [
        { id: "area", label: "Area", placeholder: "Any area", type: "text" },
      ]},
      { label: "Post-handover price behavior", detail: "Post-handover price behavior by developer", depth: "premium", inputs: [
        { id: "developer", label: "Developer", placeholder: "Any", type: "text" },
      ]},
    ],
  },
  {
    id: "learn",
    name: "Learn & Understand",
    color: "border-l-neutral-400",
    scripts: [
      { label: "DLD yield vs advertised yield", detail: "How is DLD yield different from advertised yield?", depth: "starter" },
      { label: "Listing-to-supply ratio", detail: "What does listing-to-supply ratio actually measure?", depth: "starter" },
      { label: "Registration process", detail: "Explain the Dubai property registration process", depth: "starter" },
      { label: "Proximity discount", detail: "What is a proximity discount and why does it matter?", depth: "starter" },
      { label: "Off-plan payment plans", detail: "How do payment plans work for off-plan in UAE?", depth: "starter" },
      { label: "Service charge explained", detail: "What determines service charge and who sets it?", depth: "starter" },
      { label: "Freehold vs leasehold", detail: "Difference between freehold and leasehold in Dubai", depth: "starter" },
      { label: "Golden visa + property", detail: "How does golden visa connect to property investment?", depth: "starter" },
      { label: "Absorption rate", detail: "What is absorption rate and how to read it?", depth: "starter" },
      { label: "Price gap calculation", detail: "How we calculate price gap between portals and DLD", depth: "advanced" },
    ],
  },
  {
    id: "combo",
    name: "Smart Combinations",
    color: "border-l-blue-400",
    scripts: [
      { label: "Rate change + budget filter", detail: "If rates change, which projects still make sense under budget?", depth: "premium", inputs: [
        { id: "rate", label: "Rate Change", placeholder: "2", type: "number", suffix: "%" },
        { id: "budget", label: "Max Budget", placeholder: "2,000,000", type: "number", suffix: "AED" },
      ]},
      { label: "Yield + metro + rising area", detail: "Properties under budget with yield near metro in rising areas", depth: "premium", inputs: [
        { id: "budget", label: "Max Budget", placeholder: "1,000,000", type: "number", suffix: "AED" },
        { id: "yield", label: "Min Yield", placeholder: "7", type: "number", suffix: "%" },
      ]},
      { label: "Best developer + lowest gap + liquidity", detail: "Best developer, lowest gap area, highest liquidity type", depth: "premium" },
      { label: "Smart money signal", detail: "Price dropping but transactions rising — smart money areas", depth: "premium" },
      { label: "Delivery rate + low listing ratio", detail: "Off-plan where developer has high delivery rate in low listing area", depth: "premium", inputs: [
        { id: "delivery", label: "Min Delivery", placeholder: "90", type: "number", suffix: "%" },
      ]},
      { label: "Best combo for cash income", detail: "Best combination of area, type, and floor for cash income", depth: "premium", inputs: [
        { id: "cash", label: "Cash Available", placeholder: "500,000", type: "number", suffix: "AED" },
      ]},
      { label: "Cross-emirate arbitrage", detail: "Same developer, same layout, different price across emirates", depth: "premium", inputs: [
        { id: "developer", label: "Developer", placeholder: "e.g. Emaar", type: "text" },
        { id: "layout", label: "Layout", placeholder: "2BR", type: "select", options: ["Studio", "1BR", "2BR", "3BR"] },
      ]},
      { label: "Gap narrowing + rents rising", detail: "Buildings where gap is narrowing AND rentals are rising", depth: "premium" },
      { label: "Contrarian opportunities", detail: "Unpopular areas with strong fundamentals", depth: "premium", inputs: [
        { id: "count", label: "How many", placeholder: "5", type: "number" },
      ]},
      { label: "Diversified portfolio builder", detail: "Portfolio maximizing yield with area + developer diversification", depth: "premium", inputs: [
        { id: "budget", label: "Total Budget", placeholder: "5,000,000", type: "number", suffix: "AED" },
      ]},
      { label: "Areas to watch this quarter", detail: "Based on velocity + price + supply signals", depth: "premium" },
    ],
  },
]

const categoryMap = Object.fromEntries(categories.map((cat) => [cat.id, cat]))
const laneOptions = [
  {
    id: "discover",
    title: "Property discovery",
    summary: "Find units that match budget, yield, and delivery in minutes.",
    accent: "from-sky-500/15 via-slate-900/10 to-transparent",
    note: "Best for: budget + yield + delivery",
  },
  {
    id: "compare",
    title: "Compare",
    summary: "Put two areas, developers, or strategies side by side.",
    accent: "from-emerald-500/15 via-slate-900/10 to-transparent",
    note: "Best for: area vs area or developer checks",
  },
  {
    id: "invest",
    title: "Investment analysis",
    summary: "Check yield, break-even, and portfolio outcomes fast.",
    accent: "from-amber-400/20 via-slate-900/10 to-transparent",
    note: "Best for: ROI and portfolio planning",
  },
]

function MarketsContent() {
  const [query, setQuery] = useState("")
  const [activeScript, setActiveScript] = useState<{ cat: string; script: Script } | null>(null)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)
  const [resultRows, setResultRows] = useState<any[]>([])
  const [resultCount, setResultCount] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<MarketScoreSummary | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [activeLane, setActiveLane] = useState(laneOptions[0]?.id ?? "discover")
  const router = useRouter()
  const resultRef = useRef<HTMLDivElement>(null)
  const inputsRef = useRef<HTMLDivElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const {
    messages,
    setExplorerChatState,
  } = useExplorerChatStore()

  const hasConversation = useMemo(() => messages.some((msg) => msg.role === "user"), [messages])
  const lastUserMessage = useMemo(() => {
    const last = [...messages].reverse().find((msg) => msg.role === "user")
    return last?.content ?? ""
  }, [messages])
  const topSafetyBand = snapshot?.safetyDistribution?.reduce<{ label: string; count: number } | null>(
    (best, item) => (!best || item.count > best.count ? item : best),
    null,
  )?.label
  const safetyMix = snapshot?.safetyDistribution?.slice(0, 4) ?? []
  const statusHighlights = snapshot?.avgScoreByStatus
    ?.filter((item) => Number.isFinite(item.avgScore))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3) ?? []
  const hasResults = resultRows.length > 0
  const resultTones = ["bg-card/60", "bg-muted/30", "bg-secondary/30"]
  const activeLaneConfig = laneOptions.find((lane) => lane.id === activeLane) ?? laneOptions[0]
  const activeCategory = categoryMap[activeLaneConfig?.id ?? "discover"]
  const laneScripts = activeCategory?.scripts.slice(0, 4) ?? []

  useEffect(() => {
    const compareParam = searchParams.get("compare")
    if (!compareParam || hasConversation) return
    const [left, right] = compareParam.split("|").map((item) => item.trim())
    if (!left || !right) return

    setExplorerChatState({ isOpen: true, isMinimized: false })
    void sendExplorerChatMessage({
      query: `Compare ${left} vs ${right} for pricing, yield, delivery, and safety.`,
      quickSuggestions: [
        `Which area has better yield: ${left} or ${right}?`,
        `Delivery timing differences between ${left} and ${right}`,
        `Price gaps for studios in ${left} vs ${right}`,
      ],
    })
  }, [searchParams, hasConversation, setExplorerChatState])

  useEffect(() => {
    const savedParam = searchParams.get("saved")
    if (!savedParam) return
    const savedSearch = getSavedSearchById(savedParam)
    if (!savedSearch) return

    setSaved(true)
    setSavedEntryId(savedSearch.id)
    if (savedSearch.query) {
      setQuery(savedSearch.query)
    }
    if (savedSearch.category && savedSearch.scriptLabel) {
      const category = categoryMap[savedSearch.category]
      const script = category?.scripts.find((item) => item.label === savedSearch.scriptLabel)
      if (script) {
        setActiveScript({ cat: savedSearch.category, script })
      }
    }
    if (savedSearch.inputs) {
      setInputValues(savedSearch.inputs)
    }
  }, [searchParams])

  useEffect(() => {
    const controller = new AbortController()
    const loadSnapshot = async () => {
      setSnapshotLoading(true)
      setSnapshotError(null)
      try {
        const res = await fetch("/api/market-score/summary", { signal: controller.signal })
        if (!res.ok) throw new Error("Live snapshot unavailable")
        const data = await res.json()
        setSnapshot(data)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSnapshotError(error instanceof Error ? error.message : "Live snapshot unavailable")
      } finally {
        setSnapshotLoading(false)
      }
    }

    loadSnapshot()
    return () => controller.abort()
  }, [])

  function selectScript(catId: string, script: Script) {
    if (script.inputs && script.inputs.length > 0) {
      setActiveScript({ cat: catId, script })
      setInputValues({})
      setRunning(false)
      setQuery(script.detail)
      setSaved(false)
      setSavedEntryId(null)
      setTimeout(() => inputsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100)
    } else {
      setActiveScript({ cat: catId, script })
      setInputValues({})
      setRunning(true)
      setQuery(script.detail)
      setSaved(false)
      setSavedEntryId(null)
      void runSearch({})
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    }
  }

  function runScript() {
    setRunning(true)
    void runSearch(inputValues)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  function clearScript() {
    setActiveScript(null)
    setInputValues({})
    setRunning(false)
    setQuery("")
  }

  function handleSaveToggle() {
    if (saved && savedEntryId) {
      removeSavedSearch(savedEntryId)
      setSaved(false)
      setSavedEntryId(null)
      return
    }

    const label = activeScript?.script.label || query.trim() || "Explorer search"
    const detail = activeScript?.script.detail || (query.trim() ? "Custom Explorer query" : "Saved Explorer view")
    const trimmedInputs = Object.fromEntries(
      Object.entries(inputValues).filter(([, value]) => String(value ?? "").trim().length > 0),
    )
    const entry = {
      id: `saved_${Date.now()}`,
      label,
      detail,
      category: activeScript?.cat,
      scriptLabel: activeScript?.script.label,
      query: query.trim() || undefined,
      inputs: Object.keys(trimmedInputs).length > 0 ? trimmedInputs : undefined,
      createdAt: new Date().toISOString(),
    }
    saveSearch(entry)
    setSaved(true)
    setSavedEntryId(entry.id)
  }

  const buildResultsSummary = () => {
    const headline = `Explorer results: ${resultCount ?? resultRows.length} matches`
    const requestLabel = activeScript?.script.label || query.trim() || "Explorer request"
    const requestLine = `Request: ${requestLabel}`
    const inputSummary = Object.entries(inputValues)
      .filter(([, value]) => String(value ?? "").trim().length > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
    const inputsLine = inputSummary ? `Inputs: ${inputSummary}` : null
    const topRows = resultRows.slice(0, 6).map((row, index) => {
      const price = row.price_aed ? `AED ${Number(row.price_aed).toLocaleString()}` : "Price on request"
      const location = [row.area, row.city].filter(Boolean).join(", ") || "UAE"
      const status = row.status_band ?? "—"
      return `${index + 1}. ${row.name || row.asset_id} — ${location} — ${price} — ${status}`
    })
    return [headline, requestLine, inputsLine, ...topRows].filter(Boolean).join("\n")
  }

  const buildResultsCsv = () => {
    const headers = [
      "asset_id",
      "name",
      "developer",
      "city",
      "area",
      "status_band",
      "price_aed",
      "beds",
      "score_0_100",
      "safety_band",
      "classification",
    ]
    const escapeValue = (value: unknown) => {
      if (value === null || value === undefined) return ""
      const stringValue = String(value)
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }
    const lines = resultRows.map((row) => headers.map((header) => escapeValue(row[header])).join(","))
    return [headers.join(","), ...lines].join("\n")
  }

  const handleCopyResults = async () => {
    if (!hasResults || typeof navigator === "undefined") return
    try {
      await navigator.clipboard.writeText(buildResultsSummary())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleDownloadResults = () => {
    if (!hasResults || typeof window === "undefined") return
    const csv = buildResultsCsv()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `explorer-results-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleAction = (action: string) => {
    if (action === "Narrow this down further") {
      if (activeScript?.script.inputs?.length) {
        setRunning(false)
        setTimeout(() => inputsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100)
        return
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => heroInputRef.current?.focus(), 200)
      return
    }

    if (action === "Compare top results") {
      const candidates = Array.from(
        new Set(resultRows.map((row) => row.area || row.city).filter(Boolean)),
      )
      if (candidates.length < 2) return
      const [left, right] = candidates
      setExplorerChatState({ isOpen: true, isMinimized: false })
      void sendExplorerChatMessage({
        query: `Compare ${left} vs ${right} for pricing, yield, delivery, and safety.`,
        quickSuggestions: [
          `Which area has better yield: ${left} or ${right}?`,
          `Delivery timing differences between ${left} and ${right}`,
          `Price gaps for studios in ${left} vs ${right}`,
        ],
      })
      return
    }

    if (action === "Show the calculation") {
      const top = resultRows[0]
      const params = new URLSearchParams()
      if (top?.city) params.set("city", top.city)
      if (top?.area) params.set("area", top.area)
      const target = params.toString()
      router.push(target ? `/market-score?${target}` : "/market-score")
      return
    }

    if (action === "Save to saved searches") {
      if (!saved) {
        handleSaveToggle()
      }
      router.push("/workspace/saved-searches")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    clearScript()
    setExplorerChatState({ isOpen: true, isMinimized: false })
    void sendExplorerChatMessage({
      query: trimmed,
      quickSuggestions: [
        "Best yield under AED 2M in Dubai",
        "Compare Marina vs JBR for 2BR",
        "Projects delivering in 2025 with proven demand",
        "Studios under AED 800K in Business Bay",
      ],
    })
  }

  const quickShortcuts = [
    { catId: "discover", script: categories.find(c => c.id === "discover")?.scripts[0] },
    { catId: "compare", script: categories.find(c => c.id === "compare")?.scripts[0] },
    { catId: "invest", script: categories.find(c => c.id === "invest")?.scripts[0] },
    { catId: "whatif", script: categories.find(c => c.id === "whatif")?.scripts[0] },
  ].filter(item => item.script) as { catId: string; script: Script }[]

  const suggestionItems = [
    { catId: "discover", script: categories.find(c => c.id === "discover")?.scripts[1] },
    { catId: "compare", script: categories.find(c => c.id === "compare")?.scripts[2] },
    { catId: "invest", script: categories.find(c => c.id === "invest")?.scripts[0] },
    { catId: "whatif", script: categories.find(c => c.id === "whatif")?.scripts[0] },
    { catId: "market", script: categories.find(c => c.id === "market")?.scripts[0] },
  ].filter(item => item.script) as { catId: string; script: Script }[]

  const parseNumber = (value?: string) => {
    if (!value) return undefined
    const cleaned = value.replace(/[^0-9.]/g, "")
    const parsed = Number.parseFloat(cleaned)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const formatStatusBand = (value?: string | null) => {
    if (!value) return "—"
    const normalized = value.toLowerCase()
    if (normalized.includes("completed")) return "Ready / completed"
    if (normalized.includes("handover2025") || normalized === "2025") return "2025 delivery"
    if (normalized.includes("handover2026") || normalized === "2026") return "2026 delivery"
    if (normalized.includes("handover2027") || normalized === "2027") return "2027 delivery"
    if (normalized.includes("handover2028_29") || normalized.includes("2028") || normalized.includes("2029")) {
      return "2028-29 delivery"
    }
    if (normalized.includes("handover2030plus") || normalized.includes("2030")) return "2030+ delivery"
    return value
  }

  const mapStatusBand = (value?: string) => {
    if (!value) return ""
    const normalized = value.trim().toLowerCase()
    if (!normalized) return ""
    if (/(ready|completed)/.test(normalized)) return "Completed"
    if (normalized.includes("2030")) return "Handover2030Plus"
    if (normalized.includes("2029") || normalized.includes("2028")) return "Handover2028_29"
    if (normalized.includes("2027")) return "Handover2027"
    if (normalized.includes("2026")) return "Handover2026"
    if (normalized.includes("2025")) return "Handover2025"
    return ""
  }

  const mapHorizonYears = (value?: string) => {
    const parsed = parseNumber(value)
    if (!parsed) return ""
    if (parsed <= 1) return "Handover2025"
    if (parsed <= 2) return "Handover2026"
    if (parsed <= 3) return "Handover2027"
    if (parsed <= 4) return "Handover2028_29"
    return "Handover2030Plus"
  }

  const formatSnapshotNumber = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—"
    return value.toLocaleString()
  }

  const pickFirst = (values: Record<string, string>, keys: string[]) => {
    for (const key of keys) {
      if (values[key]) return values[key]
    }
    return ""
  }

  const runSearch = async (values: Record<string, string>) => {
    if (activeScript?.cat === "compare") {
      const areaLeft = values.area1?.trim()
      const areaRight = values.area2?.trim()
      const devLeft = values.dev1?.trim()
      const devRight = values.dev2?.trim()
      const emirateLeft = values.e1?.trim()
      const emirateRight = values.e2?.trim()

      if (areaLeft && areaRight) {
        router.push(`/workspace/comparisons?left=${encodeURIComponent(areaLeft)}&right=${encodeURIComponent(areaRight)}`)
        setRunning(false)
        return
      }

      if (devLeft && devRight) {
        setExplorerChatState({ isOpen: true, isMinimized: false })
        void sendExplorerChatMessage({
          query: `Compare ${devLeft} vs ${devRight} for delivery pace, pricing, and safety.`,
          quickSuggestions: [
            `Which developer has higher delivery confidence, ${devLeft} or ${devRight}?`,
            `Safety band mix for ${devLeft} vs ${devRight}`,
          ],
        })
        setRunning(false)
        return
      }

      if (emirateLeft && emirateRight) {
        setExplorerChatState({ isOpen: true, isMinimized: false })
        void sendExplorerChatMessage({
          query: `Compare ${emirateLeft} vs ${emirateRight} for villa value, pricing, and delivery.`,
          quickSuggestions: [
            `Where is villa value stronger: ${emirateLeft} or ${emirateRight}?`,
            `Delivery bands in ${emirateLeft} vs ${emirateRight}`,
          ],
        })
        setRunning(false)
        return
      }
    }

    setResultLoading(true)
    setResultError(null)
    try {
      const params = new URLSearchParams()
      const area = pickFirst(values, ["area", "area1", "area2", "location", "landmark"])
      const city = pickFirst(values, ["city", "emirate"])
      const developer = pickFirst(values, ["developer", "dev1", "dev2", "name"])
      const beds = pickFirst(values, ["bedrooms", "beds", "bedrooms_min", "type", "layout"])
      const yearValue = pickFirst(values, ["year"])
      const statusValue = pickFirst(values, ["status"])
      const statusBand =
        mapStatusBand(yearValue) ||
        mapStatusBand(statusValue) ||
        mapHorizonYears(values.years)
      const minPrice = parseNumber(values.min_price)
      const maxPrice = parseNumber(values.max_price) ?? parseNumber(values.budget)

      if (area) params.set("area", area)
      if (city) params.set("city", city)
      if (developer) params.set("developer", developer)
      if (beds) params.set("beds", beds)
      if (statusBand) params.set("status_band", statusBand)
      if (minPrice) params.set("minPrice", minPrice.toString())
      if (maxPrice) params.set("maxPrice", maxPrice.toString())
      params.set("limit", "12")

      const res = await fetch(`/api/markets?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load market results")
      const data = await res.json()
      setResultRows(data.results || [])
      setResultCount(data.total ?? 0)
    } catch (error) {
      setResultError(error instanceof Error ? error.message : "Failed to load results")
      setResultRows([])
      setResultCount(null)
    } finally {
      setResultLoading(false)
    }
  }

  return (
    <main id="main-content" className="bg-background min-h-screen">
      <Navbar />

      <div className="transition-[padding] duration-300 ease-out">
        {/* ===== HERO SEARCH ===== */}
        <section className={`relative overflow-hidden bg-background text-foreground ${running ? "pt-20 pb-10" : "pt-24 pb-16"}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(71,85,105,0.2),transparent_60%)]" />
          <div className="relative px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto">
            <div className="flex items-center justify-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                Rental & transaction data updated
              </div>
            </div>

          {!running && (
            <div className="mt-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent/80" />
                Explorer
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground">
                Where should we explore first?
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Ask a question, then use the packs below to go deeper.
              </p>
            </div>
          )}

          {!hasConversation ? (
            <form onSubmit={handleSubmit} className={`${running ? "mt-6" : "mt-8"}`}>
              <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-lg shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)]">
                <div className="px-6 pt-5 text-sm text-muted-foreground">
                  Discover what&apos;s possible
                </div>
                <div className="px-6 pb-4">
                  <input
                    type="text"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      if (activeScript) clearScript()
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    placeholder="Ask about pricing, yield, timing, or supply pressure"
                    className="w-full bg-transparent text-base sm:text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
                    ref={heroInputRef}
                    autoFocus
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-5 text-muted-foreground text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>13 packs ready</span>
                    </div>
                    <span className="text-muted-foreground/70">Live market data</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-2 text-muted-foreground hover:text-foreground">
                      UAE focus
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {activeScript ? (
                      <button type="button" onClick={clearScript} className="rounded-full border border-border/60 bg-background/40 px-4 py-2 text-muted-foreground hover:text-foreground">
                        Clear
                      </button>
                    ) : (
                      <button type="submit" className="rounded-full border border-border/60 bg-secondary/60 px-4 py-2 text-foreground hover:bg-secondary/80">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className={`${running ? "mt-6" : "mt-8"} rounded-3xl border border-border/60 bg-card/60 backdrop-blur-lg px-6 py-5`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Continue your Explorer conversation</p>
                  {lastUserMessage && (
                    <p className="text-xs text-muted-foreground/70 mt-2">Last request: {lastUserMessage}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExplorerChatState({ isOpen: true, isMinimized: false })}
                  className="rounded-full border border-border/60 bg-secondary/60 px-4 py-2 text-foreground hover:bg-secondary/80"
                >
                  Open chat
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {quickShortcuts.map((shortcut) => (
              <button
                key={shortcut.script.label}
                onClick={() => selectScript(shortcut.catId, shortcut.script)}
                className="rounded-full border border-border/60 bg-secondary/40 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20"
              >
                {shortcut.script.label}
              </button>
            ))}
          </div>

            {isFocused && !activeScript && !hasConversation && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-card/80">
                {suggestionItems.map((item) => (
                  <button
                    key={item.script.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectScript(item.catId, item.script)}
                    className="w-full text-left px-5 py-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b border-border/40 last:border-b-0"
                  >
                    {item.script.detail}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {!running && !activeScript && (
          <section className="px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto mt-10">
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-slate-500/10 via-background/50 to-background/80 p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Live market snapshot</p>
                    <h2 className="text-xl font-semibold text-foreground mt-2">Today&apos;s inventory posture</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {snapshot ? "Live feed connected" : snapshotLoading ? "Connecting…" : "Feed not ready"}
                  </span>
                </div>

                {snapshotLoading ? (
                  <div className="mt-6 text-sm text-muted-foreground">Loading live snapshot…</div>
                ) : snapshotError ? (
                  <div className="mt-6 text-sm text-amber-200">{snapshotError}</div>
                ) : snapshot ? (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Assets scored</p>
                      <p className="text-lg font-semibold text-foreground mt-2">
                        {formatSnapshotNumber(snapshot.totalAssets)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Average score</p>
                      <p className="text-lg font-semibold text-foreground mt-2">
                        {Number.isFinite(snapshot.avgScore) ? snapshot.avgScore.toFixed(1) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Top safety band</p>
                      <p className="text-sm font-medium text-foreground mt-2">{topSafetyBand ?? "—"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Conservative-ready</p>
                      <p className="text-sm font-medium text-foreground mt-2">
                        {formatSnapshotNumber(snapshot.conservativeReadyPool)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-sm text-muted-foreground">Live snapshot will appear here.</div>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Safety mix</p>
                <h3 className="text-lg font-semibold text-foreground mt-2">Where inventory sits right now</h3>
                <div className="mt-5 space-y-3">
                  {snapshotLoading ? (
                    <p className="text-sm text-muted-foreground">Loading safety mix…</p>
                  ) : snapshotError ? (
                    <p className="text-sm text-amber-200">{snapshotError}</p>
                  ) : safetyMix.length > 0 ? (
                    safetyMix.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.label}</span>
                          <span>{item.count.toLocaleString()} assets</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/40">
                          <div
                            className="h-2 rounded-full bg-primary/70"
                            style={{ width: `${Math.min(item.percent ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Safety mix will appear once live feed is ready.</p>
                  )}
                </div>

                {statusHighlights.length > 0 && (
                  <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Best scoring delivery bands</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {statusHighlights.map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span>{formatStatusBand(item.label)}</span>
                          <span className="text-foreground">{item.avgScore.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===== INPUT FORM ===== */}
        {activeScript && activeScript.script.inputs && activeScript.script.inputs.length > 0 && !running && (
          <div ref={inputsRef} className="px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto mt-8">
            <div className="rounded-2xl border border-border bg-card/80 p-6 sm:p-8">
              <p className="text-lg text-foreground font-medium mb-6">{activeScript.script.detail}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activeScript.script.inputs.map(inp => (
                  <div key={inp.id}>
                    <label className="text-base text-muted-foreground mb-2 block">{inp.label}</label>
                    {inp.type === "select" && inp.options ? (
                      <select
                        value={inputValues[inp.id] || ""}
                        onChange={e => setInputValues({ ...inputValues, [inp.id]: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="">{inp.placeholder}</option>
                        {inp.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          inputMode={inp.type === "number" ? "numeric" : "text"}
                          value={inputValues[inp.id] || ""}
                          onChange={e => setInputValues({ ...inputValues, [inp.id]: e.target.value })}
                          placeholder={inp.placeholder}
                          className={`w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary ${inp.suffix ? "pr-16" : ""}`}
                        />
                        {inp.suffix && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">{inp.suffix}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button onClick={runScript} className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors">
                  <Play className="w-4 h-4" />
                  Run
                </button>
                <button onClick={clearScript} className="px-5 py-3 text-base text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== RESULT ===== */}
        {running && (
          <div ref={resultRef} className="px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto mt-10 mb-16">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={handleSaveToggle}
                className={`p-2 rounded-lg transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <BookmarkPlus className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleCopyResults}
                disabled={!hasResults}
                className={`p-2 rounded-lg transition-colors ${
                  copied ? "text-primary" : "text-muted-foreground hover:text-foreground"
                } ${!hasResults ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Copy results summary"
                title={copied ? "Copied" : "Copy results summary"}
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleDownloadResults}
                disabled={!hasResults}
                className={`p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors ${
                  !hasResults ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Download results CSV"
                title="Download results CSV"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {activeScript?.script.inputs && (
                <div className="flex flex-wrap gap-3">
                  {activeScript.script.inputs.map(inp => (
                    inputValues[inp.id] ? (
                      <span key={inp.id} className="text-base text-foreground px-4 py-2 border border-border rounded-lg">
                        {inp.label}: <strong>{inputValues[inp.id]}{inp.suffix ? ` ${inp.suffix}` : ""}</strong>
                      </span>
                    ) : null
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card/80 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Results</p>
                    <p className="text-lg font-medium text-foreground">
                      {resultCount !== null ? `${resultCount.toLocaleString()} matches` : "Results"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Live inventory filtered by your request.
                  </p>
                </div>

                {resultLoading && (
                  <div className="mt-6 text-sm text-muted-foreground">Loading results...</div>
                )}
                {resultError && (
                  <div className="mt-6 text-sm text-amber-200">{resultError}</div>
                )}
                {!resultLoading && !resultError && resultRows.length === 0 && (
                  <div className="mt-6 text-sm text-muted-foreground">No matching projects found yet.</div>
                )}

                {!resultLoading && !resultError && resultRows.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {resultRows.map((row, index) => (
                      <div
                        key={row.asset_id}
                        className={`rounded-xl border border-border/60 p-4 ${resultTones[index % resultTones.length]}`}
                      >
                        <p className="text-sm font-semibold text-foreground">{row.name || row.asset_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {[row.area, row.city].filter(Boolean).join(", ")}
                        </p>
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                          <p>Delivery: {formatStatusBand(row.status_band)}</p>
                          <p>Safety: {row.safety_band ?? "—"}</p>
                          <p>Score: {row.score_0_100 ?? "—"}</p>
                        </div>
                        <div className="mt-3 text-sm text-foreground font-medium">
                          {row.price_aed ? `AED ${Number(row.price_aed).toLocaleString()}` : "Price on request"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Sources: DLD Transactions, Bayut, Property Finder, Rental Registry, Unit Records
              </div>

              <div className="pt-6 space-y-1">
                {["Narrow this down further", "Compare top results", "Show the calculation", "Save to saved searches"].map(action => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleAction(action)}
                    className="flex items-center gap-3 text-base text-muted-foreground hover:text-foreground py-3 transition-colors group"
                  >
                    <CornerDownRight className="w-4 h-4 group-hover:text-primary" />
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== FEATURED SMART COMBINATIONS ===== */}
        {!running && !activeScript && (
          <div className="px-6 sm:px-10 lg:px-16 max-w-[1440px] mx-auto mt-12 space-y-12">
          <section className="rounded-2xl border border-border/70 bg-card/60 p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Pick a lane</p>
                <h2 className="text-xl font-semibold text-foreground">Start with a clear decision path</h2>
              </div>
              <p className="text-xs text-muted-foreground">Short requests, no long forms.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[0.45fr_0.55fr] gap-6">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-2">
                {laneOptions.map((lane) => (
                  <button
                    key={lane.id}
                    type="button"
                    onClick={() => setActiveLane(lane.id)}
                    className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                      activeLane === lane.id
                        ? "border-foreground/30 bg-card/70 text-foreground"
                        : "border-border/60 bg-card/40 text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    <p className="text-sm font-medium">{lane.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lane.summary}</p>
                    <p className="text-[11px] text-muted-foreground mt-3">{lane.note}</p>
                  </button>
                ))}
              </div>

              <div
                className={`rounded-2xl border border-border/60 bg-gradient-to-br ${activeLaneConfig?.accent ?? "from-slate-500/10 to-transparent"} p-6`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected lane</p>
                    <h3 className="text-lg font-semibold text-foreground mt-2">
                      {activeLaneConfig?.title ?? "Decision path"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {activeLaneConfig?.summary ?? "Choose a request to begin."}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{activeLaneConfig?.note}</span>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {laneScripts.map((script) => (
                    <button
                      key={script.label}
                      onClick={() => selectScript(activeLaneConfig?.id ?? "discover", script)}
                      className="rounded-xl border border-border/60 bg-card/70 p-4 text-left hover:border-primary/30 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">{script.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{script.detail}</p>
                    </button>
                  ))}
                </div>

                {laneScripts[0] && (
                  <button
                    onClick={() => selectScript(activeLaneConfig?.id ?? "discover", laneScripts[0])}
                    className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                  >
                    Start with the top request
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="rounded-2xl border border-border/70 bg-background/40 p-7">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">What-if room</p>
                  <h2 className="text-xl font-semibold text-foreground">Pressure test the market</h2>
                </div>
                <p className="text-xs text-muted-foreground">Fast scenarios with short inputs.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(categoryMap.whatif?.scripts ?? []).slice(0, 4).map((script) => (
                  <button
                    key={script.label}
                    onClick={() => selectScript("whatif", script)}
                    className="rounded-xl border border-border/60 bg-card/70 p-4 text-left hover:border-accent/40 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">{script.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{script.detail}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Signal desks</p>
              <h2 className="text-xl font-semibold text-foreground mt-2">Market + developer signals</h2>
              <div className="mt-5 space-y-3">
                {(categoryMap.market?.scripts ?? []).slice(0, 3).map((script) => (
                  <button
                    key={script.label}
                    onClick={() => selectScript("market", script)}
                    className="w-full flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground hover:border-accent/40 transition-colors"
                  >
                    <span>{script.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {(categoryMap.developer?.scripts ?? []).slice(0, 2).map((script) => (
                  <button
                    key={script.label}
                    onClick={() => selectScript("developer", script)}
                    className="w-full flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground hover:border-accent/40 transition-colors"
                  >
                    <span>{script.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-7">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wider">Smart combinations</p>
            </div>
            <h2 className="text-xl font-semibold text-foreground">High-signal combinations</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Pre-built blends of pricing, yield, timing, and supply signals.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(categoryMap.combo?.scripts ?? []).slice(0, 4).map((script) => (
                <button
                  key={script.label}
                  onClick={() => selectScript("combo", script)}
                  className="text-left rounded-xl border border-primary/20 bg-background/40 hover:bg-primary/10 p-5 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{script.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{script.detail}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/60 p-7">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Learn & understand</p>
                <h2 className="text-xl font-semibold text-foreground">Get answers without the jargon</h2>
              </div>
              <Link href="/top-data" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View Top Data findings
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(categoryMap.learn?.scripts ?? []).slice(0, 6).map((script) => (
                <button
                  key={script.label}
                  onClick={() => selectScript("learn", script)}
                  className="text-left rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors"
                >
                  {script.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className={`pb-32 ${running ? "mt-16 pt-16 border-t border-border" : "mt-16"}`} />

      <Footer />
      </div>

      <ExplorerChat />
    </main>
  )
}

export default function MarketsPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content">
          <Navbar />
          <div className="pt-24 pb-20 md:pt-32 md:pb-32">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Explorer</p>
                <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
                  Markets
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Loading market explorer…
                </p>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      }
    >
      <MarketsContent />
    </Suspense>
  )
}
