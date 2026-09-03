/**
 * THE SAME AREA APPEARS TWICE, ONCE SHOUTING.
 *
 * The DLD table holds 189 distinct area strings for 123 real areas. Sixty-six
 * areas are split in two, and those splits hold 24,669 of the 32,803
 * residential sales — **three quarters of the data**.
 *
 * The cause is the same vocabulary drift that runs through this feed, one level
 * down: the January–March load writes `JUMEIRAH VILLAGE CIRCLE`, the August
 * load writes `Jumeirah Village Circle`. Group by the raw string and JVC is two
 * areas with two medians (AED 16,288 and 17,357 per sqm off-plan), Business Bay
 * is two areas, Dubai South is two areas — and a ranked list shows each of them
 * twice, in different places, with different prices.
 *
 * ── THE NORMALISATION IS DELIBERATELY MINIMAL ──────────────────────────
 *
 * `UPPER(TRIM(area))` and nothing more. Measured before choosing it: collapsing
 * whitespace gives 123 areas, stripping punctuation gives 123 areas, and
 * upper+trim alone gives 123 areas. The difference is ONLY case, so anything
 * cleverer buys nothing and risks merging two areas that are genuinely
 * different. A normaliser that fixes problems the data does not have is a
 * normaliser that will one day fold "Al Barsha 1" into "Al Barsha".
 *
 * ── THE DISPLAY NAME IS CHOSEN, NOT INVENTED ───────────────────────────
 *
 * Title-casing programmatically would produce "Jvc", "Difc", "Jlt". So the
 * display name is picked from the spellings the data actually contains,
 * preferring one that has a lowercase letter in it — a human wrote that one —
 * and falling back to the most frequent when every variant is upper case.
 * Deterministic, and it never invents a string DLD did not publish.
 */

/** The grouping key. Every area-level aggregate must group on this, not on `area`. */
export const AREA_KEY_SQL = "UPPER(TRIM(area))"

/**
 * Picks one display spelling per area key.
 *
 * `area ~ '[a-z]'` is true for a spelling containing a lowercase letter, and
 * DESC puts those first — so "Jumeirah Village Circle" wins over "JUMEIRAH
 * VILLAGE CIRCLE". Ties break on row count, then alphabetically, so the choice
 * is stable across runs and does not flip as new rows arrive.
 */
export const AREA_DISPLAY_RANK_SQL = `
  ROW_NUMBER() OVER (
    PARTITION BY ${AREA_KEY_SQL}
    ORDER BY (area ~ '[a-z]') DESC, COUNT(*) DESC, area ASC
  )
`

/**
 * A CTE that maps each area key to its display name and the number of
 * spellings behind it.
 *
 * `variants` is exposed rather than hidden: an area assembled from two
 * spellings is a fact about the ingest, and a surface that wants to say "two
 * source spellings merged" should be able to.
 */
export function areaNamesCte(table: string, where?: string): string {
  return `
    area_spellings AS (
      SELECT ${AREA_KEY_SQL} AS area_key,
             area,
             COUNT(*)::int AS n,
             ${AREA_DISPLAY_RANK_SQL} AS rk,
             COUNT(*) OVER (PARTITION BY ${AREA_KEY_SQL})::int AS variants
      FROM ${table}
      WHERE area IS NOT NULL AND TRIM(area) <> ''
        ${where ? `AND ${where}` : ""}
      GROUP BY ${AREA_KEY_SQL}, area
    ),
    area_names AS (
      SELECT area_key, area AS area_display, variants
      FROM area_spellings
      WHERE rk = 1
    )
  `
}

/**
 * Collapse a list of raw spellings the way the SQL above does.
 *
 * Exists so the rule can be tested without a database, and so a caller holding
 * area strings in memory folds them the SAME way the query does. Two
 * implementations of one rule is how the rule stops being one rule, so this is
 * the only other place it may live.
 */
export function pickAreaDisplayName(spellings: Array<{ area: string; n: number }>): string | null {
  if (spellings.length === 0) return null
  const sorted = [...spellings].sort((a, b) => {
    const aMixed = /[a-z]/.test(a.area) ? 0 : 1
    const bMixed = /[a-z]/.test(b.area) ? 0 : 1
    if (aMixed !== bMixed) return aMixed - bMixed
    if (a.n !== b.n) return b.n - a.n
    return a.area.localeCompare(b.area)
  })
  return sorted[0].area
}

/** The key a display name folds to. Mirrors AREA_KEY_SQL exactly. */
export function areaKey(area: string): string {
  return area.trim().toUpperCase()
}
