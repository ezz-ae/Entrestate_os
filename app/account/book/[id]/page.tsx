import type { Metadata } from "next"

import { NotebookDetailView } from "@/app/notebook/[id]/page"
import { requireSyncedUser } from "@/lib/auth/guard"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Research Notebook - Entrestate",
  description: "Review generated notebook pages, refresh outputs, and ask follow-up questions inside your account workspace.",
}

export default async function AccountBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getRequestLocale()
  const resolvedParams = await params
  const user = await requireSyncedUser(`/account/book/${resolvedParams.id}`)

  return <NotebookDetailView basePath="/account/book" accountMode />
}
