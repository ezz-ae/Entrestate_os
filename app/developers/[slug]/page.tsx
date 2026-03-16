import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { formatAed, formatScore } from "@/components/decision/formatters"
import { getDeveloperBySlug } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatInteger } from "@/lib/format/number"

export const dynamic = "force-dynamic"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default async function DeveloperDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getDeveloperBySlug(slug)
  if (!detail) notFound()

  const developer = detail.developer
  const profile = developer.profile as Record<string, unknown> | null
  const copy = locale === "ar"
    ? {
        developerFallback: "المطور",
        pageEyebrow: "تفاصيل المطور",
        profileFallback: "ملف المطور",
        reliability: "الموثوقية",
        efficiency: "الكفاءة التشغيلية",
        projects: "المشاريع",
        safeProjects: "مشاريع منخفضة المخاطر",
        avgTicket: "متوسط قيمة الوحدات",
        areaPresence: "التواجد الجغرافي",
        areaFallback: "المنطقة",
        profileNotes: "ملاحظات الملف",
        operationsAvailable: "البيانات التشغيلية متوفرة",
        projectFallback: "المشروع",
      }
    : {
        developerFallback: "Developer",
        pageEyebrow: "Developer Detail",
        profileFallback: "Developer profile",
        reliability: "Reliability",
        efficiency: "Efficiency",
        projects: "Projects",
        safeProjects: "Safe projects",
        avgTicket: "Avg ticket",
        areaPresence: "Area presence",
        areaFallback: "Area",
        profileNotes: "Profile notes",
        operationsAvailable: "Operational footprint available",
        projectFallback: "Project",
      }
  const developerLabel = pickLocalizedText(locale, profile?.developer_ar, developer.developer, copy.developerFallback)

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6">
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/25" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(680px_circle_at_50%_-280px,rgba(59,130,246,0.2),transparent_58%)] opacity-80" />

          <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.pageEyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{developerLabel}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {[profile?.founded_year, profile?.hq].filter(Boolean).join(" · ") || copy.profileFallback}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.reliability}</p>
              <p className="font-medium text-foreground">{formatScore(developer.reliability, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.efficiency}</p>
              <p className="font-medium text-foreground">{formatScore(developer.efficiency, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.projects}</p>
              <p className="font-medium text-foreground">{formatInteger(developer.projects, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.safeProjects}</p>
              <p className="font-medium text-foreground">{formatInteger(developer.safe_projects, locale)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{copy.avgTicket}</p>
              <p className="font-medium text-foreground">{formatAed(developer.avg_price, locale)}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
            <h2 className="text-lg font-semibold text-foreground">{copy.projects}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {detail.projects.map((project) => (
                <ProjectCard
                  key={String(project.slug)}
                  slug={String(project.slug)}
                  name={String(project.name ?? copy.projectFallback)}
                  area={String(project.area ?? "")}
                  developer={String(developer.developer ?? "")}
                  developer_ar={typeof profile?.developer_ar === "string" ? profile.developer_ar : null}
                  l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
                  l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
                  l2_stress_test_grade={
                    typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null
                  }
                  l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
                  engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
                  l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
                />
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20" />
            <h2 className="text-lg font-semibold text-foreground">{copy.areaPresence}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {detail.area_presence.map((area, index) => (
                <li
                  key={`${String(area.area)}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2"
                >
                  <a
                    href={prefixLocalePath(`/areas/${slugify(String(area.area ?? "area"))}`, locale)}
                    className="truncate pr-3 text-foreground transition hover:text-primary"
                  >
                    {pickLocalizedText(locale, null, area.area, copy.areaFallback)}
                  </a>
                  <span className="text-xs text-muted-foreground">{formatInteger(area.projects, locale)}</span>
                </li>
              ))}
            </ul>

            {profile ? (
              <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{copy.profileNotes}</p>
                <p className="mt-1 text-sm text-foreground">
                  {[profile?.footprint, profile?.continuity].filter(Boolean).join(" · ") || copy.operationsAvailable}
                </p>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
      <Footer />
    </main>
  )
}
