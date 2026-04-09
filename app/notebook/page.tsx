"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, Plus, Trash2, Clock, Map, Building2, User, ArrowRight,
  Sparkles, FileText, Share2, Download, RefreshCcw, Layers, Search,
  Filter, Activity, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "next-intl"

type BookType = "client" | "area" | "project" | "portfolio"

type BookSummary = {
  id: string
  title: string
  subject: string
  type: BookType
  updatedAt: string
  pageCount: number
}

const TYPE_META: Record<BookType, { labelEn: string; labelAr: string; color: string; icon: any }> = {
  client:    { labelEn: "Client",    labelAr: "عميل",  color: "text-amber-400 border-amber-400/30 bg-amber-400/8",    icon: User },
  area:      { labelEn: "Area",      labelAr: "منطقة", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/8", icon: Map },
  project:   { labelEn: "Project",   labelAr: "مشروع", color: "text-sky-400 border-sky-400/30 bg-sky-400/8",          icon: Building2 },
  portfolio: { labelEn: "Portfolio", labelAr: "محفظة", color: "text-violet-400 border-violet-400/30 bg-violet-400/8",  icon: Layers },
}

const FILTERS: { id: BookType | "all"; labelEn: string; labelAr: string }[] = [
  { id: "all",       labelEn: "All",       labelAr: "الكل" },
  { id: "project",   labelEn: "Projects",  labelAr: "مشاريع" },
  { id: "area",      labelEn: "Areas",     labelAr: "مناطق" },
  { id: "portfolio", labelEn: "Portfolios",labelAr: "محافظ" },
  { id: "client",    labelEn: "Clients",   labelAr: "عملاء" },
]

export default function NotebookPage() {
  const locale = useLocale()
  const isArabic = locale === "ar"

  const [books, setBooks] = useState<BookSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", subject: "", type: "project" as BookType })
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<BookType | "all">("all")

  useEffect(() => {
    fetch("/api/notebook/books")
      .then((r) => r.json())
      .then((d) => setBooks(d.books ?? []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creating || !form.title.trim() || !form.subject.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/notebook/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data?.book) {
        setBooks((prev) => [data.book as BookSummary, ...prev])
        setShowForm(false)
        setForm({ title: "", subject: "", type: "project" })
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(bookId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const res = await fetch(`/api/notebook/books/${bookId}`, { method: "DELETE" })
    if (!res.ok) return
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
  }

  const filtered = books.filter((b) => {
    const matchesFilter = activeFilter === "all" || b.type === activeFilter
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <main id="main-content" className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-5%] left-[30%] w-[40%] h-[35%] bg-primary/3 blur-[130px] rounded-full" />
        <div className="absolute bottom-[5%] right-[5%] w-[25%] h-[25%] bg-violet-500/3 blur-[100px] rounded-full" />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-24 pt-28 md:pt-36">

        {/* ── Header ── */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-4">
                <Activity className="h-3 w-3 animate-pulse" />
                {isArabic ? "دفاتر التحليل" : "Intelligence Books"}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-semibold text-foreground tracking-tight">
                {isArabic ? "دفتر السوق الشخصي" : "Personal Market Book"}
              </h1>
              <p className="mt-3 text-base text-muted-foreground max-w-xl leading-relaxed">
                {isArabic
                  ? "كل مشروع أو منطقة أو محفظة — موثّقة كدفتر تحليلي حي. توليد، كتابة، مشاركة، تنفيذ."
                  : "Every project, area, or portfolio — documented as a living intelligence book. Generate, write, share, implement."}
              </p>
            </div>
            <Button
              onClick={() => setShowForm((v) => !v)}
              className="gap-2 h-11 rounded-full px-6 shrink-0 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              {isArabic ? "دفتر جديد" : "New Book"}
            </Button>
          </div>

          {/* Brand strip */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/20 px-4 py-2.5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <p className="text-[11px] text-muted-foreground/70">
              {isArabic
                ? "جميع الدفاتر والمخرجات تحمل علامة Entrestate ما لم تكن على منصة المؤسسات."
                : "All books and outputs are branded with Entrestate unless you're on an Organisation Terminal."}
            </p>
            <Link href="/pricing" className="text-[11px] font-semibold text-primary hover:underline underline-offset-2 ms-auto shrink-0">
              {isArabic ? "منصة المؤسسات" : "Organisation Terminal"}
            </Link>
          </div>
        </header>

        {/* ── New book form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleCreate}
              className="mb-8 rounded-2xl border border-primary/20 bg-card p-6 shadow-xl shadow-primary/5"
            >
              <h2 className="text-base font-semibold text-foreground mb-5">
                {isArabic ? "إنشاء دفتر جديد" : "Create new intelligence book"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {isArabic ? "العنوان" : "Title"}
                  </label>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder={isArabic ? "مثال: مراجعة إعمار Q2" : "e.g. Emaar Q2 Review"}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {isArabic ? "الموضوع" : "Subject"}
                  </label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder={isArabic ? "مثال: أداء دبي مارينا" : "e.g. Dubai Marina performance"}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {isArabic ? "النوع" : "Type"}
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as BookType })}
                  >
                    <option value="project">{isArabic ? "ملف مشروع" : "Project Intelligence"}</option>
                    <option value="area">{isArabic ? "أداء منطقة" : "Area Performance"}</option>
                    <option value="client">{isArabic ? "إحاطة عميل" : "Client Briefing"}</option>
                    <option value="portfolio">{isArabic ? "مراجعة محفظة" : "Portfolio Review"}</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground/50">
                  {isArabic ? "سيُولّد الذكاء الاصطناعي محتوى الدفتر الأول تلقائياً." : "AI will auto-generate initial book content."}
                </p>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    {isArabic ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="submit" size="sm" disabled={creating} className="gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    {creating ? (isArabic ? "جاري الإنشاء…" : "Creating…") : (isArabic ? "تهيئة الدفتر" : "Initialize Book")}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Search + filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 ${isArabic ? "right-3" : "left-3"}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isArabic ? "بحث في الدفاتر…" : "Search books…"}
              dir={isArabic ? "rtl" : "ltr"}
              className={`w-full rounded-xl border border-border/60 bg-card/50 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isArabic ? "pr-9 pl-4" : "pl-9 pr-4"}`}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {isArabic ? f.labelAr : f.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* ── Books grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground/60">{isArabic ? "جاري تحميل الدفاتر…" : "Loading books…"}</p>
          </div>
        ) : filtered.length === 0 && books.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border/40 bg-card/20 py-24 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
              {isArabic ? "لا توجد دفاتر بعد" : "No books yet"}
            </h3>
            <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mb-8 leading-relaxed">
              {isArabic
                ? "ابدأ بإنشاء دفتر تحليلي، أو اسأل مساعد القرار وسيبنيه لك تلقائياً."
                : "Create an intelligence book, or ask the copilot and it'll build one automatically."}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {isArabic ? "دفتر جديد" : "New Book"}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/chat">
                  <Sparkles className="h-4 w-4" />
                  {isArabic ? "اسأل المساعد" : "Ask copilot"}
                </Link>
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/40 py-12 text-center">
            <p className="text-sm text-muted-foreground/60">
              {isArabic ? "لا توجد نتائج مطابقة." : "No books match your search."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((book) => {
                const meta = TYPE_META[book.type]
                const Icon = meta.icon
                return (
                  <motion.div
                    key={book.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group"
                  >
                    <Link href={`/notebook/${book.id}`}>
                      <div className="h-full rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all p-5 flex flex-col">

                        {/* Top row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${meta.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Brand badge */}
                            <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary/60">
                              Entrestate
                            </span>
                            <button
                              onClick={(e) => handleDelete(book.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Type chip */}
                        <span className={`self-start rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-3 ${meta.color}`}>
                          {isArabic ? meta.labelAr : meta.labelEn}
                        </span>

                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1.5">
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground/65 line-clamp-2 flex-1 leading-relaxed">
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
                              {book.pageCount} {isArabic ? "ص" : "p"}
                            </span>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-all ${isArabic ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                        </div>

                        {/* Quick actions — appear on hover */}
                        <div className="mt-3 grid grid-cols-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {[
                            { label: isArabic ? "تقرير" : "Report", icon: FileText },
                            { label: isArabic ? "مشاركة" : "Share", icon: Share2 },
                            { label: isArabic ? "تحديث" : "Refresh", icon: RefreshCcw },
                          ].map(({ label, icon: Ic }) => (
                            <button
                              key={label}
                              onClick={(e) => e.preventDefault()}
                              className="flex items-center justify-center gap-1 rounded-lg border border-border/40 bg-muted/20 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            >
                              <Ic className="h-3 w-3" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Start from chat tile */}
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <Link href="/chat">
                <div className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/3 hover:bg-primary/5 transition-all p-5 flex flex-col items-center justify-center text-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {isArabic ? "ابدأ من المحادثة" : "Start from copilot"}
                    </p>
                    <p className="text-[11px] text-muted-foreground/55 mt-1 leading-relaxed">
                      {isArabic
                        ? "اسأل المساعد وسيبني الدفتر تلقائياً"
                        : "Ask a question — AI builds the book automatically"}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        )}

        {/* ── Bottom links ── */}
        {books.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/50">
            <Link href="/reports/generated" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isArabic ? "الملفات المصدّرة" : "Exported files"}
            </Link>
            <Link href="/tools/memo" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {isArabic ? "إنشاء مذكرة" : "Generate memo"}
            </Link>
            <Link href="/account/profile" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {isArabic ? "دفتر السوق الشخصي" : "Personal Market Book"}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
