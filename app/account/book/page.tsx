import type { Metadata } from "next"

import { NotebookLibraryView } from "@/app/notebook/page"
import { requireSyncedUser } from "@/lib/auth/guard"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Research Notebooks - Entrestate",
  description: "Create and manage working research notebooks for areas, projects, clients, and portfolios.",
}

export default async function AccountBookPage() {
  const locale = await getRequestLocale()
  const user = await requireSyncedUser("/account/book")

  return <NotebookLibraryView basePath="/account/book" accountMode />
}
