"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { prefixLocalePath } from "@/i18n/locale"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const locale = useLocale()
  const t = useTranslations("system")

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24">
      <section className="mx-auto max-w-2xl rounded-2xl border border-border/70 bg-card/70 p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{t("errorTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("errorBody")}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("retry")}
          </button>
          <Link
            href={prefixLocalePath("/", locale as "en" | "ar")}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            {t("backHome")}
          </Link>
        </div>

        {error?.digest ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {t("reference")}: {error.digest}
          </p>
        ) : null}
      </section>
    </main>
  )
}
