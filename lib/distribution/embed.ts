export type DistributionTier = "free" | "pro" | "enterprise"

export type EmbedBranding = {
  primaryColor?: string
  logoUrl?: string
  badgeText?: string
}

export type EmbedConfig = {
  widgetId: string
  tableHash: string
  tier?: DistributionTier
  branding?: EmbedBranding
}

const defaultBadge = "Powered by Entrestate"
const leadMagnetWidgets = new Set(["market_card", "area_table"])

export function generateEmbedSnippet(config: EmbedConfig): string {
  const tier = config.tier ?? "free"
  const branding = config.branding ?? {}
  const badgeText = tier === "free" ? defaultBadge : branding.badgeText
  const primaryColor = branding.primaryColor ?? "#0f172a"
  const logo = branding.logoUrl
  const leadMagnet = leadMagnetWidgets.has(config.widgetId) ? "true" : "false"

  const badgeMarkup = badgeText
    ? `<div style="font: 12px/1.4 Arial, sans-serif; color: #334155; margin-top: 8px;">${badgeText}</div>`
    : ""

  const logoMarkup = logo
    ? `<img src="${logo}" alt="Brand logo" style="height: 24px; margin-bottom: 8px;" />`
    : ""

  return `<!-- Entrestate Widget Embed -->
<div data-entrestate-widget="${config.widgetId}" data-table-hash="${config.tableHash}" data-interaction="overlay" data-lead-magnet="${leadMagnet}" style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
  ${logoMarkup}
  <div style="font: 14px/1.4 Arial, sans-serif; color: #0f172a; margin-bottom: 8px;">Live Entrestate Intelligence</div>
  <div style="height: 120px; background: linear-gradient(135deg, ${primaryColor}22, #f8fafc); border-radius: 8px;"></div>
  ${badgeMarkup}
</div>
<!-- /Entrestate Widget Embed -->`
}
