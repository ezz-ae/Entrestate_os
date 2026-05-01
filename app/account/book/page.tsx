import type { Metadata } from "next"
import { redirect } from "next/navigation"

import NotebookPage from "@/app/notebook/page"
import { getSyncedUser } from "@/lib/auth/sync"
import { prefixLocalePath } from "@/i18n/locale"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Personal Market Book - Entrestate",
  description: "Generate and manage your personal market books, research notebooks, and export-ready artifacts.",
}

export default async function AccountBookPage() {
  const locale = await getRequestLocale()
  const user = await getSyncedUser()
  if (!user) {
    redirect(prefixLocalePath("/login", locale))
  }

  return <NotebookPage />
}
