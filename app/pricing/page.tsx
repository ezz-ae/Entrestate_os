import Link from "next/link"
import { ArrowRight, Check, Sparkles, Store } from "lucide-react"
import { JsonLd } from "@/components/JsonLd"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { faqSchema } from "@/lib/seo/schema"

/**
 * THE TERMINAL DOES NOT SELL SUBSCRIPTIONS ANY MORE.
 *
 * This page used to price the Terminal itself — Pro 299, Team 999,
 * Institutional, with /checkout wired to Tap. The owner retired that model in
 * one sentence: "الأدوات اللي في الأكاونت والباكيدجات احنا مخلّيين ده فري
 * تماماً" — the account and its packages are completely free, and selling
 * happens in ONE place: the business's App Store, so it is never "حساب هنا
 * وحساب هناك".
 *
 * So this page now states the deal instead of quoting tiers — and it names
 * what the account gives instead of calling it free. The owner's second rule,
 * verbatim: "بلاش نستخدم فري لأنها دايماً بتعطي انطباع بالغير أهمية" — the
 * word cheapens what it describes. The included layer is called what it IS:
 * market discovery / the full market analysis. The selling work is apps in
 * the store. lib/pricing/plans.ts and the Tap/checkout plumbing stay in
 * the codebase, dormant and still pinned by tests/pricing-money.test.ts — a
 * money path is decommissioned by unlinking it, not by deleting the guard
 * that watches it.
 */

const BUSINESS_STORE_URL = "https://entrestate.com/business/store"

const DISCOVERY_SURFACES = [
  { en: "Search & screening across the scored inventory", ar: "البحث والفرز في كامل المخزون المقيّم" },
  { en: "Area intelligence — all areas, all metrics", ar: "ملفات المناطق — كل المناطق وكل المؤشرات" },
  { en: "Developer reliability records", ar: "سجلات موثوقية المطورين" },
  { en: "Project scoring and verdicts", ar: "تقييم المشاريع والأحكام" },
  { en: "The Signal Feed, live from the data", ar: "بث الإشارات مباشرةً من البيانات" },
  { en: "The advisor chat — ask in your own words", ar: "المستشار — اسأل بكلامك العادي" },
] as const

export default async function PricingPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"

  const jsonLdFaq = faqSchema([
    {
      q: isArabic ? "ما الذي يأتي مع الحساب؟" : "What comes with the account?",
      a: isArabic
        ? "طبقة الاستكشاف كاملة — البحث والبيانات والمستشار — بدون باقات وبدون ترقيات داخل المنصة."
        : "The full discovery layer — search, the data, and the advisor — with no tiers and no in-product upgrades.",
    },
    {
      q: isArabic ? "إذاً ما الذي يُباع؟" : "Then what is for sale?",
      a: isArabic
        ? "أدوات العمل — الإعلانات وصفحات الهبوط وأتمتة العملاء المحتملين — تُباع كتطبيقات في متجر تطبيقات Entrestate على موقع الأعمال، وتعمل داخل حسابك نفسه."
        : "The working tools — advertising, landing pages, lead automation — are sold as apps in the Entrestate App Store on the business site, and they run inside this same account.",
    },
  ])

  return (
    <main id="main-content">
      <JsonLd data={jsonLdFaq} />
      <Navbar />
      <div className="mx-auto max-w-[1150px] px-4 pb-24 pt-28 sm:px-6 md:pt-36">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
            {isArabic ? "التسعير" : "Pricing"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {isArabic
              ? "تحليل السوق كامل — مع حسابك."
              : "The full market analysis comes with your account."}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {isArabic
              ? "حساب واحد يفتح البحث والبيانات والمستشار — استكشاف السوق من أوله لآخره. وما يجلب لك العميل التالي — الإعلانات والصفحات والمتابعة — تطبيقات تضيفها من المتجر وقت ما تحتاجها."
              : "One account opens the search, the data, and the advisor — market discovery end to end. What wins you the next client — the ads, the pages, the follow-up — are apps you add from the store when you need them."}
          </p>
        </header>

        <section className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-border/60 bg-card/60 p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
                {isArabic ? "استكشاف السوق — مع كل حساب" : "Market discovery — with every account"}
              </p>
            </div>
            <ul className="mt-5 space-y-3">
              {DISCOVERY_SURFACES.map((item) => (
                <li key={item.en} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{isArabic ? item.ar : item.en}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full">
              <Link href={prefixLocalePath("/login", locale)}>
                {isArabic ? "افتح حسابك" : "Open your account"}
              </Link>
            </Button>
          </div>

          <div className="rounded-[28px] border border-primary/20 bg-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/60">
                {isArabic ? "أدوات العمل — في المتجر" : "The working tools — in the store"}
              </p>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {isArabic
                ? "إعلانات ميتا وجوجل، صفحات الهبوط، الأصول، وأتمتة العملاء المحتملين — كلها تطبيقات في متجر تطبيقات Entrestate، تعمل داخل حسابك هذا نفسه. تدفع مقابل ما يشتغل لصالحك، لا مقابل الدخول."
                : "Meta and Google advertising, landing pages, assets, and lead automation — all apps in the Entrestate App Store, running inside this same account. You pay for what works for you, never for the door."}
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <a href={BUSINESS_STORE_URL}>
                {isArabic ? "افتح متجر التطبيقات" : "Open the App Store"}
                <ArrowRight className={`ml-1.5 h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
              </a>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              {isArabic
                ? "حساب واحد على المنصتين — ما تضيفه هناك تجده هنا."
                : "One account across both sites — what you add there shows up here."}
            </p>
          </div>
        </section>
        <Footer />
      </div>
    </main>
  )
}
