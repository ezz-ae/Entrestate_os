/**
 * WHAT COUNTS AS A SALE — the one definition every DLD price statistic uses.
 *
 * Measured on the live table, 2026-09-03, 46,161 rows:
 *
 *   | statistic      | over every row  | residential sales | overstated by |
 *   |----------------|-----------------|-------------------|---------------|
 *   | average price  | AED 3,586,141   | AED 2,019,588     |         +78%  |
 *   | median price   | AED 1,620,000   | AED 1,333,000     |         +22%  |
 *   | total volume   | AED 165.5 bn    | AED 66.2 bn       |        +150%  |
 *
 * Those left-hand numbers are what `executeDldMarketPulse` and
 * `executeDldTransactionSearch` reported: `AVG(amount)` and `SUM(amount)` over
 * the whole table, with no filter of any kind. The average Dubai apartment
 * price the terminal quoted was 78% too high, and the market it described was
 * two and a half times the size of the real one.
 *
 * Nothing was broken. Every one of those rows is a real DLD record. They are
 * simply not the same KIND of thing, and averaging them answers a question
 * nobody asked:
 *
 *   · 2,195 Mortgages — a loan registered against a property. The amount is
 *     the loan, not a price, and no ownership changed hands.
 *   · 4,701 Land rows, median AED 11.2m against an apartment median of 1.3m —
 *     including six `Sale On Payment Plan` land rows whose average alone is
 *     AED 768,555,016. Six rows, and they move the mean of the whole table.
 *   · 4,595 Buildings — whole-tower transfers.
 *   · 1,337 Offices, 358 Shops, 633 hotel units, and a handful of warehouses
 *     and workshops, which are `prop_type = 'Unit'` and are not homes.
 *   · Development registrations and lease-to-own structures, which are
 *     developer- and financing-side events rather than a market clearing price.
 *
 * ── THE TWO VOCABULARIES ────────────────────────────────────────────────
 *
 * The table holds two loads that name the same things differently, and this is
 * the trap that makes a hand-written filter wrong on half the data. The
 * January–March load uses twelve `sub_type` values with `prop_type` in
 * {Building, Land, Unit}; the August load uses two (`Sales`, `Mortgages`) and
 * introduces `prop_type = 'Apartment'`.
 *
 * So `sub_type = 'Sale' AND prop_type = 'Unit'` — the obvious filter, and the
 * first one written against this table — silently returns ZERO August rows.
 * Both spellings are listed below for that reason, not by accident.
 *
 * ── UNKNOWN VALUES ARE EXCLUDED AND COUNTED, NEVER ABSORBED ─────────────
 *
 * The lists are ALLOW-lists. When DLD invents a new `sub_type`, it does not
 * quietly join the price base; it falls out, and `unrecognisedSaleTypes()`
 * reports it. A deny-list would have the opposite failure mode — new vocabulary
 * silently averaged into the number a customer is about to act on — and this
 * table has already changed vocabulary once inside eight months.
 *
 * ── WHAT THIS FEED IS, HONESTLY ─────────────────────────────────────────
 *
 * Overwhelmingly apartments: 27,011 `Flat` plus 4,429 `Apartment` out of 32,803
 * residential sales, against 3 townhouses and no villa category at all. Villas
 * transact here as Land and Building rows, which this filter removes. Any
 * surface built on it should say "apartments", not "property".
 */

/**
 * Sub-types that transfer ownership at a price a buyer actually paid.
 *
 * `Sell - Pre registration` is the off-plan sale registered before completion
 * and is the single largest bucket (20,292 rows). It is a real price and it
 * belongs here, but it is a DEVELOPER price on a payment plan — which is why
 * every surface that reports an average should also split by `reg_type`
 * (Off-Plan / Ready) rather than blending the two into one headline.
 */
export const RESIDENTIAL_SALE_SUB_TYPES = [
  "Sale", // Jan–Mar vocabulary
  "Sales", // Aug vocabulary — same event, different label
  "Sell - Pre registration", // off-plan, registered before handover
  "Delayed Sell", // completed late; still a transfer at a price
  "Sale On Payment Plan", // instalment sale; the amount is the agreed price
] as const

/**
 * Deliberately NOT sales, with the reason each one is out:
 *
 *   Mortgages                        a loan, not a transfer
 *   Development Registration (+ Pre) developer registering with the authority
 *   Sell Development (+ variants)    developer-side disposal, not the resale market
 *   Delayed Development              same, late
 *   Lease to Own Registration (+)    a financing structure, not a clearing price
 *
 * Kept as a named list so the exclusions are reviewable rather than implied by
 * the absence of an entry above.
 */
export const EXCLUDED_SUB_TYPES = [
  "Mortgages",
  "Development Registration",
  "Development Registration Pre-Registration",
  "Sell Development",
  "Sell Development - Pre Registration",
  "Delayed Sell Development",
  "Delayed Development",
  "Lease to Own Registration",
  "Delayed Sell Lease to Own Registration",
] as const

/** Both loads' spellings for "an individual unit rather than land or a tower". */
export const RESIDENTIAL_PROP_TYPES = ["Unit", "Apartment"] as const

/**
 * A home, inside `prop_type = 'Unit' | 'Apartment'`.
 *
 * The exclusions here are the ones a price statistic gets wrong most quietly,
 * because these rows LOOK residential: Office, Shop, Warehouse, Workshop and
 * Show Rooms are commercial, and Hotel Apartment / Hotel Rooms are hospitality
 * stock priced against room yields rather than homes.
 */
export const RESIDENTIAL_PROP_SUB_TYPES = [
  "Flat",
  "Apartment",
  "Unit",
  "Stacked Townhouses",
] as const

/** Renders a string list as a SQL literal tuple. Inputs are module constants. */
function quoteList(values: readonly string[]): string {
  // Every value here is a compile-time constant from this file, so there is no
  // caller-supplied text in the output. The escape is belt-and-braces: it makes
  // the function safe to reuse if that ever stops being true.
  return values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ")
}

/**
 * The WHERE fragment defining a residential sale, WITHOUT the `WHERE` keyword
 * and without a leading `AND` — callers compose it.
 *
 * @param alias table alias to qualify the columns with, e.g. `t`. Empty for an
 *              unaliased single-table query.
 */
export function residentialSaleFilter(alias = ""): string {
  const p = alias ? `${alias}.` : ""
  return [
    `${p}prop_type IN (${quoteList(RESIDENTIAL_PROP_TYPES)})`,
    `${p}prop_sub_type IN (${quoteList(RESIDENTIAL_PROP_SUB_TYPES)})`,
    `${p}sub_type IN (${quoteList(RESIDENTIAL_SALE_SUB_TYPES)})`,
    // A zero or null amount is not a price. It is a row we cannot average.
    `${p}amount > 0`,
  ].join(" AND ")
}

/**
 * What a caller should print beside any number computed on this basis.
 *
 * Every envelope that reports a price now carries this string. A statistic
 * whose basis is not stated is a statistic the reader has to guess at, and the
 * guess they make is "all Dubai property" — which is exactly the reading that
 * made the old numbers wrong.
 */
export const SALES_BASIS =
  "Residential apartment sales only — excludes mortgages, land, whole buildings, offices, retail, hotel units and development registrations."

/**
 * Sub-types present in the data that no list in this module names.
 *
 * The point of an allow-list is that it goes stale, visibly. Call this from a
 * health check or a report: a non-empty result means DLD's vocabulary moved and
 * some rows are being dropped from every price statistic until somebody
 * classifies them. Silence here is the only acceptable state, and it is a
 * state somebody has to look at — nothing in this module enforces it, because a
 * new label is a question for a person, not a build failure.
 */
export function unrecognisedSaleTypesSql(table: string): string {
  const known = quoteList([...RESIDENTIAL_SALE_SUB_TYPES, ...EXCLUDED_SUB_TYPES])
  return `
    SELECT sub_type, prop_type, COUNT(*)::int AS n
    FROM ${table}
    WHERE sub_type IS NOT NULL
      AND sub_type NOT IN (${known})
    GROUP BY sub_type, prop_type
    ORDER BY n DESC
  `
}
