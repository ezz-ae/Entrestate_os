/**
 * THE ANSWER SPEAKS THE ASKER'S LANGUAGE, AND NEVER THE SYSTEM'S.
 *
 * Two defects survived the advisor rebuild and were caught on the live site
 * minutes after it deployed, by asking the deployed chat one Arabic question:
 *
 *   1. The model glossed its own translation with the internal code —
 *      «تصنيف "شراء قوي" (STRONG_BUY)» — on a page whose owner's exact words
 *      were "الموقع فاضح نفسه وبيعطي الكود لكل حاجة". The prompt forbids the
 *      vocabulary, but a prompt is a request; this module is the door.
 *
 *   2. The question was Arabic and the answer was Arabic — but the fixed
 *      furniture came out English ("Recommendation:", "Would you like a
 *      deeper analysis of these results?"), because the furniture's language
 *      followed the PAGE locale (/en) while the answer's language followed
 *      the QUESTION. The asker's language wins everywhere or the answer
 *      reads stitched together.
 *
 * Deterministic, applied at the single finishing path (buildFinalChatPayload),
 * so both transports — streamed and JSON — land on clean text. Streaming
 * deltas are not rewritten (a code can split across two deltas); the final
 * payload replaces the streamed draft in the UI, which is where the text
 * persists.
 */

const ARABIC_LETTERS = /[\u0600-\u06FF]/g
const LATIN_LETTERS = /[A-Za-z]/g

/**
 * Which language should the answer (and its narration) speak?
 * The question decides; the page locale only breaks ties — a person typing
 * Arabic into the English site is still owed an Arabic answer, and the
 * reverse holds too.
 */
export function answerLocale(message: string, fallback: string): string {
  const arabic = (message.match(ARABIC_LETTERS) ?? []).length
  const latin = (message.match(LATIN_LETTERS) ?? []).length
  if (arabic > latin && arabic >= 3) return "ar"
  if (latin > arabic && latin >= 3) return "en"
  return fallback
}

/**
 * Internal verdict vocabulary → the human phrase, per language. Only tokens
 * with an underscore are replaced bare — an underscore is proof the word is
 * ours, while bare BUY/HOLD are ordinary English and only stripped when the
 * model parenthesised them as a gloss.
 */
const CODE_PHRASES: Array<{ code: RegExp; ar: string; en: string }> = [
  { code: /STRONG_BUY/g, ar: "شراء قوي", en: "strong buy" },
  { code: /ACTIVE_BUY/g, ar: "شراء", en: "buy" },
  { code: /WATCHLIST/g, ar: "قائمة المتابعة", en: "watch list" },
]

const PARENTHESIZED_CODE =
  /\s*[(（]\s*(?:STRONG_BUY|ACTIVE_BUY|WATCHLIST|BUY|HOLD|WAIT|AVOID|L[1-5]|[A-Z]{2,}_[A-Z_]+)\s*[)）]/g

const EN_CLOSING = /Would you like a deeper analysis of these results\?/gi
const AR_CLOSING = /هل ترغب في تحليل أعمق للنتائج؟/g
const EN_LABEL = /^[ \t]*Recommendation:/gim
const AR_LABEL = /^[ \t]*التوصية:/gm

export function humanizeFinalText(raw: string): string {
  if (!raw) return raw
  let text = raw
  const arabic = answerLocale(text, "en") === "ar"

  // A parenthesised code after the human phrase is pure leakage: drop it.
  text = text.replace(PARENTHESIZED_CODE, "")

  // A bare underscore code is internal vocabulary in any language.
  for (const { code, ar, en } of CODE_PHRASES) {
    text = text.replace(code, arabic ? ar : en)
  }

  // The label and the closing question speak the answer's own language.
  if (arabic) {
    text = text.replace(EN_LABEL, "التوصية:")
    text = text.replace(EN_CLOSING, "هل ترغب في تحليل أعمق للنتائج؟")
  } else {
    text = text.replace(AR_LABEL, "Recommendation:")
    text = text.replace(AR_CLOSING, "Would you like a deeper analysis of these results?")
  }

  return text
}

/**
 * "قدام كل نتيجة زرار تخليه يكمل على النتيجة دي" — the follow-up a result
 * row's button sends into the ONE chat. Written once here so /chat and the
 * sidebar ask the identical question, in the ANSWER's language (the table the
 * person clicked was in that language), and so the advisor gets a complete
 * brief — detail, risks, recommendation — instead of a bare project name.
 */
export function followUpOnResult(label: string, locale: string): string {
  const name = label.trim()
  return locale === "ar"
    ? `كمّل على ${name}: التفاصيل الكاملة، المخاطر، والتوصية.`
    : `Continue on ${name}: full detail, the risks, and your recommendation.`
}
