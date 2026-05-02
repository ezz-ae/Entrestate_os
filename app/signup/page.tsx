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
    heroTitle: "A clearer way to enter the market.",
    heroBody: "Open your account, read the market with evidence, compare options, and move when the picture is ready.",
    statOneTitle: "Free",
    statOneLabel: "To explore",
    statTwoTitle: "Verified",
    statTwoLabel: "Advisors",
    statThreeTitle: "Signed",
    statThreeLabel: "Reports",
    title: "Request access",
    subtitle: "Create your Entrestate account",
    google: "Continue with Google",
    googleLoading: "Connecting to Google...",
    divider: "or",
    name: "Full name",
    namePlaceholder: "Your full name",
    email: "Work email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Min. 8 characters",
    submit: "Create account",
    submitting: "Creating account...",
    pending: "Checking session status…",
    success: "Check your email to verify your account, then sign in.",
    termsLead: "By signing up, you agree to our",
    terms: "Terms",
    privacy: "Privacy Policy",
    already: "Already have an account?",
    signIn: "Sign in",
    invalidOrigin: (origin: string) =>
      `Auth domain is not trusted. Add ${origin} to Neon Auth trusted origins (with and without www), then retry.`,
    genericError: "Unable to create account. Please try again.",
    timeout: "Registration timed out. Check Neon Auth settings and try again.",
    googleTimeout: "Google sign-in timed out. Check Neon Auth settings and try again.",
  },
  ar: {
    heroTitle: "استثمر بناءً على الحقائق، لا التخمينات.",
    heroBody: "أنشئ حسابك، راقب تحركات السوق، قارن بين الخيارات، واتخذ قراراتك بناءً على بيانات دقيقة ومدعومة بالأدلة.",
    statOneTitle: "مجاني",
    statOneLabel: "للاستكشاف",
    statTwoTitle: "خبراء",
    statTwoLabel: "معتمدون",
    statThreeTitle: "تقارير",
    statThreeLabel: "احترافية",
    title: "طلب الوصول",
    subtitle: "أنشئ حسابك على Entrestate وابدأ الآن",
    google: "المتابعة عبر Google",
    googleLoading: "جارٍ الاتصال بـ Google...",
    divider: "أو",
    name: "الاسم بالكامل",
    namePlaceholder: "اكتب اسمك بالكامل",
    email: "البريد الإلكتروني المهني",
    emailPlaceholder: "you@company.com",
    password: "كلمة المرور",
    passwordPlaceholder: "8 أحرف كحد أدنى",
    submit: "إنشاء حساب جديد",
    submitting: "جارٍ إنشاء الحساب...",
    pending: "جارٍ التحقق من الجلسة...",
    success: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني، يرجى تفعيله لتتمكن من الدخول.",
    termsLead: "بالتسجيل، أنت توافق على",
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    already: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    invalidOrigin: (origin: string) =>
      `هذا الدومين غير موثوق. يرجى إضافة ${origin} إلى قائمة Neon Auth ثم المحاولة مجدداً.`,
    genericError: "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً.",
    timeout: "انتهت المهلة المحددة للتسجيل. يرجى مراجعة الإعدادات والمحاولة مجدداً.",
    googleTimeout: "انتهت مهلة تسجيل الدخول عبر Google. يرجى المحاولة مجدداً.",
  },
} as const

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en
  const { data: session, isPending } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const homeHref = prefixLocalePath("/", locale)
  const targetHref = resolvePostLoginHref(locale, searchParams?.get("next"), "/account")
  const loginHref = searchParams?.get("next")
    ? prefixLocalePath(`/login?next=${encodeURIComponent(searchParams.get("next") ?? "")}`, locale)
    : prefixLocalePath("/login", locale)
  const termsHref = prefixLocalePath("/terms", locale)
  const privacyHref = prefixLocalePath("/privacy", locale)

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
      if (timeoutHandle) clearTimeout(timeoutHandle)
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
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const { data, error } = await withTimeout(authClient.signUp.email({ email, password, name }), 15000, copy.timeout)

      if (error) {
        setFormError(toFriendlyAuthError(error.message))
        return
      }

      if (data?.token) {
        router.push(targetHref)
        return
      }

      setSuccessMessage(copy.success)
    } catch (err) {
      setFormError(toFriendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setFormError(null)
    setSuccessMessage(null)
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
          <h2 className="text-3xl font-serif text-primary-foreground leading-tight mb-4">{copy.heroTitle}</h2>
          <p className="text-primary-foreground/60 leading-relaxed">{copy.heroBody}</p>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-3xl font-serif text-primary-foreground">{copy.statOneTitle}</p>
            <p className="text-sm text-primary-foreground/60 mt-1">{copy.statOneLabel}</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">{copy.statTwoTitle}</p>
            <p className="text-sm text-primary-foreground/60 mt-1">{copy.statTwoLabel}</p>
          </div>
          <div>
            <p className="text-3xl font-serif text-primary-foreground">{copy.statThreeTitle}</p>
            <p className="text-sm text-primary-foreground/60 mt-1">{copy.statThreeLabel}</p>
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
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  {copy.name}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.namePlaceholder}
                  required
                  className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                />
              </div>

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
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  {copy.password}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    required
                    minLength={8}
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
              {successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}
            </form>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              {copy.termsLead}{" "}
              <Link href={termsHref} className="text-accent hover:underline">
                {copy.terms}
              </Link>
              {locale === "ar" ? " و" : " and "}
              <Link href={privacyHref} className="text-accent hover:underline">
                {copy.privacy}
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {copy.already}{" "}
            <Link href={loginHref} className="text-accent hover:underline font-medium">
              {copy.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
