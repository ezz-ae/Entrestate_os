import "server-only"

import { cookies } from "next/headers"
import { getBusinessOrigin } from "@/lib/business-store"

/**
 * PHASE 5 OF THE ACCOUNT FOUNDATION, the Terminal side — "nothing rebuilt,
 * everything re-pointed."
 *
 * The business keeps the account: the wallet, the apps, the requests. The
 * Terminal RENDERS it. This module is the whole of the re-pointing: one
 * server-side GET of the business's /api/account/summary with the shared
 * .entrestate.com session cookie relayed — the same cookie both sites
 * already speak — and a typed, fail-soft read of the answer.
 *
 * Fail-soft is the contract: signed out, unreachable, slow (4 s), or a shape
 * this reader does not recognise all return null, and /me simply renders
 * without the card. The Terminal never invents an account fact it did not
 * receive — a balance shown here is a display string the business's ledger
 * produced, never recomputed.
 */

export type BusinessAccountApp = {
  id: string
  name: string
  status: "requested" | "active" | "declined"
  billingLabel: string
}

export type BusinessAccountWorkspace = {
  subdomain: string
  company: string
  status: "trial" | "active" | "suspended"
  url: string
  /** The apex route that proves ownership and opens the workspace. A link, not a credential. */
  enterUrl: string
}

export type BusinessAccountSummary = {
  name: string | null
  email: string | null
  wallet: { accountNo: string; balanceAed: string; heldAed: string; pendingTopUps: number } | null
  apps: BusinessAccountApp[]
  /**
   * The workspaces this account owns. The business decides the list (ownership,
   * verified email, suspension) — the Terminal only renders it, so an empty
   * list here is the business's answer, not a Terminal-side guess.
   */
  workspaces: BusinessAccountWorkspace[]
  /** Only true when the business says the identity could complete a creation. */
  canCreateWorkspace: boolean
  accountUrl: string
  storeUrl: string
}

export async function getBusinessAccountSummary(): Promise<BusinessAccountSummary | null> {
  try {
    const cookieHeader = (await cookies()).toString()
    if (!cookieHeader) return null
    const origin = getBusinessOrigin()
    const res = await fetch(`${origin}/api/account/summary`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    const account = (data.account ?? {}) as Record<string, unknown>
    const wallet = data.wallet as Record<string, unknown> | null
    const links = (data.links ?? {}) as Record<string, unknown>
    const apps = Array.isArray(data.apps)
      ? data.apps.flatMap((raw): BusinessAccountApp[] => {
          const r = (raw ?? {}) as Record<string, unknown>
          const id = typeof r.id === "string" ? r.id : ""
          const name = typeof r.name === "string" ? r.name : ""
          const status = r.status === "active" ? "active" : r.status === "declined" ? "declined" : "requested"
          if (!id || !name) return []
          return [{ id, name, status, billingLabel: typeof r.billingLabel === "string" ? r.billingLabel : "" }]
        })
      : []
    const workspaces = Array.isArray(data.workspaces)
      ? data.workspaces.flatMap((raw): BusinessAccountWorkspace[] => {
          const r = (raw ?? {}) as Record<string, unknown>
          const subdomain = typeof r.subdomain === "string" ? r.subdomain : ""
          const company = typeof r.company === "string" ? r.company : ""
          const url = typeof r.url === "string" ? r.url : ""
          const enterUrl = typeof r.enterUrl === "string" ? r.enterUrl : ""
          // enterUrl is the only thing that opens the door; a row without it is
          // a row this reader cannot offer, so it is dropped rather than shown
          // as a dead link.
          if (!subdomain || !company || !url || !enterUrl.startsWith("https://entrestate.com/")) return []
          const status = r.status === "active" ? "active" : r.status === "suspended" ? "suspended" : "trial"
          return [{ subdomain, company, status, url, enterUrl }]
        })
      : []
    return {
      name: typeof account.name === "string" ? account.name : null,
      email: typeof account.email === "string" ? account.email : null,
      wallet:
        wallet && typeof wallet.balanceAed === "string" && typeof wallet.accountNo === "string"
          ? {
              accountNo: wallet.accountNo,
              balanceAed: wallet.balanceAed,
              heldAed: typeof wallet.heldAed === "string" ? wallet.heldAed : "0.00",
              pendingTopUps: Number(wallet.pendingTopUps) || 0,
            }
          : null,
      apps,
      workspaces,
      canCreateWorkspace: data.canCreateWorkspace === true,
      accountUrl: typeof links.account === "string" ? links.account : `${origin}/business/account`,
      storeUrl: typeof links.store === "string" ? links.store : `${origin}/business/store`,
    }
  } catch {
    return null
  }
}
