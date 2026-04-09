import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TransactionDemo } from "@/components/enterprise/transaction-demo"
import { getRequestLocale } from "@/i18n/request"

export const dynamic = "force-dynamic"

export default async function EnterpriseDemoPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {isArabic ? "ديمو التنفيذ" : "Execution Demo"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "طبقة التنفيذ - 8 خطوات" : "Execution Layer - 8 Steps"}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {isArabic
              ? "تنفيذ مباشر على بيانات دبي الحية. كل خطوة تستدعي API وتعرض المخرجات الحقيقية." 
              : "Live execution against Dubai data. Each step calls an API endpoint and renders the real output."}
          </p>
        </header>

        <TransactionDemo />
      </div>
      <Footer />
    </main>
  )
}
