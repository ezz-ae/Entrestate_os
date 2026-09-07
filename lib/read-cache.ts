import "server-only"
import { unstable_cache } from "next/cache"

/**
 * THE SAME READ, SHARED FOR A WHILE — because nine seconds is not a page.
 *
 * Measured against production on 2026-09-07, cold:
 *
 *     /en/overview     9,633 ms
 *     /en/properties   7,315 ms
 *     /en/top-data     5,816 ms
 *     /en/areas        1,945 ms
 *     /en/developers   1,077 ms
 *
 * The Decision Terminal is the page a judge or a buyer opens first, and it
 * showed app/loading.tsx — "Fetching the latest page state and market
 * context." — for the better part of ten seconds. The server itself is not
 * slow (TTFB 318 ms once warm); what costs the time is that every one of
 * these pages is `force-dynamic` and runs its full aggregate queries again
 * for every single visitor, on a serverless instance that may be cold and a
 * database that may be idle.
 *
 * None of those numbers change per request. The curated inventory changes
 * when an ingest runs; the scores when the engine runs; the DLD coverage when
 * a backfill lands. So the read is shared for a window instead of repeated:
 * the value is identical, it is simply not recomputed for the next visitor
 * inside the window.
 *
 * WHAT THIS IS NOT. It is not a fallback and it does not invent anything —
 * a cached read is a real read that happened minutes ago, not a remembered
 * table of counts (lib/platform-metrics.ts holds the one honest fallback, for
 * a read that FAILS). And it never wraps anything that touches cookies(),
 * headers() or a session: `unstable_cache` shares its result between people,
 * so anything per-person must stay out of it. Everything wrapped here is a
 * pure aggregate over public inventory.
 *
 * `revalidateTag(READ_TAG)` drops the whole set the moment an ingest wants it
 * gone, which is the reason the tag exists.
 */

/** One tag over every shared market read, so an ingest can drop them together. */
export const READ_TAG = "market-read"

/**
 * Five minutes. Long enough that a person clicking through the product pays
 * the query once rather than once per page; short enough that a rebuild is
 * visible while somebody is still looking at the screen that triggered it.
 */
export const READ_TTL_SECONDS = 300

/**
 * Wrap a pure market read. `key` must be unique per function AND per argument
 * set — `unstable_cache` keys on it, so two different reads sharing a key
 * would serve each other's rows.
 */
export function sharedRead<T>(key: string, read: () => Promise<T>, ttl = READ_TTL_SECONDS): () => Promise<T> {
  return unstable_cache(read, ["market-read", key], { revalidate: ttl, tags: [READ_TAG] })
}
