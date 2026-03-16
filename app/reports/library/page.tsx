import type { Metadata } from "next"
import { TimeMachineRolodex } from "@/components/time-machine-rolodex"
import { SEO, absoluteUrl } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const title = isArabic ? "مكتبة التقارير" : "Reports Library"
  const description = isArabic
    ? "تقارير طويلة ودراسات سوقية وتحليلات للمطورين والمناطق من Entrestate."
    : "Read long-form real estate intelligence reports, market deep-dives, and developer analysis from Entrestate."

  return {
    title,
    description,
    alternates: {
      canonical: "/reports/library",
    },
    openGraph: {
      title: `${title} | ${SEO.siteName}`,
      description,
      url: "/reports/library",
      images: [absoluteUrl(SEO.defaultOgImagePath)],
      type: "website",
    },
  }
}

export default function ReportsLibraryPage() {
  return <TimeMachineRolodex />
}
