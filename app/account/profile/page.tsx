"use client"

import Link from "next/link"
import { useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  BookOpen, Plus, FileText, Share2, Download, RefreshCcw, BarChart3,
  Building2, MapPin, User, Clock, Sparkles, ArrowRight, TrendingUp,
  PenLine, Zap, Globe, ChevronRight, Activity, Shield, Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

// ── Types ──────────────────────────────────────────────────────────────────────

type BookType = "project" | "area" | "portfolio" | "client"
type BookAction = "generate" | "report" | "rewrite" | "share" | "export"

const TYPE_META: Record<BookType, { label: string; labelAr: string; color: string; icon: any }> = {
  project:   { label: "Project",   labelAr: "مشروع",   color: "text-sky-400 border-sky-400/30 bg-sky-400/5",     icon: Building2 },
  area:      { label: "Area",      labelAr: "منطقة",   color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5", icon: MapPin },
  portfolio: { label: "Portfolio", labelAr: "محفظة",   color: "text-violet-400 border-violet-400/30 bg-violet-400/5", icon: Layers },
  client:    { label: "Client",    labelAr: "عميل",    color: "text-amber-400 border-amber-400/30 bg-amber-400/5", icon: User },
}

// Quick-action capability blocks
const CAPABILITIES = {
  en: [
    {
      id: "generate",
      icon: Sparkles,
      title: "Generate",
      desc: "AI generates a full intelligence book from a project name, area, or topic",
      color: "group-hover:text-primary",
      href: "/notebook",
    },
    {
      id: "report",
      icon: FileText,
      title: "Report",
      desc: "Produce a branded investor memo, area brief, or due diligence report",
      color: "group-hover:text-blue-400",
      href: "/tools/memo",
    },
    {
      id: "rewrite",
      icon: PenLine,
      title: "Rewrite",
      desc: "Refine an existing notebook page with updated market data or a new lens",
      color: "group-hover:text-violet-400",
      href: "/notebook",
    },
    {
      id: "share",
      icon: Share2,
      title: "Share",
      desc: "Share a report via direct link, social post, or embed code",
      color: "group-hover:text-emerald-400",
      href: "/reports/generated",
    },
    {
      id: "export",
      icon: Download,
      title: "Export",
      desc: "Download files as PDF or CSV, branded with Entrestate",
      color: "group-hover:text-amber-400",
      href: "/reports/generated",
    },
    {
      id: "implement",
      icon: Zap,
      title: "Implement",
      desc: "Turn a decision into an action: save, schedule, or send to your workspace",
      color: "group-hover:text-rose-400",
      href: "/workspace",
    },
  ],
  ar: [
    {
      id: "generate",
      icon: Sparkles,
      title: "توليد",
      desc: "يولّد الذكاء الاصطناعي كتاب ذكاء كامل من اسم مشروع أو منطقة أو موضوع",
      color: "group-hover:text-primary",
      href: "/notebook",
    },
    {
      id: "report",
      icon: FileText,
      title: "تقرير",
      desc: "أنشئ مذكرة استثمار أو ملخص منطقة أو تقرير العناية الواجبة",
      color: "group-hover:text-blue-400",
      href: "/tools/memo",
    },
    {
      id: "rewrite",
      icon: PenLine,
      title: "إعادة كتابة",
      desc: "حسّن صفحة دفتر موجودة ببيانات سوق محدّثة أو منظور جديد",
      color: "group-hover:text-violet-400",
      href: "/notebook",
    },
    {
      id: "share",
      icon: Share2,
      title: "مشاركة",
      desc: "شارك تقريراً عبر رابط مباشر أو منشور اجتماعي أو كود تضمين",
      color: "group-hover:text-emerald-400",
      href: "/reports/generated",
    },
    {
      id: "export",
      icon: Download,
      title: "تصدير",
      desc: "نزّل الملفات بصيغة PDF أو CSV بعلامة Entrestate التجارية",
      color: "group-hover:text-amber-400",
      href: "/reports/generated",
    },
    {
      id: "implement",
      icon: Zap,
      title: "تنفيذ",
      desc: "حوّل القرار إلى إجراء: احفظ أو جدوِل أو أرسل إلى مساحة العمل",
      color: "group-hover:text-rose-400",
      href: "/workspace",
    },
  ],
}

// Mock recent books — will be replaced by real API data
const MOCK_BOOKS = [
  { id: "1", title: "Dubai Marina Q2 Deep Dive", subject: "Price momentum + developer risk", type: "area" as BookType, updatedAt: "2026-03-15T10:00:00Z", pageCount: 8, status: "complete" },
  { id: "2", title: "Emaar Investor Memo", subject: "Marina Vista stress profile V1", type: "project" as BookType, updatedAt: "2026-03-14T08:00:00Z", pageCount: 5, status: "complete" },
  { id: "3", title: "Business Bay Portfolio", subject: "Yield vs safety weighting", type: "portfolio" as BookType, updatedAt: "2026-03-12T14:00:00Z", pageCount: 3, status: "draft" },
]

const BRAND_STRIP = {
  en: "All outputs are branded with Entrestate unless you're on an Organisation Terminal.",
  ar: "جميع المخرجات تحمل علامة Entrestate ما لم تكن على منصة المؤسسات.",
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PersonalMarketBookPage() {
  const locale = useLocale()
  const isArabic = locale === "ar"
  const caps = isArabic ? CAPABILITIES.ar : CAPABILITIES.en

  const [books, setBooks] = useState(MOCK_BOOKS)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState("")
  const [newBookType, setNewBookType] = useState<BookType>("project")
  const [creating, setCreating] = useState(false)

  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault()
    if (!newBookTitle.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/notebook/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBookTitle.trim(), subject: newBookTitle.trim(), type: newBookType }),
      })
      const data = await res.json()
      if (data?.book) {
        setBooks((prev) => [{ ...data.book, status: "draft" }, ...prev])
        setShowNewForm(false)
        setNewBookTitle("")
      }
    } catch {
      // silently handle — will use mock insert
      const mockBook = {
        id: String(Date.now()),
        title: newBookTitle.trim(),
        subject: newBookTitle.trim(),
        type: newBookType,
        updatedAt: new Date().toISOString(),
        pageCount: 0,
        status: "draft" as const,
      }
      setBooks((prev) => [mockBook, ...prev])
      setShowNewForm(false)
      setNewBookTitle("")
    } finally {
      setCreating(false)
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-[20%] w-[40%] h-[35%] bg-primary/4 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-violet-500/3 blur-[100px] rounded-full" />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-24 pt-28 md:pt-36">

        {/* ── Header ── */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-4">
                <Activity className="h-3 w-3 animate-pulse" />
                {isArabic ? "دفتر السوق الشخصي" : "Personal Market Book ML"}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-semibold text-foreground tracking-tight leading-tight">
                {isArabic ? "كتبك الاستخباراتية" : "Your Intelligence Books"}
              </h1>
              <p className="mt-3 text-base text-muted-foreground max-w-xl leading-relaxed">
                {isArabic
                  ? "توليد، كتابة، تقرير، مشاركة، وتنفيذ — كل شيء مرتبط بسوق دبي العقاري الحي."
                  : "Generate, write, report, share, and implement — all connected to the live Dubai real estate market."}
              </p>
            </div>
            <Button
              onClick={() => setShowNewForm(true)}
              className="gap-2 h-11 rounded-full px-6 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              {isArabic ? "دفتر جديد" : "New Book"}
            </Button>
          </div>

          {/* Brand strip */}
          <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/20 px-4 py-2.5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <p className="text-[11px] text-muted-foreground/70">{isArabic ? BRAND_STRIP.ar : BRAND_STRIP.en}</p>
            <Link href="/pricing" className="text-[11px] font-semibold text-primary hover:underline underline-offset-2 ms-auto shrink-0">
              {isArabic ? "منصة المؤسسات" : "Organisation Terminal"}
            </Link>
          </div>
        </header>

        {/* ── Capabilities grid ── */}
        <section className="mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-5">
            {isArabic ? "ما يمكنك فعله" : "What you can do"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {caps.map(({ id, icon: Icon, title, desc, color, href }) => (
              <Link key={id} href={href}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="group h-full rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 flex flex-col gap-3 hover:border-border hover:bg-card/70 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                    <Icon className={`h-4 w-4 text-muted-foreground transition-colors ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none mb-1">{title}</p>
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── New book form ── */}
        {showNewForm && (
          <motion.section
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <form
              onSubmit={handleCreateBook}
              className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xl shadow-primary/5"
            >
              <h2 className="text-base font-semibold text-foreground mb-5">
                {isArabic ? "إنشاء دفتر جديد" : "Create new intelligence book"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {isArabic ? "العنوان" : "Title"}
                  </label>
                  <input
                    autoFocus
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    placeholder={isArabic ? "مثال: مراجعة إعمار Q2" : "e.g. Emaar Q2 Review"}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {isArabic ? "النوع" : "Type"}
                  </label>
                  <select
                    value={newBookType}
                    onChange={(e) => setNewBookType(e.target.value as BookType)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="project">{isArabic ? "مشروع" : "Project"}</option>
                    <option value="area">{isArabic ? "منطقة" : "Area"}</option>
                    <option value="portfolio">{isArabic ? "محفظة" : "Portfolio"}</option>
                    <option value="client">{isArabic ? "عميل" : "Client"}</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  {isArabic ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" disabled={creating || !newBookTitle.trim()} className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  {creating ? (isArabic ? "جاري الإنشاء…" : "Creating…") : (isArabic ? "تهيئة الدفتر" : "Initialize Book")}
                </Button>
              </div>
            </form>
          </motion.section>
        )}

        {/* ── Books grid ── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              {isArabic ? "دفاترك" : "Your books"}
            </p>
            <Link href="/notebook" className="text-xs font-semibold text-primary hover:underline underline-offset-2 flex items-center gap-1">
              {isArabic ? "عرض الكل" : "View all"}
              <ChevronRight className={`h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} />
            </Link>
          </div>

          {books.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border/40 py-16 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground/70">
                {isArabic ? "لا توجد دفاتر بعد. ابدأ بإنشاء دفترك الأول." : "No books yet. Create your first intelligence book."}
              </p>
              <Button variant="outline" size="sm" className="mt-5" onClick={() => setShowNewForm(true)}>
                {isArabic ? "إنشاء أول دفتر" : "Create first book"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => {
                const meta = TYPE_META[book.type]
                const Icon = meta.icon
                const isDraft = book.status === "draft"
                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group"
                  >
                    <Link href={`/notebook/${book.id}`}>
                      <div className="h-full rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all p-5 flex flex-col">

                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${meta.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2">
                            {isDraft && (
                              <span className="rounded-full border border-muted-foreground/20 bg-muted/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                {isArabic ? "مسودة" : "Draft"}
                              </span>
                            )}
                            {/* Brand badge */}
                            <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary/70">
                              Entrestate
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1.5">
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 flex-1 leading-relaxed">
                          {book.subject}
                        </p>

                        {/* Footer */}
                        <div className="mt-4 pt-3.5 border-t border-border/30 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(book.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {book.pageCount} {isArabic ? "صفحة" : "pages"}
                            </span>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-all ${isArabic ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                        </div>

                        {/* Quick action row — visible on hover */}
                        <div className="mt-3 grid grid-cols-3 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {[
                            { label: isArabic ? "تقرير" : "Report", icon: FileText, href: `/tools/memo?book=${book.id}` },
                            { label: isArabic ? "مشاركة" : "Share", icon: Share2, href: `/reports/generated` },
                            { label: isArabic ? "تحديث" : "Refresh", icon: RefreshCcw, href: `/notebook/${book.id}` },
                          ].map(({ label, icon: Ic, href }) => (
                            <Link
                              key={label}
                              href={href}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-center gap-1 rounded-lg border border-border/50 bg-muted/30 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            >
                              <Ic className="h-3 w-3" />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}

              {/* "Start from chat" tile */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link href="/chat">
                  <div className="h-full min-h-[180px] rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/3 hover:bg-primary/5 transition-all p-5 flex flex-col items-center justify-center text-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {isArabic ? "ابدأ من المحادثة" : "Start from chat"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1 leading-relaxed">
                        {isArabic
                          ? "اسأل المساعد ودع الذكاء الاصطناعي يبني الدفتر تلقائياً"
                          : "Ask the copilot and let AI build the book automatically"}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          )}
        </section>

        {/* ── Activity feed ── */}
        <section className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-5">
            {isArabic ? "النشاط الأخير" : "Recent activity"}
          </p>
          <div className="rounded-2xl border border-border/40 bg-card/50 divide-y divide-border/30">
            {[
              { action: isArabic ? "تم توليد تقرير" : "Report generated", subject: isArabic ? "دبي مارينا — ملخص المنطقة" : "Dubai Marina — Area brief", time: "2h ago", icon: FileText, color: "text-blue-400" },
              { action: isArabic ? "تمت مشاركة دفتر" : "Book shared", subject: isArabic ? "مذكرة مستثمر إعمار" : "Emaar Investor Memo", time: "1d ago", icon: Share2, color: "text-emerald-400" },
              { action: isArabic ? "تم تصدير ملف" : "File exported", subject: isArabic ? "محفظة الخليج التجاري — PDF" : "Business Bay Portfolio — PDF", time: "2d ago", icon: Download, color: "text-amber-400" },
              { action: isArabic ? "تم تحديث الدفتر" : "Book updated", subject: isArabic ? "ملف ضغط مارينا فيستا V1" : "Marina Vista V1 stress profile", time: "3d ago", icon: RefreshCcw, color: "text-violet-400" },
            ].map((item, i) => {
              const Ic = item.icon
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`shrink-0 ${item.color}`}>
                    <Ic className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground/70">{item.action}</span>
                    <span className="text-xs text-muted-foreground/60 mx-1.5">·</span>
                    <span className="text-xs text-muted-foreground/80 truncate">{item.subject}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 shrink-0">{item.time}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Outputs / market signals panel ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          <div className="md:col-span-2 rounded-2xl border border-border/40 bg-card/50 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-foreground">{isArabic ? "مخرجاتك المولّدة" : "Your generated outputs"}</p>
              <Link href="/reports/generated" className="text-xs font-semibold text-primary hover:underline underline-offset-2 flex items-center gap-1">
                {isArabic ? "عرض الكل" : "View all"} <ChevronRight className={`h-3.5 w-3.5 ${isArabic ? "rotate-180" : ""}`} />
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { title: isArabic ? "مذكرة استثمار — مارينا فيستا" : "Investor Memo — Marina Vista", type: isArabic ? "PDF · Entrestate" : "PDF · Entrestate", date: "Mar 15" },
                { title: isArabic ? "مقارنة المناطق — دبي مارينا vs JBR" : "Area Comparison — Dubai Marina vs JBR", type: isArabic ? "تقرير · Entrestate" : "Report · Entrestate", date: "Mar 14" },
                { title: isArabic ? "فحص السعر — الخليج التجاري" : "Price Reality Check — Business Bay", type: isArabic ? "تحليل · Entrestate" : "Analysis · Entrestate", date: "Mar 12" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground/50">{item.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] text-muted-foreground/40">{item.date}</span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-primary cursor-pointer transition-colors" />
                    <Share2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-emerald-400 cursor-pointer transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live signals mini-panel */}
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-sm font-semibold text-foreground">{isArabic ? "إشارات حية" : "Live signals"}</p>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { area: "Dubai Marina", signal: "BUY", color: "text-emerald-400" },
                { area: "Business Bay", signal: "HOLD", color: "text-amber-400" },
                { area: "JBR", signal: "HOLD", color: "text-amber-400" },
                { area: "MBR City", signal: "WAIT", color: "text-muted-foreground" },
              ].map((item) => (
                <div key={item.area} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/80">{item.area}</span>
                  <span className={`font-bold ${item.color}`}>{item.signal}</span>
                </div>
              ))}
            </div>
            <Link href="/chat" className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline underline-offset-2">
              <Sparkles className="h-3 w-3" />
              {isArabic ? "اسأل عن أي إشارة" : "Ask about any signal"}
            </Link>
          </div>
        </section>

        {/* ── Bottom CTA — chat to build ── */}
        <div className="rounded-2xl border border-primary/15 bg-primary/4 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-base font-semibold text-foreground mb-1">
              {isArabic ? "اسأل — يُنشئ لك الذكاء الاصطناعي دفتراً كاملاً" : "Ask — AI builds you a complete book"}
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-lg leading-relaxed">
              {isArabic
                ? "اكتب أي سؤال عن مشروع أو منطقة أو مطور وسيوثّق مساعد القرار كل شيء في دفتر ذكاء منظّم."
                : "Type any question about a project, area, or developer and the copilot will document everything into a structured intelligence book."}
            </p>
          </div>
          <Button asChild className="gap-2 h-11 rounded-full px-7 shrink-0 shadow-lg shadow-primary/20">
            <Link href="/chat">
              <Sparkles className="h-4 w-4" />
              {isArabic ? "افتح مساعد القرار" : "Open Copilot"}
            </Link>
          </Button>
        </div>

      </div>
      <Footer />
    </main>
  )
}
