import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AreasView } from "@/components/decision/areas-view"
import { AreaCard } from "@/components/decision/area-card"
import { listAreas } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"
import { formatInteger } from "@/lib/format/number"

export const dynamic = "force-dynamic"

export default async function AreasPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const data = await listAreas()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
            {isArabic ? "المناطق" : "Areas"}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-5xl">
            {isArabic ? "المناطق التي تُحرّك السوق" : "Area Intelligence Map"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? `قراءة مباشرة لـ ${formatInteger(data.areas.length, locale)} منطقة: السعر، العائد، كثافة المشاريع، وفرص الدخول.`
              : `${formatInteger(data.areas.length, locale)} area profiles - pricing depth, yield averages, and market timing signals. Click any dot to explore.`}
          </p>
        </header>

        <div className="mb-8 rounded-2xl border border-border/70 bg-card/60 p-4">
          <h2 className="text-sm font-semibold text-foreground">
            {isArabic
              ? `تغطية البيانات: ${formatInteger(data.areas.length, locale)} منطقة`
              : `Data coverage: ${formatInteger(data.areas.length, locale)} areas`}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isArabic
              ? "مصادر متقاطعة: PropertyFinder / Bayut / DLD / Entrestate Spine"
              : "Cross-referenced: PropertyFinder / Bayut / DLD / Entrestate Spine"}
          </p>
        </div>

        <AreasView areas={data.areas} />

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
              {isArabic ? "الواجهة العربية والإنجليزية تعرضان نفس البيانات مع اسم عرض مناسب لكل لغة." : "Arabic and English routes use the same records with locale-specific labels."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.areas.map((area) => (
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
