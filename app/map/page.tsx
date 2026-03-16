"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MapPin, Layers, Activity, TrendingUp, Shield, Loader2 } from "lucide-react"
import { pickLocalizedText } from "@/lib/format/entities"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type AreaCluster = {
  area: string
  area_ar?: string | null
  slug: string
  city?: string | null
  projects: number
  avg_price: number | null
  avg_yield: number | null
  efficiency: number | null
  buy_signals: number
}

const layerOptions = ["Yield bands", "Pricing heatmap", "Supply pressure", "Safety tiers", "Liquidity score"]

function getHeatColor(value: number | null, max: number): string {
  if (value === null || max === 0) return "bg-muted/30 border-border/60"
  const ratio = Math.min(value / max, 1)
  if (ratio > 0.75) return "bg-emerald-500/20 border-emerald-500/40"
  if (ratio > 0.5) return "bg-blue-500/20 border-blue-500/40"
  if (ratio > 0.25) return "bg-amber-500/20 border-amber-500/40"
  return "bg-red-500/15 border-red-500/30"
}

export default function MapPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [areas, setAreas] = useState<AreaCluster[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState("Yield bands")

  useEffect(() => {
    fetch("/api/areas")
      .then((res) => (res.ok ? res.json() : { areas: [] }))
      .then((data) => setAreas(data.areas ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxYield = Math.max(...areas.map((a) => (typeof a.avg_yield === "number" ? a.avg_yield : 0)), 1)
  const maxEfficiency = Math.max(...areas.map((a) => (typeof a.efficiency === "number" ? a.efficiency : 0)), 1)
  const maxPrice = Math.max(...areas.map((a) => (typeof a.avg_price === "number" ? a.avg_price : 0)), 1)
  const maxProjects = Math.max(...areas.map((a) => a.projects), 1)

  function getClusterColor(area: AreaCluster): string {
    switch (activeLayer) {
      case "Yield bands":
        return getHeatColor(typeof area.avg_yield === "number" ? area.avg_yield : null, maxYield)
      case "Pricing heatmap":
        return getHeatColor(typeof area.avg_price === "number" ? area.avg_price : null, maxPrice)
      case "Safety tiers":
      case "Liquidity score":
        return getHeatColor(typeof area.efficiency === "number" ? area.efficiency : null, maxEfficiency)
      case "Supply pressure":
        return getHeatColor(area.projects, maxProjects)
      default:
        return "bg-muted/30 border-border/60"
    }
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الخريطة" : "Map"}</p>
              <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">{isArabic ? "خريطة السوق" : "Spatial Trust Surface"}</h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                {isArabic
                  ? "استكشف المناطق بحسب العائد والسعر وكثافة المشاريع. اضغط على أي منطقة لعرض التفاصيل."
                  : "Area clusters colored by market signals. Click any area to explore its projects and intelligence."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-accent" />
              {isArabic ? `${areas.length} منطقة متاحة` : `${areas.length} areas loaded`}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            {/* Area cluster grid */}
            <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <MapPin className="h-4 w-4 text-accent" />
                {isArabic ? "المناطق" : "Area clusters"}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[420px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {areas.map((area) => (
                    <Link
                      key={area.slug}
                      href={prefixLocalePath(`/areas/${area.slug}`, locale)}
                      locale={false}
                      className={`rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-md ${getClusterColor(area)}`}
                    >
                      <div className="text-xs font-medium text-foreground truncate">{pickLocalizedText(locale, area.area_ar, area.area, area.area)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{isArabic ? `${area.projects} مشروع` : `${area.projects} projects`}</div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">{isArabic ? "العائد" : "Yield"}</span>
                          <div className="font-medium text-foreground">
                            {typeof area.avg_yield === "number" ? `${Number(area.avg_yield).toFixed(1)}%` : "\u2014"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{isArabic ? "السعر" : "Price"}</span>
                          <div className="font-medium text-foreground">
                            {typeof area.avg_price === "number"
                              ? `${(Number(area.avg_price) / 1_000_000).toFixed(1)}M`
                              : "\u2014"}
                          </div>
                        </div>
                      </div>
                      {area.buy_signals > 0 && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {isArabic ? `${area.buy_signals} BUY` : `${area.buy_signals} BUY`}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Layer controls */}
            <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Layers className="h-4 w-4 text-accent" />
                {isArabic ? "الطبقات النشطة" : "Active layers"}
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "مستويات العرض" : "Core layers"}</p>
                  <div className="mt-3 space-y-2">
                    {layerOptions.map((layer) => (
                      <button
                        key={layer}
                        onClick={() => setActiveLayer(layer)}
                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                          activeLayer === layer
                            ? "border-primary/60 bg-primary/10 text-foreground"
                            : "border-border/60 bg-background/50 text-foreground hover:border-primary/30"
                        }`}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Legend</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                      High (top quartile)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-blue-500/20 border border-blue-500/40" />
                      Above average
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
                      Below average
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-red-500/15 border border-red-500/30" />
                      Low (bottom quartile)
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-accent inline-block mr-2" />
                  Click any area to open its detail page with projects and intelligence.
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
