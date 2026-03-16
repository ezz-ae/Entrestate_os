import { defaultLocale, locales, prefixLocalePath, type AppLocale } from "@/i18n/locale"

const DEFAULT_SITE_URL = "https://entrestate.com"

export const SEO = {
  siteName: "Entrestate",
  defaultTitle: "Entrestate | UAE Real Estate Intelligence Platform",
  defaultDescription:
    "Entrestate is a UAE real estate intelligence platform for evidence-backed market analysis, project scoring, and investor-grade reports.",
  defaultOgImagePath: "/seq-poster.svg",
}

const SEO_COPY: Record<AppLocale, { defaultTitle: string; defaultDescription: string; homeTitle: string; homeDescription: string; ogAlt: string }> = {
  en: {
    defaultTitle: SEO.defaultTitle,
    defaultDescription: SEO.defaultDescription,
    homeTitle: "UAE Real Estate Decision Intelligence",
    homeDescription:
      "Analyze UAE property markets with evidence-backed scoring, developer reliability signals, and investor-grade decision workflows.",
    ogAlt: "Entrestate platform overview",
  },
  ar: {
    defaultTitle: "Entrestate | منصة ذكاء القرار العقاري في الإمارات",
    defaultDescription:
      "حلّل أسواق العقارات في الإمارات عبر درجات مدعومة بالأدلة وإشارات موثوقية المطورين وسير عمل استثماري احترافي.",
    homeTitle: "ذكاء القرار العقاري في الإمارات",
    homeDescription:
      "حلّل أسواق العقارات في الإمارات عبر درجات مدعومة بالأدلة وإشارات موثوقية المطورين وسير عمل استثماري احترافي.",
    ogAlt: "نظرة عامة على منصة Entrestate",
  },
}

export function getSeoCopy(locale: AppLocale) {
  return SEO_COPY[locale]
}

export function getOpenGraphLocale(locale: AppLocale) {
  return locale === "ar" ? "ar_AE" : "en_US"
}

export function getLocaleAlternates(path: string = "/") {
  return {
    canonical: prefixLocalePath(path, defaultLocale),
    languages: Object.fromEntries(locales.map((locale) => [locale, prefixLocalePath(path, locale)])),
  }
}

export function getSiteUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    DEFAULT_SITE_URL

  const withProtocol = candidate.startsWith("http") ? candidate : `https://${candidate}`
  return withProtocol.replace(/\/$/, "")
}

export function absoluteUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}
