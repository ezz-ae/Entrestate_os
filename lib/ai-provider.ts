import "server-only"
import { createGateway } from "@ai-sdk/gateway"
import { createOpenAI } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"

function getTrimmedEnv(name: string) {
  const value = process.env[name]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export function ensureGeminiApiKeyEnv() {
  const geminiKey = getTrimmedEnv("GEMINI_KEY") ?? getTrimmedEnv("GOOGLE_GENERATIVE_AI_API_KEY")
  if (geminiKey && !getTrimmedEnv("GOOGLE_GENERATIVE_AI_API_KEY")) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = geminiKey
  }
  return geminiKey
}

export function normalizeGeminiModel(modelId: string | undefined, fallback: string) {
  const normalized = modelId?.trim()
  if (!normalized) return fallback
  if (normalized.startsWith("google/")) return normalized.slice("google/".length)
  if (normalized.startsWith("gemini-")) return normalized
  return fallback
}

export function hasAnyAiProviderKey() {
  return Boolean(getTrimmedEnv("AI_GATEWAY_API_KEY") || getTrimmedEnv("OPENAI_API_KEY") || ensureGeminiApiKeyEnv())
}

export function resolveGatewayOrGeminiModel(options: { gatewayModel: string; geminiModel: string }) {
  const gatewayApiKey = getTrimmedEnv("AI_GATEWAY_API_KEY")
  if (gatewayApiKey) {
    const gateway = createGateway({ apiKey: gatewayApiKey })
    return {
      model: gateway(options.gatewayModel),
      provider: "gateway" as const,
    }
  }

  const geminiKey = ensureGeminiApiKeyEnv()
  if (geminiKey) {
    return {
      model: google(normalizeGeminiModel(options.geminiModel, "gemini-2.5-flash")),
      provider: "gemini" as const,
    }
  }

  return null
}

export function resolveCopilotModel() {
  const geminiKey = ensureGeminiApiKeyEnv()
  if (geminiKey) {
    return google(normalizeGeminiModel(process.env.COPILOT_GEMINI_MODEL ?? process.env.COPILOT_MODEL, "gemini-2.5-flash"))
  }

  const gatewayApiKey = getTrimmedEnv("AI_GATEWAY_API_KEY")
  if (gatewayApiKey) {
    const gateway = createGateway({ apiKey: gatewayApiKey })
    return gateway(process.env.COPILOT_MODEL || "google/gemini-2.5-flash")
  }

  const openAiApiKey = getTrimmedEnv("OPENAI_API_KEY")
  if (openAiApiKey) {
    const openAi = createOpenAI({ apiKey: openAiApiKey })
    return openAi(process.env.COPILOT_OPENAI_MODEL || "gpt-4o-mini")
  }

  return null
}
