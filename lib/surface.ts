/**
 * WHAT THIS PRODUCT IS, AND WHAT IS MERELY IN THE REPOSITORY.
 *
 * 145 page routes ship here. 94 of them are linked from somewhere in the app.
 * The other 51 are reachable only by typing the address, and most of them are
 * not unfinished ideas — they are the SAME product built again: /os, /dashboard,
 * /copilot and /workspace/* are parallel attempts at screens that already exist,
 * each abandoned halfway. A visitor who found one saw a version of Entrestate
 * nobody maintains, and an operator showing the product had to know which of
 * them was the real one.
 *
 * So the surface is declared, not inferred:
 *
 *   · Anything linked from the app is part of the product. Nothing here has to
 *     list it — the navigation already did.
 *   · DEEP_LINK_ROUTES are pages a person is SENT to: an evidence link, an
 *     embed, a password reset. Nothing links to them and nothing should.
 *   · HIDDEN_ROUTES answer 404 to a visitor, with the reason written down.
 *
 * NOTHING IS DELETED. Every hidden route still builds, still type-checks, and
 * comes back by moving one line — which is the point: deleting 44 pages in one
 * commit is how you discover, three weeks later, that one of them mattered.
 *
 * SHOW_ALL_ROUTES=1 turns the whole thing off for a preview or a local run, so
 * the way to check a hidden page is to look at it, not to edit this file.
 *
 * tests/surface.test.ts fails when a route in app/ is neither linked, nor a deep
 * link, nor hidden with a reason — the rule this codebase keeps relearning: a
 * list nobody is forced to update is a list that silently deletes things. It
 * also refuses to hide anything the app links to, which is not hypothetical: the
 * first run caught /me, the post-login home, in the hidden list. Hiding it would
 * have turned every successful sign-in into a 404.
 */

export const SHOW_ALL_ROUTES = process.env.SHOW_ALL_ROUTES === '1'

/**
 * Pages a person arrives at from a link somebody gave them — an evidence URL in
 * a report, an embed on a customer's site, a reset mail. Unlinked ON PURPOSE.
 */
export const DEEP_LINK_ROUTES: Record<string, string> = {
  '/evidence': 'an evidence permalink quoted in a report or an answer',
  '/t': 'a shared table snapshot',
  '/apps/docs': 'documentation served inside an embedded app',
  '/lead-agent/embed': 'the embeddable widget, loaded in a customer page',
  '/forgot-password': 'reached from the sign-in screen and from mail',
  '/checkout': 'entered from a pricing action, never linked in the nav',
  '/404': 'the not-found page itself',
}

/**
 * Hidden, with the reason. Grouped by why, because the four groups need four
 * different decisions later and a flat list would lose that.
 */
export const HIDDEN_ROUTES: Record<string, string> = {
  // ── The same product, built again ──────────────────────────────────────────
  // Four attempts at one screen. Until one of them is chosen and finished, a
  // visitor finding any of the others sees a half-built Entrestate.
  '/os': 'a parallel build of the main workspace',
  '/dashboard': 'a parallel build of the main workspace',
  '/copilot': 'a parallel build of the chat, which lives on /markets and /chat',
  // NOT /me itself: it is the post-login home — login, signup and the navbar
  // logo all send an authenticated person there. The guard caught this on its
  // first run, which is the entire argument for the guard: hiding it would have
  // turned every successful sign-in into a 404.
  '/me/listings/new': 'a create-listing form nothing links to, inside the real workspace',
  '/workspace/daas': 'a parallel build of the market feed',
  '/workspace/imports': 'a parallel build of import, unfinished',
  '/workspace/math-tools': 'a parallel build of the tools surface',
  '/workspace/saved-searches': 'a parallel build of saved searches',
  '/workspace/search': 'a parallel build of search, which lives on /search',
  '/workspace/agent-creator': 'a parallel build of the agent builder',
  '/notebook': 'the research notebook, unfinished and unlinked',
  '/notes': 'a second notes surface beside the notebook',
  '/tables': 'a parallel build of the table workspace',
  '/artifacts': 'a parallel build of the artifact list',
  '/automations': 'a parallel build of the automation list',
  '/automation-runtime': 'an internal runtime view, not a customer page',
  '/agent-runtime': 'an internal runtime view, not a customer page',
  '/lead-agent': 'the lead agent surface; only its /embed is used',
  '/library/insights': 'a second insights surface beside the library',
  '/reports/generated': 'an intermediate report list nothing links to',
  '/onboarding': 'an onboarding flow no signup path reaches',

  // ── Retired from the claim set, 2026-08-31 ────────────────────────────────
  // The owner's ruling: with the workspace automation/creative studio running
  // integrated, these three stop mattering — the Terminal connects to that
  // studio and to the time-table instead of carrying its own creative
  // surfaces. The code stays (hiding is reversible; deleting is not), but the
  // product no longer offers them, so they must not answer 200 to a visitor
  // or a crawler. Their catalog cards and doc pages were removed in the same
  // change, because this file's own rule is that hiding never breaks a link.
  '/storyboard': 'a creative surface retired in favour of the workspace studio',
  '/image-playground': 'a creative surface retired in favour of the workspace studio',
  '/timeline': 'a creative surface retired in favour of the workspace studio',

  // ── Settings and account, split across two builds ──────────────────────────
  '/settings/brand': 'settings split across two builds; this half is unreachable',
  '/settings/configuration': 'settings split across two builds; this half is unreachable',
  '/settings/profile': 'settings split across two builds; this half is unreachable',
  '/settings/tier': 'settings split across two builds; this half is unreachable',
  '/account/billing-activity': 'billing detail with no billing surface linking to it',

  // ── Commerce that is not wired ─────────────────────────────────────────────
  // /plans already redirects to /pricing in proxy.ts; the page underneath is a
  // second pricing page that would disagree with the first.
  '/plans': 'a second pricing page — proxy.ts already redirects /plans to /pricing',
  '/partners': 'a partner programme with nothing behind it yet',

  // ── Duplicates and dev leftovers ───────────────────────────────────────────
  '/investors-relations': 'a misspelt twin of /investor-relations — written twice, noticed by nobody',
  '/playground': 'a development scratch page',
  '/style-guide': 'a development reference page',
  '/intern': 'a development scratch page',
  '/column-registry': 'an internal schema view, not a customer page',
  '/api': 'a page sitting inside the API folder — not an endpoint, not a product page',
  '/apis': 'an old docs page; proxy.ts already redirects /apis to /docs/partners-apis',
  '/industry': 'an unfinished industry page with no link to it',
  '/responsibility': 'an unfinished policy page with no link to it',

  // ── Marketing drafts ───────────────────────────────────────────────────────
  '/agents/contracts': 'a marketing draft never linked',
  '/agents/onboarding': 'a marketing draft never linked',
  '/agents/sessions': 'a marketing draft never linked',
  '/chat-landing': 'a marketing draft superseded by /chat',
  '/demo': 'a marketing draft superseded by /enterprise/demo',
  '/enterprise/demo': 'the enterprise demo, kept out of the surface until it is real',
}

/**
 * Whether a locale-stripped pathname is hidden from visitors.
 *
 * Prefix-matched so a hidden section hides its children — /workspace/search
 * hides /workspace/search/anything — while a deep-link route under a hidden
 * parent still opens, which is the case /lead-agent/embed exists for.
 */
export function isHiddenRoute(pathname: string): boolean {
  if (SHOW_ALL_ROUTES) return false
  const path = pathname.replace(/\/+$/, '') || '/'
  for (const deep of Object.keys(DEEP_LINK_ROUTES)) {
    if (path === deep || path.startsWith(`${deep}/`)) return false
  }
  for (const hidden of Object.keys(HIDDEN_ROUTES)) {
    if (path === hidden || path.startsWith(`${hidden}/`)) return true
  }
  return false
}
