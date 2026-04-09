import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog-data"
import { docsArticles } from "@/lib/docs-articles"
import { libraryArticles } from "@/lib/library-data"
import { getSiteUrl } from "@/lib/seo"
import { locales, prefixLocalePath } from "@/i18n/locale"

const baseUrl = getSiteUrl()

const staticRoutes = [
  "",
  "/about",
  "/contact",
  "/support",
  "/status",
  "/changelog",
  "/roadmap",
  "/privacy",
  "/terms",
  "/cookies",
  "/data-usage",
  "/overview",
  "/search",
  "/market-score",
  "/top-data",
  "/areas",
  "/developers",
  "/properties",
  "/enterprise",
  "/enterprise/demo",
  "/markets",
  "/reports/library",
  "/reports/generated",
  "/library",
  "/library/reports",
  "/library/insights",
  "/library/contracts-explained",
  "/blog",
  "/docs",
  "/docs/articles",
  "/docs/documentation",
  "/docs/partners-apis",
  "/docs/data-information",
  "/docs/industry",
  "/docs/careers-intern",
  "/docs/investors-relations",
  "/investor-relations",
  "/careers",
  "/media",
  "/plans",
  "/pricing",
  "/reports",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticEntries = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${baseUrl}${prefixLocalePath(route || "/", locale)}`,
      lastModified,
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1 : 0.7,
    })),
  )

  const blogEntries = locales.flatMap((locale) =>
    blogPosts.map((post) => ({
      url: `${baseUrl}${prefixLocalePath(`/blog/${post.slug}`, locale)}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  )

  const docsArticleEntries = locales.flatMap((locale) =>
    docsArticles.map((article) => ({
      url: `${baseUrl}${prefixLocalePath(`/docs/articles/${article.slug}`, locale)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  )

  const libraryEntries = locales.flatMap((locale) =>
    libraryArticles.map((article) => ({
      url: `${baseUrl}${prefixLocalePath(`/library/${article.slug}`, locale)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  )

  return [...staticEntries, ...blogEntries, ...docsArticleEntries, ...libraryEntries]
}
