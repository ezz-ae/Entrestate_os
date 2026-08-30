"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

/**
 * SIGN-IN IS OFF AND THE PAGE SAYS SO.
 *
 * /en/login used to render the full form — Google button, email, password,
 * "Sign in" — on a deployment whose auth was never configured. Pressing the
 * button did nothing a person could read; the only explanation was a 501 on
 * /api/auth/session and a console.warn in a serverless log.
 *
 * A form that cannot work must not be shown. What is shown instead names the
 * missing setting, because the person hitting this screen on a fresh
 * deployment is usually the one who can fix it — never the values themselves,
 * only which one is absent.
 */

const COPY = {
  en: {
    title: "Sign-in is not available on this deployment",
    body: "Accounts are not configured here yet, so there is nothing to sign in to. Everything that does not need an account still works.",
    fix: "To turn it on, set these on the deployment and redeploy:",
    reasons: {
      "missing-base-url": "NEON_AUTH_BASE_URL is not set.",
      "missing-cookie-secret": "NEON_AUTH_COOKIE_SECRET is not set.",
      "weak-cookie-secret": "NEON_AUTH_COOKIE_SECRET is shorter than the 32 characters required to sign a session cookie.",
    },
    browse: "Browse the market",
    pricing: "See pricing",
  },
  ar: {
    title: "تسجيل الدخول غير متاح على هذا الإصدار",
    body: "الحسابات غير مُهيّأة هنا بعد، فلا يوجد ما تدخل إليه. كل ما لا يحتاج حساباً يعمل كالمعتاد.",
    fix: "لتفعيله، اضبط الآتي على هذا الإصدار ثم أعد النشر:",
    reasons: {
      "missing-base-url": "‏NEON_AUTH_BASE_URL غير مضبوط.",
      "missing-cookie-secret": "‏NEON_AUTH_COOKIE_SECRET غير مضبوط.",
      "weak-cookie-secret": "‏NEON_AUTH_COOKIE_SECRET أقصر من ٣٢ حرفاً، وهو الحد اللازم لتوقيع كوكي الجلسة.",
    },
    browse: "تصفّح السوق",
    pricing: "الأسعار",
  },
} as const

export type AuthUnavailableReason = keyof (typeof COPY)["en"]["reasons"]

export function AuthUnavailable({ reason }: { reason: AuthUnavailableReason }) {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale === "ar" ? "ar" : "en"]

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-7">
        <h1 className="text-lg font-semibold text-foreground">{copy.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        <div className="rounded-lg border border-border/60 bg-background p-4">
          <p className="text-xs text-muted-foreground">{copy.fix}</p>
          <p className="mt-2 font-mono text-xs text-foreground">{copy.reasons[reason]}</p>
        </div>
        <div className="flex flex-wrap gap-3 pt-1 text-sm">
          <Link href={prefixLocalePath("/markets", locale)} className="text-primary hover:underline">
            {copy.browse}
          </Link>
          <Link href={prefixLocalePath("/pricing", locale)} className="text-primary hover:underline">
            {copy.pricing}
          </Link>
        </div>
      </div>
    </main>
  )
}
