import "server-only"

/**
 * THE BUSINESS APP STORE, AS THE TERMINAL SEES IT.
 *
 * The account model the owner set: the Terminal account is THE account —
 * search and data stay free here — and the SELLING happens through the
 * business's App Store on entrestate.com. "مش ده حساب وده حساب": one person,
 * one account, and inside it they see what the business sells.
 *
 * The catalog is FETCHED from the business (/api/store/catalog), never
 * copied into this repository. A vendored copy of the Terminal once absorbed
 * the price guard meant for the real one and a wrong price shipped — the
 * lesson stands in both directions. If the business is unreachable, the
 * section renders nothing rather than something stale or invented.
 */

export type BusinessStoreProduct = {
  id: string
  name: string
  tagline: string
  tier: "full" | "lite"
  status: "live" | "planned"
  plans: string[]
  liteOf?: string
}

export type BusinessStore = {
  storeUrl: string
  products: BusinessStoreProduct[]
}

const DEFAULT_BUSINESS_ORIGIN = "https://entrestate.com"

export function getBusinessOrigin(): string {
  const configured = process.env.BUSINESS_STORE_ORIGIN?.trim()
  if (!configured) return DEFAULT_BUSINESS_ORIGIN
  try {
    return new URL(configured).origin
  } catch {
    return DEFAULT_BUSINESS_ORIGIN
  }
}

function asProduct(value: unknown): BusinessStoreProduct | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const id = typeof record.id === "string" ? record.id.trim() : ""
  const name = typeof record.name === "string" ? record.name.trim() : ""
  const tagline = typeof record.tagline === "string" ? record.tagline.trim() : ""
  const tier = record.tier === "lite" ? "lite" : record.tier === "full" ? "full" : null
  const status = record.status === "planned" ? "planned" : record.status === "live" ? "live" : null
  if (!id || !name || !tier || !status) return null
  return {
    id,
    name,
    tagline,
    tier,
    status,
    plans: Array.isArray(record.plans) ? record.plans.filter((p): p is string => typeof p === "string") : [],
    ...(typeof record.liteOf === "string" && record.liteOf ? { liteOf: record.liteOf } : {}),
  }
}

export async function getBusinessStore(): Promise<BusinessStore | null> {
  const origin = getBusinessOrigin()
  try {
    const response = await fetch(`${origin}/api/store/catalog`, {
      next: { revalidate: 600 },
      headers: { accept: "application/json" },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as { store_url?: unknown; products?: unknown }
    const products = Array.isArray(payload.products)
      ? payload.products.map(asProduct).filter((p): p is BusinessStoreProduct => p !== null)
      : []
    if (products.length === 0) return null
    const storePath = typeof payload.store_url === "string" && payload.store_url.startsWith("/")
      ? payload.store_url
      : "/business/store"
    return { storeUrl: `${origin}${storePath}`, products }
  } catch {
    return null
  }
}
