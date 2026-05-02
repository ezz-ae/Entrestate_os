"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { resolvePostLoginHref } from "@/lib/auth/navigation"

const COPY = {
  en: {
    quote: '"When the market signal is organized, the decision becomes faster and calmer."',
    person: "Ahmed Al-Rashid",
    role: "Investment Director, Gulf Capital Partners",
    markets: "Markets",
    areas: "Areas tracked",
    projects: "Projects scored",
    title: "Welcome back",
    subtitle: "Sign in to your Entrestate account",
    google: "Continue with Google",
    googleLoading: "Connecting to Google...",
    divider: "or",
    email: "Email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    forgot: "Forgot password?",
    passwordPlaceholder: "Enter your password",
    submit: "Sign in",
    submitting: "Signing in...",
    pending: "Checking session status…",
    noAccount: "Don't have an account?",
    requestAccess: "Request access",
    invalidOrigin: (origin: string) =>
      `Auth domain is not trusted. Add ${origin} to Neon Auth trusted origins (with and without www), then retry.`,
    genericError: "Unable to sign in. Please try again.",
    timeout: "Login timed out. Check Neon Auth settings and try again.",
    googleTimeout: "Google sign-in timed out. Check Neon Auth settings and try again.",
  },
  ar: {
    quote: '"لما تتجمع الإشارة والبيان في شاشة واحدة، يصير القرار أسرع وأهدأ."',
    person: "أحمد الراشد",
    role: "مدير الاستثمار، Gulf Capital Partners",
    markets: "أسواق",
    areas: "منطقة",
    projects: "مشروع",
    title: "أهلاً بعودتك",
    subtitle: "ادخل إلى حساب Entrestate",
    google: "الدخول عبر Google",
    googleLoading: "جارٍ فتح Google...",
    divider: "أو",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@company.com",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    passwordPlaceholder: "اكتب كلمة المرور",
    submit: "تسجيل الدخول",
    submitting: "جارٍ تسجيل الدخول...",
    pending: "جارٍ التأكد من الجلسة...",
    noAccount: "ليس لديك حساب؟",
    requestAccess: "افتح حسابك",
    invalidOrigin: (origin: string) =>
      `هذا الدومين غير مفعّل للدخول. أضف ${origin} إلى Trusted Origins في Neon Auth ثم أعد المحاولة.`,
    genericError: "تعذر تسجيل الدخول الآن. حاول مرة أخرى.",
    timeout: "انتهت مهلة تسجيل الدخول. راجع إعدادات Neon Auth ثم أعد المحاولة.",
    googleTimeout: "انتهت مهلة الدخول عبر Google. راجع إعدادات Neon Auth ثم أعد المحاولة.",
  },
} as const

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const homeHref = prefixLocalePath("/", locale)
  const targetHref = resolvePostLoginHref(locale, searchParams?.get("next"), "/account")
  const forgotHref = prefixLocalePath("/forgot-password", locale)
  const nextQuery = searchParams?.get("next")
  const signupHref = nextQuery
    ? prefixLocalePath(`/signup?next=${encodeURIComponent(nextQuery)}`, locale)
    : prefixLocalePath("/signup", locale)

  const toFriendlyAuthError = (message?: string | null) => {
    const normalized = (message ?? "").toLowerCase()
    if (normalized.includes("invalid origin")) {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : locale === "ar" ? "هذا الدومين" : "this site origin"
      return copy.invalidOrigin(currentOrigin)
    }
    return message || copy.genericError
  }

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  useEffect(() => {
    if (session?.user) {
      router.replace(targetHref)
    }
  }, [session, router, targetHref])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    try {
      const { error } = await withTimeout(authClient.signIn.email({ email, password }), 15000, copy.timeout)

      if (error) {
        setFormError(toFriendlyAuthError(error.message))
        return
      }

      router.push(targetHref)
    } catch (err) {
      setFormError(toFriendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setFormError(null)
    setIsGoogleLoading(true)

    try {
      const { error } = await withTimeout(
        authClient.signIn.social({
          provider: "google",
          callbackURL: targetHref,
        }),
        15000,
        copy.googleTimeout,
      )

      if (error) {
        setFormError(toFriendlyAuthError(error.message))
      }
    } catch (err) {
      setFormError(toFriendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-primary">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="flex gap-0.5" aria-hidden="true">
            <div className="w-3 h-3 rounded-sm bg-primary-foreground" />
            <div className="w-3 h-3 rounded-sm bg-primary-foreground/60" />
            <div className="w-3 h-3 rounded-sm bg-accent" />
          </div>
          <span className="text-lg font-medium tracking-tight text-primary-foreground">entrestate</span>
        </Link>

        <div className="max-w-md">
          <blockquote className="text-2xl font-serif text-primary-foreground leading-relaxed">{copy.quote}</blockquote>
          <div className="mt-6">
            <p className="text-primary-foreground font-medium">{copy.person}</p>
            <p className="text-primary-foreground/60 text-sm">{copy.role}</p>
          </div>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-3xl font-serif text-primary-foreground">8</p>
            <p className="text-sm text-primary-foreground/60 mt-1">{copy.markets}</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">200+</p>
            <p className="text-sm text-primary-foreground/60 mt-1">{copy.areas}</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">7,000+</p>
            <p className="text-sm text-primary-foreground/60 mt-1">{copy.projects}</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href={homeHref} className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="w-3 h-3 rounded-sm bg-foreground" />
                <div className="w-3 h-3 rounded-sm bg-foreground/60" />
                <div className="w-3 h-3 rounded-sm bg-accent" />
              </div>
              <span className="text-lg font-medium tracking-tight text-foreground">entrestate</span>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-serif text-foreground">{copy.title}</h1>
              <p className="text-muted-foreground mt-2 text-sm">{copy.subtitle}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? copy.googleLoading : copy.google}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{copy.divider}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {copy.email}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                  required
                  className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    {copy.password}
                  </label>
                  <Link href={forgotHref} className="text-xs text-accent hover:underline">
                    {copy.forgot}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    required
                    className="w-full px-4 py-2.5 pr-11 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 mt-2"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? copy.submitting : copy.submit}
              </Button>
              {isPending && !isLoading ? <p className="text-xs text-muted-foreground">{copy.pending}</p> : null}
              {formError && <p className="text-sm text-rose-300">{formError}</p>}
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {copy.noAccount}{" "}
            <Link href={signupHref} className="text-accent hover:underline font-medium">
              {copy.requestAccess}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
