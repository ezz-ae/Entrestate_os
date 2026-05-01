"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, CreditCard, FileText, KeyRound, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const FALLBACK_USER = {
  name: "Entrestate Member",
  email: "account@entrestate.com",
  avatar: "/avatars/avatar-01.svg",
}

const COPY = {
  en: {
    account: "Account",
    signIn: "Sign in",
    overview: "Account overview",
    profile: "Profile settings",
    billing: "Billing",
    reports: "Reports",
    apiKeys: "API connections",
    signOut: "Sign out",
  },
  ar: {
    account: "الحساب",
    signIn: "تسجيل الدخول",
    overview: "نظرة عامة على الحساب",
    profile: "إعدادات الملف",
    billing: "الفوترة",
    reports: "التقارير",
    apiKeys: "اتصالات API",
    signOut: "تسجيل الخروج",
  },
} as const

export function AccountMenu() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const { data: session, isPending } = authClient.useSession()
  const copy = COPY[locale] ?? COPY.en

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isPending) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-foreground opacity-50">
          <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
        <span className="hidden sm:inline">{copy.account}</span>
        </div>
      )
  }

  if (!session?.user) {
    return (
      <Link
        href={prefixLocalePath("/login", locale)}
        className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-foreground hover:bg-secondary/80 transition-colors"
      >
        {copy.signIn}
      </Link>
    )
  }

  const user = session?.user
  const displayName = user?.name || user?.email || FALLBACK_USER.name
  const displayEmail = user?.email || FALLBACK_USER.email
  const avatar = user?.image || FALLBACK_USER.avatar
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push(prefixLocalePath("/login", locale))
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm text-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Avatar className="h-7 w-7">
          <AvatarImage src={avatar} alt={displayName} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline">{copy.account}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayEmail}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={prefixLocalePath("/account", locale)} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {copy.overview}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={prefixLocalePath("/account/profile", locale)} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {copy.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={prefixLocalePath("/account#billing", locale)} className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {copy.billing}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={prefixLocalePath("/account/reports", locale)} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {copy.reports}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={prefixLocalePath("/account/api-keys", locale)} className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {copy.apiKeys}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleSignOut()
          }}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {copy.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
