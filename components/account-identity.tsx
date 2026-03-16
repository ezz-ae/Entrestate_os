"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export function AccountIdentity() {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        {isArabic ? "جارٍ التحقق من الجلسة الحالية..." : "Checking your account session…"}
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isArabic ? "سجّل الدخول لإدارة حسابك" : "Sign in to manage your account"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isArabic
              ? "هنا تجد ملف الجهة، الصلاحيات، وإعدادات الاشتراك." 
              : "Your organization profile and access controls live here."}
          </p>
        </div>
        <Link href={prefixLocalePath("/login", locale)} className="text-sm text-accent hover:underline font-medium">
          {isArabic ? "اذهب إلى تسجيل الدخول" : "Go to sign in"}
        </Link>
      </div>
    )
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push(prefixLocalePath("/login", locale))
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          {isArabic ? `الدخول باسم ${session.user.name || session.user.email}` : `Signed in as ${session.user.name || session.user.email}`}
        </p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <Button variant="outline" onClick={handleSignOut} className="border-border">
        {isArabic ? "تسجيل الخروج" : "Sign out"}
      </Button>
    </div>
  )
}
