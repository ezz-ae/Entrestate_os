import { redirect } from "next/navigation"
import { LoginPageClient } from "@/components/auth/login-page-client"
import { resolvePostLoginHref } from "@/lib/auth/navigation"
import { authStatus, getSessionUser } from "@/lib/auth/server"
import { AuthUnavailable } from "@/components/auth/auth-unavailable"
import { getRequestLocale } from "@/i18n/request"

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const params = (await searchParams) ?? {}
  // A deployment with no auth configured must say so, not render a form
  // whose button does nothing — which is what terminal.entrestate.com did.
  const status = authStatus()
  if (!status.ready) return <AuthUnavailable reason={status.reason} />

  const sessionUser = await getSessionUser()

  if (sessionUser) {
    redirect(resolvePostLoginHref(locale, firstParam(params.next), "/me"))
  }

  return <LoginPageClient />
}
