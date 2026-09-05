import type { Metadata } from "next"
import { absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/pricing", locale)
  const title = isArabic
    ? "أسعار Entrestate — التحليل مع حسابك، والأدوات في المتجر"
    : "Entrestate Pricing — the analysis with your account, the tools in the store"
  const description = isArabic
    ? "استكشاف السوق — البحث والبيانات والشات — يأتي مع كل حساب. وأدوات البيع تطبيقات في متجر تطبيقات Entrestate."
    : "Market discovery — search, data, and the chat — comes with every account. The selling tools are apps in the Entrestate App Store."

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      locale: getOpenGraphLocale(locale),
      url: alternates.languages?.[locale],
      images: [absoluteUrl("/seq-poster.svg")],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/seq-poster.svg")],
    },
  }
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
