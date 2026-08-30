import { absoluteUrl } from "@/lib/seo"
import { SITE } from "@/lib/seo/metadata"
import type { AppLocale } from "@/i18n/locale"

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icon.svg"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@entrestate.com",
        availableLanguage: ["en", "ar"],
        areaServed: ["AE"],
      },
    ],
  }
}

export function websiteSchema(locale: AppLocale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: ["en-AE", "ar-AE"],
    publisher: { "@id": `${SITE.url}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export type BreadcrumbItem = {
  name: string
  href: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${SITE.url}${item.href}`,
    })),
  }
}

export type RealEstateListingInput = {
  name: string
  url: string
  description: string
  developer?: string | null
  area?: string | null
  priceMin?: number | null
  priceMax?: number | null
  currency?: "AED" | "USD" | "SAR"
  bedrooms?: number[]
  completionYear?: number | null
  image?: string | null
}

export function realEstateListingSchema(input: RealEstateListingInput) {
  const offers =
    input.priceMin || input.priceMax
      ? {
          "@type": "AggregateOffer",
          priceCurrency: input.currency ?? "AED",
          ...(input.priceMin ? { lowPrice: input.priceMin } : {}),
          ...(input.priceMax ? { highPrice: input.priceMax } : {}),
        }
      : undefined

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: input.name,
    url: input.url,
    description: input.description,
    image: input.image ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
      addressLocality: input.area ?? undefined,
    },
    ...(input.developer
      ? {
          developer: {
            "@type": "Organization",
            name: input.developer,
          },
        }
      : {}),
    ...(offers ? { offers } : {}),
    ...(input.bedrooms && input.bedrooms.length > 0
      ? {
          numberOfRooms: {
            "@type": "QuantitativeValue",
            minValue: Math.min(...input.bedrooms),
            maxValue: Math.max(...input.bedrooms),
          },
        }
      : {}),
    ...(input.completionYear ? { datePosted: `${input.completionYear}-01-01` } : {}),
  }
}

export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }
}

/**
 * The whole price list as one OfferCatalog.
 *
 * productSchema() describes ONE plan; a search engine reading a pricing page
 * wants the set, and the set is what disappeared when this page was refactored
 * — tests/platform-surfaces.test.ts had been asserting the literal
 * `"@type": "OfferCatalog"` in the page source, which is how the loss was
 * caught, months after it happened.
 *
 * Prices come from the plan data, so a tier that changes price here cannot
 * disagree with the tier printed on the page. A plan with no monthly price
 * (enquire-only) is listed WITHOUT an offer rather than with a zero, because
 * "free" and "ask us" are not the same thing and structured data that says
 * otherwise is a lie a search engine repeats.
 */
export function offerCatalogSchema(input: {
  name: string
  url: string
  plans: Array<{ name: string; description: string; price: number | null; anchor: string }>
  currency?: "AED" | "USD" | "SAR"
}) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: input.name,
    url: input.url,
    itemListElement: input.plans.map((plan, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: plan.name,
        description: plan.description,
        url: `${input.url}#${plan.anchor}`,
        provider: { "@type": "Organization", name: SITE.name },
        ...(plan.price === null
          ? {}
          : {
              offers: {
                "@type": "Offer",
                price: plan.price,
                priceCurrency: input.currency ?? "AED",
                url: `${input.url}#${plan.anchor}`,
                availability: "https://schema.org/InStock",
              },
            }),
      },
    })),
  }
}

export function productSchema(input: {
  name: string
  description: string
  url: string
  price: number
  currency?: "AED" | "USD" | "SAR"
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    brand: {
      "@type": "Brand",
      name: SITE.name,
    },
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency ?? "AED",
      url: input.url,
      availability: "https://schema.org/InStock",
    },
  }
}
