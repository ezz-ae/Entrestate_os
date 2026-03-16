import type React from "react"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "@/components/theme-provider"
import { CopilotProvider } from "@/components/copilot-provider"
import { SEO, absoluteUrl, getSiteUrl } from "@/lib/seo"
import { getLocaleDirection } from "@/i18n/locale"
import { getLocaleMessages, getRequestLocale } from "@/i18n/request"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SEO.defaultTitle,
    template: "%s | Entrestate",
  },
  description: SEO.defaultDescription,
  applicationName: SEO.siteName,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "UAE real estate",
    "Dubai property market",
    "real estate intelligence",
    "property investment analysis",
    "market scoring",
    "developer reliability",
    "rental yield analysis",
    "investor reports",
  ],
  authors: [{ name: "Entrestate" }],
  creator: "Entrestate",
  publisher: "Entrestate",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SEO.siteName,
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    url: "/",
    images: [
      {
        url: absoluteUrl(SEO.defaultOgImagePath),
        width: 1200,
        height: 630,
        alt: "Entrestate platform overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    images: [absoluteUrl(SEO.defaultOgImagePath)],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#11161d" },
    { media: "(prefers-color-scheme: dark)", color: "#11161d" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()
  const messages = await getLocaleMessages(locale)

  return (
    <html lang={locale} dir={getLocaleDirection(locale)} suppressHydrationWarning className="bg-background">
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
        >
          Skip to main content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <CopilotProvider>
              {children}
            </CopilotProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
