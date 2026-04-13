import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AreasView } from "@/components/decision/areas-view"
import { AreaCard } from "@/components/decision/area-card"
import { listAreas } from "@/lib/decision-infrastructure"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { getRequestLocale } from "@/i18n/request"
import { formatInteger } from "@/lib/format/number"
import Link from "next/link"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

type SearchParams = {
  city?: string
}

export default async function AreasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const data = await listAreas()
  const params = await searchParams
  const syncMeta = buildDataSyncMeta("areas", data.data_as_of)
  const syncTimestamp = new Date(syncMeta.syncedAt).toLocaleString(isArabic ? "ar-AE" : "en-AE")
  const cities = [...new Set(data.areas.map((area) => String(area.city ?? "").trim()).filter(Boolean))].sort()
  const activeCity = cities.includes(String(params.city ?? "").trim()) ? String(params.city).trim() : ""
  const visibleAreas = activeCity
    ? data.areas.filter((area) => String(area.city ?? "").trim() === activeCity)
    : data.areas

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
            {isArabic ? "المناطق" : "Areas"}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-5xl">
            {isArabic ? "خريطة ذكاء المناطق" : "Area Intelligence Map"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? `${formatInteger(visibleAreas.length, locale)} منطقة مع السعر والعائد وكثافة المشاريع داخل عرض واحد.`
              : `${formatInteger(visibleAreas.length, locale)} area profiles with pricing, yield, and project density in one view.`}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            {isArabic
              ? `مزامنة API · ${syncMeta.primaryView} · ${syncTimestamp}`
              : `API sync · ${syncMeta.primaryView} · ${syncTimestamp}`}
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={prefixLocalePath("/areas", locale)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCity === ""
                ? "border-foreground/30 bg-foreground text-background"
                : "border-border/60 bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {isArabic ? "كل المدن" : "All cities"}
            <span className={`ms-1 text-[10px] ${activeCity === "" ? "text-background/70" : "text-muted-foreground"}`}>
              {formatInteger(data.areas.length, locale)}
            </span>
          </Link>
          {cities.map((city) => {
            const href = prefixLocalePath(`/areas?city=${encodeURIComponent(city)}`, locale)
            const count = data.areas.filter((area) => String(area.city ?? "").trim() === city).length
            const isActive = activeCity === city
            return (
              <Link
                key={city}
                href={href}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {city}
                <span className={`ms-1 text-[10px] ${isActive ? "text-foreground/60" : "text-muted-foreground"}`}>
                  {formatInteger(count, locale)}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mb-8 rounded-2xl border border-border/70 bg-card/60 p-4">
          <h2 className="text-sm font-semibold text-foreground">
            {isArabic
              ? `تغطية البيانات: ${formatInteger(visibleAreas.length, locale)} منطقة`
              : `Data coverage: ${formatInteger(visibleAreas.length, locale)} areas`}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isArabic
              ? `${activeCity ? `عرض مدينة: ${activeCity} · ` : ""}مصادر متقاطعة: PropertyFinder / Bayut / DLD / Entrestate Spine`
              : `${activeCity ? `City filter: ${activeCity} · ` : ""}Cross-referenced: PropertyFinder / Bayut / DLD / Entrestate Spine`}
          </p>
        </div>

        <AreasView areas={visibleAreas} />

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
                {isArabic ? "كل المناطق" : "All Areas"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {isArabic ? "ملفات المناطق" : "Area Profiles"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "نفس البيانات مع أسماء عرض مناسبة لكل لغة." : "The same records with locale-specific labels."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleAreas.map((area) => (
              <AreaCard
                key={String(area.slug)}
                slug={String(area.slug)}
                area={String(area.area ?? "")}
                area_ar={typeof area.area_ar === "string" ? area.area_ar : null}
                projects={typeof area.projects === "number" ? area.projects : null}
                city={typeof area.city === "string" ? area.city : null}
                avg_price={typeof area.avg_price === "number" ? area.avg_price : null}
                avg_yield={typeof area.avg_yield === "number" ? area.avg_yield : null}
                source_count={typeof area.source_count === "number" ? area.source_count : null}
                confidence={typeof area.confidence === "string" ? area.confidence : null}
                image_url={typeof area.image_url === "string" ? area.image_url : null}
                top_projects={Array.isArray(area.top_projects) ? area.top_projects.filter((item): item is string => typeof item === "string") : []}
                apiPreview={area as Record<string, unknown>}
                locale={locale}
              />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
