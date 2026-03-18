"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { locales, prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("locale")

  const normalizedPath = stripLocalePrefix(pathname || "/")
  const search = searchParams.toString()

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1" aria-label={t("label")}>
      {locales.map((targetLocale) => {
        const href = `${prefixLocalePath(normalizedPath, targetLocale)}${search ? `?${search}` : ""}`
        const isActive = targetLocale === locale

        return (
          <Link
            key={targetLocale}
            href={href}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(targetLocale)}
          </Link>
        )
      })}
    </div>
  )
}
