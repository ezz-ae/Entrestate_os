import { NextResponse } from "next/server"
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  FREE_COPILOT_DAILY_LIMIT,
  getAnonymousCopilotAccountKey,
  incrementCopilotDailyUsage,
} from "@/lib/copilot-usage"
import {
  executeAreaRiskBrief,
  executeDealScreener,
  executeDeveloperDueDiligence,
  executeGenerateInvestorMemo,
  executePriceRealityCheck,
} from "@/lib/copilot/executor"
import { collectGuardrailWarnings } from "@/lib/copilot/guardrails"
import {
  type AreaRiskBriefInput,
  type DealScreenerInput,
  type DeveloperDueDiligenceInput,
  type GenerateInvestorMemoInput,
  type PriceRealityCheckInput,
  areaRiskBriefInputSchema,
  copilotSystemPrompt,
  copilotToolDescriptions,
  dealScreenerInputSchema,
  developerDueDiligenceInputSchema,
  generateInvestorMemoInputSchema,
  priceRealityCheckInputSchema,
} from "@/lib/copilot/tools"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeIncomingMessages(messages: UIMessage[]) {
  return messages.map((message, index) => {
    const msg = message as UIMessage & { content?: unknown; parts?: unknown[] }
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      return msg
    }

    const textContent = typeof msg.content === "string" ? msg.content : ""
    return {
      ...msg,
      id: msg.id || `msg-${index}`,
      parts: [{ type: "text", text: textContent }],
    }
  })
}

function withGuardrails<T extends Record<string, unknown>>(output: T): T & { guardrail_warnings: string[] } {
  const warnings = collectGuardrailWarnings(output)
  return {
    ...output,
    guardrail_warnings: warnings,
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)

  try {
    const body = (await request.json()) as { messages?: UIMessage[] }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload", requestId }, { status: 400 })
    }

    const headerAccountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
    const entitlement = await getCurrentEntitlement(headerAccountKey)
    const usageAccountKey = entitlement.accountKey || getAnonymousCopilotAccountKey(request)
    const usage = await incrementCopilotDailyUsage(usageAccountKey, entitlement.tier)

    if (entitlement.tier === "free" && usage.used > FREE_COPILOT_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "Daily free chat limit reached (3/day). Upgrade to Pro for unlimited chat.",
          tier: entitlement.tier,
          usage,
          requestId,
        },
        { status: 429 },
      )
    }

    const toolset = {
      deal_screener: tool({
        description: copilotToolDescriptions.deal_screener,
        inputSchema: dealScreenerInputSchema,
        execute: async (input: DealScreenerInput) => withGuardrails(await executeDealScreener(input)),
      }),
      price_reality_check: tool({
        description: copilotToolDescriptions.price_reality_check,
        inputSchema: priceRealityCheckInputSchema,
        execute: async (input: PriceRealityCheckInput) => withGuardrails(await executePriceRealityCheck(input)),
      }),
      area_risk_brief: tool({
        description: copilotToolDescriptions.area_risk_brief,
        inputSchema: areaRiskBriefInputSchema,
        execute: async (input: AreaRiskBriefInput) => withGuardrails(await executeAreaRiskBrief(input)),
      }),
      developer_due_diligence: tool({
        description: copilotToolDescriptions.developer_due_diligence,
        inputSchema: developerDueDiligenceInputSchema,
        execute: async (input: DeveloperDueDiligenceInput) =>
          withGuardrails(await executeDeveloperDueDiligence(input)),
      }),
      generate_investor_memo: tool({
        description: copilotToolDescriptions.generate_investor_memo,
        inputSchema: generateInvestorMemoInputSchema,
        execute: async (input: GenerateInvestorMemoInput) => withGuardrails(await executeGenerateInvestorMemo(input)),
      }),
    } as const

    const model = resolveCopilotModel()
    if (!model) {
      throw new Error("Copilot model is not configured. Set GEMINI_KEY, AI_GATEWAY_API_KEY, or OPENAI_API_KEY.")
    }

    const normalizedMessages = normalizeIncomingMessages(body.messages)

    const result = streamText({
      model,
      system: copilotSystemPrompt,
      messages: await convertToModelMessages(normalizedMessages, { tools: toolset }),
      temperature: 0,
      stopWhen: stepCountIs(6),
      toolChoice: "required",
      tools: toolset,
    })
    return result.toUIMessageStreamResponse({
      originalMessages: normalizedMessages,
      headers: {
        "x-request-id": requestId,
        "x-entrestate-tier": entitlement.tier,
        "x-copilot-usage-used": String(usage.used),
        "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
        "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
      },
    })
  } catch (error) {
    console.error("Copilot route error:", { requestId, error })
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "Copilot failed to process this request."),
        requestId,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/copilot",
    mode: "streaming-tool-calling",
  })
}
