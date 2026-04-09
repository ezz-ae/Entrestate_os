"use client"

import { useEffect, useState, use, useRef } from "react"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useLocale } from "next-intl"
import {
  ChevronLeft,
  FileText,
  Globe,
  Loader2,
  RefreshCcw,
  Share2,
  Sparkles,
  WandSparkles,
  Plus,
  Upload,
  Link2,
  Type,
  Mic,
  Send,
  Download,
  Headphones,
  Layers,
  Map,
  BarChart2,
  Brain,
  CheckSquare,
  PieChart,
  Table,
  Users,
  BookMarked,
  TrendingUp,
  AlertTriangle,
  Building2,
  ArrowUpDown,
  Zap,
  FileBarChart,
  FileSearch,
  Star,
  MessageSquare,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────

type BookPageStatus = "pending" | "generating" | "ready" | "error"
type BookPageType = "overview" | "transactions" | "comparison" | "opportunity" | "risk" | "memo" | "content"

type BookPage = {
  id: string
  type: BookPageType
  title: string
  rawText: string | null
  status: BookPageStatus
  updatedAt: string
}

type BookDetail = {
  id: string
  title: string
  subject: string
  type: string
  pageCount: number
  pages: BookPage[]
  updatedAt: string
}

type Source = {
  id: string
  label: string
  type: "url" | "pdf" | "text" | "audio" | "image"
  addedAt: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  ts: string
}

type OutputDef = {
  id: string
  icon: React.ElementType
  labelEn: string
  labelAr: string
  descEn: string
  descAr: string
  category: "analysis" | "client" | "media" | "data"
  status: "idle" | "generating" | "ready"
  accentColor: string
}

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    marketBookML:       "Market Book ML",
    share:              "Share",
    export:             "Export",
    sources:            "Sources",
    connected:          "connected",
    addSource:          "Add source",
    searchWeb:          "Search web",
    uploadFile:         "Upload file",
    addURL:             "Add URL",
    pasteText:          "Paste text",
    noSourcesYet:       "No sources yet",
    addDataToBook:      "Add data to power your book",
    placeholderURL:     "Paste URL…",
    placeholderFile:    "File name…",
    placeholderText:    "Paste or type…",
    add:                "Add",
    cancel:             "Cancel",
    subject:            "Subject",
    chat:               "Market Intelligence Chat",
    sourcesActive:      "sources active",
    askYourBook:        "Ask your Market Book",
    chatSubtitle:       "Powered by your sources and Entrestate's decision intelligence",
    chatPlaceholder:    "Ask about this market book…",
    studio:             "Studio",
    allOutputTypes:     "All Output Types",
    all:                "All",
    generate:           "Generate",
    building:           "Building…",
    exportBtn:          "Export",
    generateAll:        "Generate All Outputs",
    brandedNote:        "All outputs branded with Entrestate",
    opening:            "Opening Market Book…",
    notFound:           "Market Book not found",
    returnToLibrary:    "Return to Library",
    errorMsg:           "Unable to reach the intelligence engine. Try again.",
    doneMsg:            "Intelligence analysis complete.",
    panelSources:       "Sources",
    panelChat:          "Chat",
    panelStudio:        "Studio",
    quickPrompts: [
      "Summarise the key investment risks",
      "What is the timing signal for this area?",
      "Compare developer track records",
      "Give me a client-ready one-pager",
      "What do the DLD transactions reveal?",
    ],
    catLabels: {
      all:      "All",
      analysis: "Analysis",
      client:   "Client Files",
      media:    "Media",
      data:     "Data",
    },
    sourceTypes: { url: "URL", pdf: "PDF", text: "Text", audio: "Audio" },
  },
  ar: {
    marketBookML:       "كتاب السوق الذكي",
    share:              "مشاركة",
    export:             "تصدير",
    sources:            "المصادر",
    connected:          "متصل",
    addSource:          "إضافة مصدر",
    searchWeb:          "بحث على الويب",
    uploadFile:         "رفع ملف",
    addURL:             "إضافة رابط",
    pasteText:          "لصق نص",
    noSourcesYet:       "لا توجد مصادر بعد",
    addDataToBook:      "أضف بيانات لتشغيل كتابك",
    placeholderURL:     "الصق رابطاً…",
    placeholderFile:    "اسم الملف…",
    placeholderText:    "الصق أو اكتب…",
    add:                "إضافة",
    cancel:             "إلغاء",
    subject:            "الموضوع",
    chat:               "محادثة تحليل السوق",
    sourcesActive:      "مصادر نشطة",
    askYourBook:        "اسأل كتاب السوق الخاص بك",
    chatSubtitle:       "مدعوم بمصادرك ومنظومة قرار Entrestate",
    chatPlaceholder:    "اسأل عن هذا الكتاب…",
    studio:             "الاستوديو",
    allOutputTypes:     "جميع أنواع المخرجات",
    all:                "الكل",
    generate:           "توليد",
    building:           "جارٍ البناء…",
    exportBtn:          "تصدير",
    generateAll:        "توليد جميع المخرجات",
    brandedNote:        "جميع المخرجات تحمل علامة إنتريستيت",
    opening:            "جاري فتح كتاب السوق…",
    notFound:           "كتاب السوق غير موجود",
    returnToLibrary:    "العودة إلى المكتبة",
    errorMsg:           "تعذر الوصول إلى محرك التحليل. حاول مجدداً.",
    doneMsg:            "اكتمل التحليل.",
    panelSources:       "المصادر",
    panelChat:          "محادثة",
    panelStudio:        "الاستوديو",
    quickPrompts: [
      "لخّص مخاطر الاستثمار الرئيسية",
      "ما إشارة التوقيت لهذه المنطقة؟",
      "قارن سجلات المطورين",
      "أعطني ملخصاً جاهزاً للعميل",
      "ماذا تكشف معاملات دائرة الأراضي؟",
    ],
    catLabels: {
      all:      "الكل",
      analysis: "تحليلات",
      client:   "ملفات العملاء",
      media:    "وسائط",
      data:     "بيانات",
    },
    sourceTypes: { url: "رابط", pdf: "PDF", text: "نص", audio: "صوت" },
  },
}

// ─── Output Definitions ───────────────────────────────────────────────────────

const OUTPUT_DEFS: OutputDef[] = [
  {
    id: "investor-memo", icon: FileBarChart,
    labelEn: "Investor Memo",           labelAr: "مذكرة المستثمر",
    descEn:  "Full investment thesis with entry/exit, risk-adjusted returns",
    descAr:  "أطروحة استثمارية كاملة مع نقاط الدخول والخروج والعوائد المعدّلة للمخاطر",
    category: "analysis", status: "idle", accentColor: "text-blue-400",
  },
  {
    id: "area-brief", icon: Map,
    labelEn: "Area Brief",              labelAr: "موجز المنطقة",
    descEn:  "Hyperlocal market snapshot for a specific zone or cluster",
    descAr:  "لقطة سوقية محلية دقيقة لمنطقة أو تجمع معين",
    category: "analysis", status: "idle", accentColor: "text-emerald-400",
  },
  {
    id: "risk-report", icon: AlertTriangle,
    labelEn: "Risk Report",             labelAr: "تقرير المخاطر",
    descEn:  "Stress-graded exposure matrix with mitigation pathways",
    descAr:  "مصفوفة تعرض مصنّفة بالضغط مع مسارات التخفيف",
    category: "analysis", status: "idle", accentColor: "text-red-400",
  },
  {
    id: "price-reality", icon: TrendingUp,
    labelEn: "Price Reality Check",     labelAr: "فحص واقعية الأسعار",
    descEn:  "Market price vs actual DLD transaction delta analysis",
    descAr:  "تحليل الفجوة بين سعر السوق ومعاملات دائرة الأراضي الفعلية",
    category: "analysis", status: "idle", accentColor: "text-amber-400",
  },
  {
    id: "developer-dd", icon: Building2,
    labelEn: "Developer Due Diligence", labelAr: "العناية الواجبة بالمطور",
    descEn:  "Completion track record, delivery risk, handover history",
    descAr:  "سجل الإتمام، مخاطر التسليم، وتاريخ التسليم",
    category: "analysis", status: "idle", accentColor: "text-purple-400",
  },
  {
    id: "market-pulse", icon: BarChart2,
    labelEn: "Market Pulse Summary",    labelAr: "ملخص نبض السوق",
    descEn:  "Live read on demand signals, momentum, and timing",
    descAr:  "قراءة مباشرة لإشارات الطلب والزخم والتوقيت",
    category: "analysis", status: "idle", accentColor: "text-cyan-400",
  },
  {
    id: "comparison", icon: ArrowUpDown,
    labelEn: "Comparison Table",        labelAr: "جدول المقارنة",
    descEn:  "Side-by-side unit, project, or area comparison matrix",
    descAr:  "مصفوفة مقارنة جانبية للوحدات أو المشاريع أو المناطق",
    category: "analysis", status: "idle", accentColor: "text-indigo-400",
  },
  {
    id: "client-decision", icon: Users,
    labelEn: "Client Decision File",    labelAr: "ملف قرار العميل",
    descEn:  "Curated briefing package ready to share with buyers or clients",
    descAr:  "حزمة إحاطة منسّقة جاهزة للمشاركة مع المشترين أو العملاء",
    category: "client", status: "idle", accentColor: "text-rose-400",
  },
  {
    id: "full-study", icon: BookMarked,
    labelEn: "Full Study File",         labelAr: "ملف الدراسة الكاملة",
    descEn:  "Comprehensive 360° deep-dive spanning fundamentals to strategy",
    descAr:  "غوص شامل 360° من الأساسيات إلى الاستراتيجية",
    category: "client", status: "idle", accentColor: "text-violet-400",
  },
  {
    id: "opportunity-brief", icon: Star,
    labelEn: "Opportunity Brief",       labelAr: "موجز الفرصة",
    descEn:  "Concise buy/hold/wait rationale for a specific asset",
    descAr:  "مبرر موجز للشراء/الاحتجاز/الانتظار لأصل معين",
    category: "client", status: "idle", accentColor: "text-yellow-400",
  },
  {
    id: "audio-overview", icon: Headphones,
    labelEn: "Audio Overview",          labelAr: "ملخص صوتي",
    descEn:  "Spoken intelligence digest — market summary in audio form",
    descAr:  "ملخص تحليلي منطوق — ملخص سوقي في صيغة صوتية",
    category: "media", status: "idle", accentColor: "text-sky-400",
  },
  {
    id: "slide-deck", icon: Layers,
    labelEn: "Slide Deck",              labelAr: "عرض شرائح",
    descEn:  "Presentation-ready deck with key data and visuals",
    descAr:  "عرض تقديمي جاهز مع البيانات والمرئيات الرئيسية",
    category: "media", status: "idle", accentColor: "text-orange-400",
  },
  {
    id: "mind-map", icon: Brain,
    labelEn: "Mind Map",                labelAr: "خريطة ذهنية",
    descEn:  "Visual decision tree mapping factors, risks, and opportunities",
    descAr:  "شجرة قرار بصرية تخطط العوامل والمخاطر والفرص",
    category: "media", status: "idle", accentColor: "text-teal-400",
  },
  {
    id: "infographic", icon: PieChart,
    labelEn: "Infographic",             labelAr: "إنفوغرافيك",
    descEn:  "Single-page visual summary built for sharing",
    descAr:  "ملخص بصري في صفحة واحدة مصمم للمشاركة",
    category: "media", status: "idle", accentColor: "text-pink-400",
  },
  {
    id: "data-table", icon: Table,
    labelEn: "Data Table",              labelAr: "جدول البيانات",
    descEn:  "Raw structured export — all metrics, prices, and signals",
    descAr:  "تصدير منظم خام — جميع المقاييس والأسعار والإشارات",
    category: "data", status: "idle", accentColor: "text-lime-400",
  },
  {
    id: "flashcards", icon: CheckSquare,
    labelEn: "Flashcards",              labelAr: "بطاقات تعليمية",
    descEn:  "Knowledge cards — key facts, figures, and market signals",
    descAr:  "بطاقات معرفية — حقائق وأرقام وإشارات سوقية رئيسية",
    category: "data", status: "idle", accentColor: "text-fuchsia-400",
  },
]

const MOCK_SOURCES: Source[] = [
  { id: "s1", label: "DLD Transaction Data — Q1 2025", type: "pdf",  addedAt: "2d ago" },
  { id: "s2", label: "CBRE UAE Market Report",          type: "url",  addedAt: "1d ago" },
  { id: "s3", label: "Area-level notes (pasted)",       type: "text", addedAt: "3h ago" },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const locale = useLocale()
  const t = locale === "ar" ? T.ar : T.en
  const isRTL = locale === "ar"

  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePanel, setActivePanel] = useState<"sources" | "chat" | "studio">("chat")

  // Sources
  const [sources, setSources] = useState<Source[]>(MOCK_SOURCES)
  const [showAddSource, setShowAddSource] = useState(false)
  const [sourceInput, setSourceInput] = useState("")
  const [sourceType, setSourceType] = useState<Source["type"]>("url")

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Studio
  const [outputs, setOutputs] = useState<OutputDef[]>(OUTPUT_DEFS)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [generatingOutput, setGeneratingOutput] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/notebook/books/${id}`)
      .then((r) => r.json())
      .then((d) => setBook(d.book ?? null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleChat(text?: string) {
    const q = (text ?? chatInput).trim()
    if (!q || chatLoading) return
    setChatInput("")
    setMessages((p) => [...p, { id: `u-${Date.now()}`, role: "user", text: q, ts: new Date().toISOString() }])
    setChatLoading(true)
    try {
      const res = await fetch(`/api/notebook/books/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      })
      const data = await res.json()
      setMessages((p) => [...p, { id: `a-${Date.now()}`, role: "assistant", text: data.reply ?? t.doneMsg, ts: new Date().toISOString() }])
    } catch {
      setMessages((p) => [...p, { id: `e-${Date.now()}`, role: "assistant", text: t.errorMsg, ts: new Date().toISOString() }])
    } finally {
      setChatLoading(false)
    }
  }

  async function handleGenerateOutput(outputId: string) {
    if (generatingOutput) return
    setGeneratingOutput(outputId)
    setOutputs((p) => p.map((o) => o.id === outputId ? { ...o, status: "generating" } : o))
    try {
      await fetch(`/api/notebook/books/${id}/output`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputType: outputId }),
      })
      setOutputs((p) => p.map((o) => o.id === outputId ? { ...o, status: "ready" } : o))
    } catch {
      setOutputs((p) => p.map((o) => o.id === outputId ? { ...o, status: "idle" } : o))
    } finally {
      setGeneratingOutput(null)
    }
  }

  function addSource() {
    if (!sourceInput.trim()) return
    setSources((p) => [
      { id: `src-${Date.now()}`, label: sourceInput.trim(), type: sourceType, addedAt: isRTL ? "الآن" : "just now" },
      ...p,
    ])
    setSourceInput("")
    setShowAddSource(false)
  }

  const filteredOutputs = activeCategory === "all"
    ? outputs
    : outputs.filter((o) => o.category === activeCategory)

  const categories = ["all", "analysis", "client", "media", "data"] as const

  if (loading) {
    return (
      <main className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.opening}</p>
        </div>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir={isRTL ? "rtl" : "ltr"}>
        <Navbar />
        <h2 className="text-2xl font-serif font-bold">{t.notFound}</h2>
        <Button variant="link" asChild>
          <Link href="/notebook">{t.returnToLibrary}</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      {/* ── Top Bar ── */}
      <div className="border-b border-border/60 bg-card/40 backdrop-blur-xl pt-16 md:pt-20 sticky top-0 z-40">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-3 flex items-center justify-between gap-4">

          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/notebook"
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary/60">{t.marketBookML}</span>
                <span className="hidden sm:inline text-[9px] text-muted-foreground/30">·</span>
                <span className="hidden sm:inline text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">{book.type}</span>
              </div>
              <h1 className="text-sm md:text-base font-bold text-foreground truncate leading-tight">{book.title}</h1>
            </div>
          </div>

          {/* Mobile panel tabs */}
          <div className="flex items-center gap-1 md:hidden">
            {(["sources", "chat", "studio"] as const).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  activePanel === panel
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {panel === "sources" ? t.panelSources : panel === "chat" ? t.panelChat : t.panelStudio}
              </button>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
              <Share2 className="h-3.5 w-3.5" />
              {t.share}
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
              <Download className="h-3.5 w-3.5" />
              {t.export}
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">Entrestate</span>
          </div>
        </div>
      </div>

      {/* ── 3-Panel Workspace ── */}
      <div className="flex-1 mx-auto w-full max-w-[1600px]">
        <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-7rem)]">

          {/* ═══════════════════════════════════════
              LEFT PANEL — Sources
          ═══════════════════════════════════════ */}
          <div className={`
            ${activePanel === "sources" ? "flex" : "hidden"} md:flex
            flex-col w-full md:w-[260px] xl:w-[280px] flex-shrink-0
            border-e border-border/60 bg-card/20
          `}>
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.sources}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{sources.length} {t.connected}</p>
              </div>
              <button
                onClick={() => setShowAddSource(!showAddSource)}
                className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                aria-label={t.addSource}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add Source Form */}
            <AnimatePresence>
              {showAddSource && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border/40"
                >
                  <div className="p-3 space-y-2 bg-secondary/30">
                    {/* Type selector */}
                    <div className="flex gap-1">
                      {(["url", "pdf", "text", "audio"] as Source["type"][]).map((st) => {
                        const icons = { url: Link2, pdf: FileText, text: Type, audio: Mic, image: PieChart }
                        const Icon = icons[st]
                        return (
                          <button
                            key={st}
                            onClick={() => setSourceType(st)}
                            className={`flex-1 flex flex-col items-center gap-0.5 p-2 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              sourceType === st ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            {t.sourceTypes[st as keyof typeof t.sourceTypes]}
                          </button>
                        )
                      })}
                    </div>
                    <input
                      autoFocus
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSource()}
                      placeholder={
                        sourceType === "url" ? t.placeholderURL :
                        sourceType === "pdf" ? t.placeholderFile :
                        t.placeholderText
                      }
                      dir={isRTL ? "rtl" : "ltr"}
                      className="w-full bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addSource}
                        className="flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
                      >
                        {t.add}
                      </button>
                      <button
                        onClick={() => setShowAddSource(false)}
                        className="px-3 rounded-lg bg-secondary text-muted-foreground text-[10px] font-bold hover:text-foreground transition-colors"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick add buttons */}
            <div className="px-3 py-2.5 grid grid-cols-2 gap-1.5 border-b border-border/40">
              {([
                { icon: Globe,  label: t.searchWeb,  type: "url"  },
                { icon: Upload, label: t.uploadFile,  type: "pdf"  },
                { icon: Link2,  label: t.addURL,      type: "url"  },
                { icon: Type,   label: t.pasteText,   type: "text" },
              ] as { icon: React.ElementType; label: string; type: Source["type"] }[]).map(({ icon: Icon, label, type }) => (
                <button
                  key={label}
                  onClick={() => { setSourceType(type); setShowAddSource(true) }}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all text-[10px] font-semibold"
                >
                  <Icon className="h-3 w-3 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Sources list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40 text-center">
                  <FileSearch className="h-8 w-8" />
                  <p className="text-xs font-semibold">{t.noSourcesYet}</p>
                  <p className="text-[10px] text-muted-foreground">{t.addDataToBook}</p>
                </div>
              ) : (
                sources.map((src) => {
                  const icons: Record<Source["type"], React.ElementType> = { url: Globe, pdf: FileText, text: Type, audio: Mic, image: PieChart }
                  const Icon = icons[src.type]
                  return (
                    <div key={src.id} className="group flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer">
                      <div className="w-6 h-6 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Icon className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground truncate leading-snug">{src.label}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5 uppercase tracking-wide">{src.type} · {src.addedAt}</p>
                      </div>
                      <button
                        onClick={() => setSources((p) => p.filter((s) => s.id !== src.id))}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Subject */}
            <div className="p-3 border-t border-border/40">
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{t.subject}</p>
                <p className="text-xs font-semibold text-foreground">{book.subject}</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              CENTER PANEL — Chat
          ═══════════════════════════════════════ */}
          <div className={`
            ${activePanel === "chat" ? "flex" : "hidden"} md:flex
            flex-col flex-1 min-w-0 border-e border-border/60
          `}>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-border/40 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">{t.chat}</p>
                <p className="text-[10px] text-muted-foreground truncate">{book.title} · {sources.length} {t.sourcesActive}</p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full gap-6 py-10 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{t.askYourBook}</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t.chatSubtitle}</p>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    {t.quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleChat(prompt)}
                        className={`w-full px-4 py-2.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs font-medium text-foreground/70 hover:text-foreground ${isRTL ? "text-right" : "text-left"}`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? (isRTL ? "flex-row" : "flex-row-reverse") : (isRTL ? "flex-row-reverse" : "")}`}
                >
                  <div className={`w-7 h-7 flex-shrink-0 rounded-xl flex items-center justify-center text-[10px] font-black ${
                    msg.role === "user" ? "bg-foreground text-background" : "bg-primary/15 text-primary"
                  }`}>
                    {msg.role === "user" ? (isRTL ? "أ" : "U") : "E"}
                  </div>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? isRTL
                        ? "bg-foreground text-background rounded-tl-sm"
                        : "bg-foreground text-background rounded-tr-sm"
                      : isRTL
                        ? "bg-secondary/60 text-foreground rounded-tr-sm"
                        : "bg-secondary/60 text-foreground rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {chatLoading && (
                <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-7 h-7 flex-shrink-0 rounded-xl bg-primary/15 flex items-center justify-center text-[10px] font-black text-primary">E</div>
                  <div className="px-4 py-3 rounded-2xl bg-secondary/60 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary/60"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div
              className="px-4 py-3 border-t border-border/40 flex-shrink-0"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <div className="flex items-end gap-2">
                <div className="flex-1 min-h-[44px] flex items-center rounded-2xl border border-border/60 bg-background/60 px-4 pr-1.5 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat() }
                    }}
                    placeholder={t.chatPlaceholder}
                    dir={isRTL ? "rtl" : "ltr"}
                    className="flex-1 bg-transparent resize-none text-sm py-2.5 focus:outline-none placeholder:text-muted-foreground/40 max-h-[120px]"
                  />
                </div>
                <button
                  onClick={() => handleChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-11 h-11 flex-shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  <Send className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              RIGHT PANEL — Studio
          ═══════════════════════════════════════ */}
          <div className={`
            ${activePanel === "studio" ? "flex" : "hidden"} md:flex
            flex-col w-full md:w-[300px] xl:w-[340px] flex-shrink-0
          `}>
            {/* Studio header */}
            <div className="px-4 py-3.5 border-b border-border/40 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.studio}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{t.allOutputTypes}</p>
                </div>
                <span className="text-[8px] font-black tracking-widest text-primary/40 uppercase">Entrestate</span>
              </div>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.catLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Outputs list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <AnimatePresence>
                {filteredOutputs.map((output) => {
                  const Icon = output.icon
                  const label = isRTL ? output.labelAr : output.labelEn
                  const desc  = isRTL ? output.descAr  : output.descEn
                  return (
                    <motion.div
                      key={output.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="group p-3 rounded-xl border border-border/40 hover:border-border/80 bg-card/40 hover:bg-card/80 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-secondary/60 flex items-center justify-center mt-0.5 group-hover:bg-secondary transition-colors">
                          <Icon className={`h-4 w-4 ${output.accentColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] font-bold text-foreground leading-snug">{label}</p>
                            {output.status === "ready" && (
                              <div className="w-4 h-4 flex-shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-emerald-500" />
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-2">{desc}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {output.status === "idle" && (
                          <button
                            onClick={() => handleGenerateOutput(output.id)}
                            disabled={!!generatingOutput}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-40"
                          >
                            <Zap className="h-3 w-3" />
                            {t.generate}
                          </button>
                        )}
                        {output.status === "generating" && (
                          <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t.building}
                          </div>
                        )}
                        {output.status === "ready" && (
                          <>
                            <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wide transition-all">
                              <Download className="h-3 w-3" />
                              {t.exportBtn}
                            </button>
                            <button className="px-2 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                              <Share2 className="h-3 w-3" />
                            </button>
                            <button className="px-2 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                              <RefreshCcw className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Brand tag */}
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="text-[8px] font-black tracking-widest text-muted-foreground/25 uppercase">Entrestate</span>
                        <div className="h-px flex-1 bg-border/20" />
                        <span className="text-[8px] text-muted-foreground/25 uppercase tracking-wide">{output.category}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Generate all footer */}
            <div className="p-3 border-t border-border/40 flex-shrink-0">
              <button
                onClick={() => outputs.filter((o) => o.status === "idle").forEach((o) => handleGenerateOutput(o.id))}
                disabled={!!generatingOutput || outputs.every((o) => o.status !== "idle")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30"
              >
                <WandSparkles className="h-3.5 w-3.5" />
                {t.generateAll}
              </button>
              <p className="text-[8px] text-center text-muted-foreground/30 mt-2 uppercase tracking-widest">{t.brandedNote}</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
