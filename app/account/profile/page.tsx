import type { Metadata } from "next"

import ProfileSettingsPage from "@/app/settings/profile/page"
import { requireSyncedUser } from "@/lib/auth/guard"
import { getRequestLocale } from "@/i18n/request"

export const metadata: Metadata = {
  title: "Profile Settings - Entrestate",
  description: "Manage your decision profile, market preferences, and weighting defaults.",
}

export default async function AccountProfilePage() {
  const locale = await getRequestLocale()
  const user = await requireSyncedUser("/account/profile")

  return <ProfileSettingsPage />
}
