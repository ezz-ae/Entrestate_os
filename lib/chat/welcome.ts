/**
 * ONE WELCOME FOR EVERY DOOR.
 *
 * The advisor rebuild replaced /api/chat's greeting — but /api/copilot, the
 * endpoint behind the MAIN chat page and the site-wide sidebar, kept its own
 * copy: "Mode: Awaiting command — Commands: SCREEN | PROJECT | AREA…". So the
 * chat the owner opened from the header still greeted like a terminal while
 * the one on /markets greeted like a person. Two welcomes is how that
 * happens; this module is the one that remains, and both routes import it.
 */
export function buildHumanWelcome(locale: string): string {
  if (locale === "ar") {
    return [
      "أهلاً بك. أنا مستشار Entrestate العقاري — اسألني عن أي منطقة أو مشروع أو مطوّر في الإمارات وسأبحث في البيانات الحية وأجيبك بلغة واضحة.",
      "",
      "أمثلة تقدر تبدأ بها:",
      "· إيه أفضل عائد تحت مليوني درهم في دبي؟",
      "· قارن لي بين دبي مارينا و JBR",
      "· إيه وضع إعمار كمطوّر؟",
    ].join("\n")
  }

  return [
    "Welcome. I'm Entrestate's market advisor — ask me about any area, project or developer in the UAE and I'll search the live data and answer in plain language.",
    "",
    "A few ways to start:",
    "· What's the best yield under AED 2M in Dubai?",
    "· Compare Dubai Marina with JBR for me",
    "· How solid is Emaar as a developer?",
  ].join("\n")
}
