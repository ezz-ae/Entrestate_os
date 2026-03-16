import Link from "next/link"
import { MapPin } from "lucide-react"
import { formatAed, formatYield } from "@/components/decision/formatters"
import { pickLocalizedText } from "@/lib/format/entities"
import { buildAreaStaticMapTileUrl } from "@/lib/area-geo"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type AreaCardProps = {
  slug: string
  area: string
  area_ar?: string | null
  projects?: number | null
  city?: string | null
  avg_price?: number | null
  avg_yield?: number | null
  image_url?: string | null
  top_projects?: string[] | null
  locale?: AppLocale | string | null
}

function slugifyProject(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function AreaCard(area: AreaCardProps) {
  const locale = (area.locale ?? "en") as AppLocale
  const isArabic = locale === "ar"
  const mapImageUrl = buildAreaStaticMapTileUrl(area.area, area.city)
  const topProjects = Array.isArray(area.top_projects) ? area.top_projects.slice(0, 4) : []
  const areaLabel = pickLocalizedText(locale, area.area_ar, area.area, area.area)
  const cityLabel = area.city ? pickLocalizedText(locale, null, area.city, area.city) : null
  const copy = isArabic
    ? {
        projects: "مشروع",
        avgPrice: "متوسط السعر",
        avgYield: "متوسط العائد",
        topProjects: "أبرز المشاريع",
        openArea: `افتح ملف ${areaLabel}`,
        mapAlt: `خريطة ${areaLabel}`,
      }
    : {
        projects: "projects",
        avgPrice: "Avg Price",
        avgYield: "Avg Yield",
        topProjects: "Top Projects",
        openArea: `Open ${areaLabel} area details`,
        mapAlt: `Map of ${areaLabel}`,
      }

  return (
    <article className="group relative isolate block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]">
      <div className="relative h-36 overflow-hidden bg-muted/30">
        <img
          src={area.image_url || mapImageUrl}
          alt={copy.mapAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: "saturate(0.85) brightness(0.95)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-primary shadow-md" />
            <div className="absolute h-6 w-6 rounded-full animate-ping bg-primary/20" style={{ animationDuration: "2s" }} />
          </div>
        </div>
        {cityLabel ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <MapPin className="h-2.5 w-2.5" />
            {cityLabel}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-foreground">{areaLabel}</p>
          {area.projects ? (
            <span className="flex-shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {area.projects} {copy.projects}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.avgPrice}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatAed(area.avg_price, locale)}</p>
          </div>
          <div className="h-auto w-px bg-border/60" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.avgYield}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatYield(area.avg_yield, locale)}
            </p>
          </div>
        </div>

        {topProjects.length > 0 ? (
          <div className="mt-3 translate-y-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="border-t border-border/60 pt-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">{copy.topProjects}</p>
              <div className="flex flex-wrap gap-1.5">
                {topProjects.map((project) => (
                  <Link
                    key={`${area.slug}-${project}`}
                    href={prefixLocalePath(`/properties/${slugifyProject(project)}`, locale)}
                    locale={false}
                    className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    {project}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Link
        href={prefixLocalePath(`/areas/${area.slug}`, locale)}
        locale={false}
        className="absolute inset-0 z-10"
        aria-label={copy.openArea}
      />
    </article>
  )
}
