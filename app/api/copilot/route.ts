import { NextResponse } from "next/server"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  safeConsumeCopilotUsage,
  getAnonymousCopilotAccountKey,
} from "@/lib/copilot-usage"
import { prisma } from "@/lib/prisma"
import {
  executeAreaRiskBrief,
  executeCompareProjects,
  executeApplyDecisionLens,
  executeListMarketEntities,
  executeGenerateDecisionObject,
  executeGenerateStrategicReport,
  executeGenerateInvestmentRoadmap,
  executeMonitorMarketSegments,
  executeDealScreener,
  executeDldAreaBenchmark,
  executeDldMarketPulse,
  executeDldNotableDeals,
  executeDldTransactionSearch,
  executeDeveloperDueDiligence,
  executeGenerateInvestorMemo,
  executePriceRealityCheck,
  executeRefreshDldData,
  executeScenarioStressTest,
} from "@/lib/copilot/executor"
import { collectGuardrailWarnings } from "@/lib/copilot/guardrails"
import {
  type AreaRiskBriefInput,
  type ApplyDecisionLensInput,
  type CompareProjectsInput,
  type DealScreenerInput,
  type DeveloperDueDiligenceInput,
  type DldAreaBenchmarkInput,
  type DldNotableDealsInput,
  type DldTransactionSearchInput,
  type GenerateDecisionObjectInput,
  type GenerateInvestorMemoInput,
  type GenerateInvestmentRoadmapInput,
  type GenerateStrategicReportInput,
  type ListMarketEntitiesInput,
  type MonitorMarketSegmentsInput,
  type PriceRealityCheckInput,
  type ScenarioStressTestInput,
  areaRiskBriefInputSchema,
  applyDecisionLensInputSchema,
  compareProjectsInputSchema,
  dealScreenerInputSchema,
  developerDueDiligenceInputSchema,
  dldAreaBenchmarkInputSchema,
  dldMarketPulseInputSchema,
  dldNotableDealsInputSchema,
  dldTransactionSearchInputSchema,
  generateDecisionObjectInputSchema,
  generateInvestorMemoInputSchema,
  generateInvestmentRoadmapInputSchema,
  generateStrategicReportInputSchema,
  listMarketEntitiesInputSchema,
  monitorMarketSegmentsInputSchema,
  priceRealityCheckInputSchema,
  refreshDldDataInputSchema,
  scenarioStressTestInputSchema,
  copilotSystemPrompt,
  copilotToolDescriptions,
} from "@/lib/copilot/tools"
import { mcpCrossReference, mcpDescribeTable, mcpQuery, mcpSampleData, mcpTriggerScraper } from "@/lib/mcp/server"
import {
  mcpCrossReferenceInputSchema,
  mcpDescribeTableInputSchema,
  mcpQueryInputSchema,
  mcpSampleDataInputSchema,
  mcpTriggerScraperInputSchema,
  type McpCrossReferenceInput,
  type McpDescribeTableInput,
  type McpQueryInput,
  type McpSampleDataInput,
  type McpTriggerScraperInput,
} from "@/lib/mcp/schemas"

import { loadChatSession, saveChatMessage } from "@/lib/copilot/persistence"
import { getUserProfile } from "@/lib/profile/queries"

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
    const body = (await request.json()) as { messages?: UIMessage[]; id?: string }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload", requestId }, { status: 400 })
    }

    const headerAccountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
    const entitlement = await getCurrentEntitlement(headerAccountKey)
    const usageAccountKey = entitlement.accountKey || getAnonymousCopilotAccountKey(request)
    const { allowed, usage } = await safeConsumeCopilotUsage(usageAccountKey, entitlement.tier)

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Free usage is cooling down. Try again once your cooldown ends.",
          upgrade_cta: {
            label: "Upgrade for uninterrupted access",
            url: "/pricing",
          },
          tier: entitlement.tier,
          usage,
          requestId,
        },
        {
          status: 429,
          headers: {
            "x-request-id": requestId,
            "x-copilot-usage-used": String(usage.used),
            "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
            "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
            "x-copilot-usage-blocked": String(usage.blocked),
            "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
          },
        },
      )
    }

    const sessionId = body.id || null
    const userId = entitlement.accountKey

    // Persist the incoming user message if we have a userId
    if (userId) {
      const lastMessage = body.messages[body.messages.length - 1]
      if (lastMessage.role === "user") {
        await saveChatMessage(userId, sessionId, {
          role: "user",
          content: typeof lastMessage.content === "string" ? lastMessage.content : "",
        })
      }
    }

    const toolset: Record<string, any> = {
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
      compare_projects: tool({
        description: copilotToolDescriptions.compare_projects,
        inputSchema: compareProjectsInputSchema,
        execute: async (input: CompareProjectsInput) => withGuardrails(await executeCompareProjects(input)),
      }),
      dld_transaction_search: tool({
        description: copilotToolDescriptions.dld_transaction_search,
        inputSchema: dldTransactionSearchInputSchema,
        execute: async (input: DldTransactionSearchInput) => withGuardrails(await executeDldTransactionSearch(input)),
      }),
      dld_area_benchmark: tool({
        description: copilotToolDescriptions.dld_area_benchmark,
        inputSchema: dldAreaBenchmarkInputSchema,
        execute: async (input: DldAreaBenchmarkInput) => withGuardrails(await executeDldAreaBenchmark(input)),
      }),
      dld_market_pulse: tool({
        description: copilotToolDescriptions.dld_market_pulse,
        inputSchema: dldMarketPulseInputSchema,
        execute: async () => withGuardrails(await executeDldMarketPulse()),
      }),
      dld_notable_deals: tool({
        description: copilotToolDescriptions.dld_notable_deals,
        inputSchema: dldNotableDealsInputSchema,
        execute: async (input: DldNotableDealsInput) => withGuardrails(await executeDldNotableDeals(input)),
      }),
      refresh_dld_data: tool({
        description: copilotToolDescriptions.refresh_dld_data,
        inputSchema: refreshDldDataInputSchema,
        execute: async () => withGuardrails(await executeRefreshDldData()),
      }),
      scenario_stress_test: tool({
        description: copilotToolDescriptions.scenario_stress_test,
        inputSchema: scenarioStressTestInputSchema,
        execute: async (input: ScenarioStressTestInput) => withGuardrails(await executeScenarioStressTest(input)),
      }),
      mcp_query: tool({
        description:
          "Execute a read-only SQL query against the full Entrestate database. Use for custom analytics, cross-joins, aggregations. Only SELECT/WITH allowed, max 100 rows.",
        inputSchema: mcpQueryInputSchema,
        execute: async (input: McpQueryInput) => withGuardrails(await mcpQuery(input)),
      }),
      mcp_describe_table: tool({
        description: "Inspect a table's schema: column names, types, row count. Use before querying unfamiliar tables.",
        inputSchema: mcpDescribeTableInputSchema,
        execute: async (input: McpDescribeTableInput) => await mcpDescribeTable(input.table_name),
      }),
      mcp_sample_data: tool({
        description: "Preview sample rows from any table (1-20 rows). Use to understand data format before writing queries.",
        inputSchema: mcpSampleDataInputSchema,
        execute: async (input: McpSampleDataInput) => await mcpSampleData(input.table_name, input.limit),
      }),
      mcp_cross_reference: tool({
        description:
          "Run pre-built cross-reference analytics: price_vs_dld, developer_portfolio, area_intelligence, golden_visa_opportunities, stress_test_report. Optionally filter by area name.",
        inputSchema: mcpCrossReferenceInputSchema,
        execute: async (input: McpCrossReferenceInput) => withGuardrails(await mcpCrossReference(input)),
      }),
      mcp_trigger_scraper: tool({
        description: "Trigger a live data scraper. Currently supports: arvo_dld (DLD transactions from arvo.co API).",
        inputSchema: mcpTriggerScraperInputSchema,
        execute: async (input: McpTriggerScraperInput) => await mcpTriggerScraper(input.source),
      }),
      apply_decision_lens: tool({
        description: copilotToolDescriptions.apply_decision_lens,
        inputSchema: applyDecisionLensInputSchema,
        execute: async (input: ApplyDecisionLensInput) => withGuardrails(await executeApplyDecisionLens(input)),
      }),
      list_market_entities: tool({
        description: copilotToolDescriptions.list_market_entities,
        inputSchema: listMarketEntitiesInputSchema,
        execute: async (input: ListMarketEntitiesInput) => withGuardrails(await executeListMarketEntities(input)),
      }),
      generate_decision_object: tool({
        description: copilotToolDescriptions.generate_decision_object,
        inputSchema: generateDecisionObjectInputSchema,
        execute: async (input: GenerateDecisionObjectInput) => {
          const result = await executeGenerateDecisionObject(input)
          if (entitlement.accountKey && result.rows?.[0]) {
            const artifact = result.rows[0]
            try {
              // Create a backing timetable for the artifact
              const timetable = await prisma.timeTable.create({
                data: {
                  ownerId: entitlement.accountKey,
                  intent: `Copilot generation: ${input.project_name}`,
                  hash: `copilot-${Date.now()}`,
                  rowGrain: "project",
                  spec: {},
                  config: {},
                },
              })

              await prisma.decisionObject.create({
                data: {
                  id: String(artifact.artifact_id),
                  timetableId: timetable.id,
                  ownerId: entitlement.accountKey,
                  type: artifact.type as any,
                  status: "ready",
                  artifactUrls: {
                    [artifact.format]: `/api/artifacts/download?id=${artifact.artifact_id}`
                  },
                },
              })
            } catch (dbError) {
              console.error("Failed to persist decision object:", dbError)
            }
          }
          return withGuardrails(result)
        },
      }),
    }

    // Add Enterprise tools only for Institutional tier
    if (entitlement.tier === "institutional") {
      toolset.generate_strategic_report = tool({
        description: copilotToolDescriptions.generate_strategic_report,
        inputSchema: generateStrategicReportInputSchema,
        execute: async (input: GenerateStrategicReportInput) => withGuardrails(await executeGenerateStrategicReport(input)),
      })
      toolset.generate_investment_roadmap = tool({
        description: copilotToolDescriptions.generate_investment_roadmap,
        inputSchema: generateInvestmentRoadmapInputSchema,
        execute: async (input: GenerateInvestmentRoadmapInput) => withGuardrails(await executeGenerateInvestmentRoadmap(input)),
      })
      toolset.monitor_market_segments = tool({
        description: copilotToolDescriptions.monitor_market_segments,
        inputSchema: monitorMarketSegmentsInputSchema,
        execute: async (input: MonitorMarketSegmentsInput) => withGuardrails(await executeMonitorMarketSegments(input)),
      })
    }

    const normalizedMessages = normalizeIncomingMessages(body.messages)

    const model = resolveCopilotModel()
    if (!model) {
      const stream = createUIMessageStream({
        originalMessages: normalizedMessages,
        execute: ({ writer }) => {
          writer.write({ type: "start" })
          writer.write({ type: "start-step" })
          writer.write({ type: "text-start", id: "text-1" })
          writer.write({
            type: "text-delta",
            id: "text-1",
            delta:
              "Copilot AI is temporarily running in fallback mode. Configure GEMINI_KEY, AI_GATEWAY_API_KEY, or OPENAI_API_KEY to enable full streaming reasoning.",
          })
          writer.write({ type: "text-end", id: "text-1" })
          writer.write({ type: "finish-step" })
          writer.write({ type: "finish", finishReason: "stop" })
        },
      })

      return createUIMessageStreamResponse({
        stream,
        headers: {
          "x-request-id": requestId,
          "x-entrestate-tier": entitlement.tier,
          "x-copilot-usage-used": String(usage.used),
          "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
          "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
          "x-copilot-usage-blocked": String(usage.blocked),
          "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
        },
      })
    }

    // Load user profile for personalized system context
    let profileContext = "No profile data available — ask the user about their preferences."
    if (userId) {
      try {
        const profile = await getUserProfile(userId)
        if (profile) {
          const riskLabel = profile.riskBias >= 0.8 ? "aggressive" : profile.riskBias >= 0.6 ? "balanced" : "conservative"
          const yieldLabel = profile.yieldVsSafety >= 0.7 ? "yield-focused" : profile.yieldVsSafety <= 0.3 ? "safety-focused" : "balanced"
          const parts: string[] = [
            `Risk appetite: ${riskLabel} (${Math.round(profile.riskBias * 100)}%)`,
            `Investment style: ${yieldLabel} (yield vs safety: ${Math.round(profile.yieldVsSafety * 100)}%)`,
          ]
          if (profile.horizon) parts.push(`Horizon: ${profile.horizon}`)
          if (profile.preferredMarkets?.length) parts.push(`Preferred markets: ${profile.preferredMarkets.join(", ")}`)
          const comp = profile.inferredSignals?.comprehensiveProfile
          if (comp?.branding?.companyName) parts.push(`Company: ${comp.branding.companyName}`)
          if (comp?.preferredClientTypes?.length) parts.push(`Client types: ${comp.preferredClientTypes.join(", ")}`)
          profileContext = parts.join("\n")
        }
      } catch {
        // Non-blocking — use default context
      }
    }

    const systemPrompt = copilotSystemPrompt.replace("{USER_PROFILE_CONTEXT}", profileContext)

    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(normalizedMessages, { tools: toolset }),
      temperature: 0.3,
      stopWhen: stepCountIs(6),
      toolChoice: "auto",
      tools: toolset,
      onFinish: async ({ text, toolCalls }) => {
        if (userId && (text || (toolCalls && toolCalls.length > 0))) {
          await saveChatMessage(userId, sessionId, {
            role: "assistant",
            content: text || "",
            toolCalls: toolCalls,
          })
        }
      },
    })
    return result.toUIMessageStreamResponse({
      originalMessages: normalizedMessages,
      headers: {
        "x-request-id": requestId,
        "x-entrestate-tier": entitlement.tier,
        "x-copilot-usage-used": String(usage.used),
        "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
        "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
        "x-copilot-usage-blocked": String(usage.blocked),
        "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
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
