/**
 * Server-only AI client. Call from Server Actions only.
 * Buffers between OpenRouter, Gemini, and campus GPT-OSS.
 */

import type {
  ChatMessage,
  CreateChatCompletionParams,
  CreateChatCompletionResult,
  Tool,
  ToolChoice,
} from "./types"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const CAMPUS_GENERATE_PATH = "/api/generate"

// Default model: free tier; use openai/gpt-oss-120b for paid ($10 credit)
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free"
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
const DEFAULT_CAMPUS_MODEL = "gpt-oss:120b"

function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL
}

function getOpenRouterKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL
}

function getGeminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY
}

function getCampusBaseUrl(): string | undefined {
  const url = process.env.CAMPUS_AI_BASE_URL
  if (!url) return undefined
  return url.replace(/\/$/, "")
}

function getCampusModel(model?: string): string {
  return model ?? process.env.CAMPUS_AI_MODEL ?? DEFAULT_CAMPUS_MODEL
}

function getCampusAuthorization(): string | undefined {
  const value = process.env.CAMPUS_AI_API_KEY?.trim()
  if (!value) return undefined
  return value
}

function getCampusGenerateUrl(): string {
  const base = getCampusBaseUrl()
  if (!base) {
    throw new Error("CAMPUS_AI_BASE_URL is not set")
  }
  if (base.endsWith(CAMPUS_GENERATE_PATH)) {
    return base
  }
  return `${base}${CAMPUS_GENERATE_PATH}`
}

function buildOpenRouterBody(
  messages: ChatMessage[],
  options: {
    model?: string
    tools?: Tool[]
    tool_choice?: ToolChoice
    max_tokens?: number
    temperature?: number
  }
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    messages,
    max_tokens: options.max_tokens ?? 4096,
    temperature: options.temperature ?? 0.7,
  }
  if (options.model) body.model = options.model
  if (options.tools?.length) {
    body.tools = options.tools
    body.tool_choice = options.tool_choice ?? "auto"
  }
  return body
}

type ChatCompletionOptions = Omit<
  CreateChatCompletionParams,
  "provider" | "messages"
>

interface CampusGenerateResponse {
  response?: string
  thinking?: string
  done?: boolean
  done_reason?: string
  prompt_eval_count?: number
  eval_count?: number
}

function getCampusThinkLevel(): "low" | "medium" | "high" {
  const value = process.env.CAMPUS_AI_THINK?.trim().toLowerCase()
  if (value === "medium" || value === "high") {
    return value
  }
  return "low"
}

function decodeHtmlEntities(text: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
    "#39": "'",
  }

  return text
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(Number.parseInt(value, 16))
    )
    .replace(/&([a-z0-9#]+);/gi, (entity, key: string) => {
      return namedEntities[key.toLowerCase()] ?? entity
    })
}

function normalizeCampusText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/<br\s*\/?>/gi, "\n")
    .trim()
}

function formatCampusMessage(message: ChatMessage): string {
  if (message.role === "assistant") {
    const parts = [message.content ?? ""]
    if (message.tool_calls?.length) {
      parts.push(`Tool calls:\n${JSON.stringify(message.tool_calls)}`)
    }
    return `Assistant:\n${parts.filter(Boolean).join("\n\n")}`.trim()
  }

  if (message.role === "tool") {
    const label = message.name ?? message.tool_call_id ?? "tool"
    return `Tool (${label}):\n${message.content ?? ""}`.trim()
  }

  const prefix = message.role === "system" ? "System" : "User"
  return `${prefix}:\n${message.content ?? ""}`.trim()
}

function buildCampusPrompt(messages: ChatMessage[]): {
  prompt: string
  system?: string
} {
  const system = messages
    .filter(
      (message): message is ChatMessage & { content: string } =>
        message.role === "system" && typeof message.content === "string"
    )
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join("\n\n")

  const conversation = messages
    .filter((message) => message.role !== "system")
    .map(formatCampusMessage)
    .filter(Boolean)

  const lastMessage = conversation.at(-1)
  const prompt = lastMessage?.startsWith("Assistant:")
    ? conversation.join("\n\n")
    : [...conversation, "Assistant:"].join("\n\n")

  return {
    prompt,
    system: system || undefined,
  }
}

function buildCampusBody(
  messages: ChatMessage[],
  options: ChatCompletionOptions
): Record<string, unknown> {
  const { prompt, system } = buildCampusPrompt(messages)
  const generationOptions: Record<string, unknown> = {}
  const model = getCampusModel(options.model)

  if (typeof options.max_tokens === "number") {
    generationOptions.num_predict = options.max_tokens
  }
  if (typeof options.temperature === "number") {
    generationOptions.temperature = options.temperature
  }

  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: false,
  }

  if (model.toLowerCase().includes("gpt-oss")) {
    body.think = getCampusThinkLevel()
  }

  if (system) {
    body.system = system
  }
  if (Object.keys(generationOptions).length > 0) {
    body.options = generationOptions
  }

  return body
}

function normalizeCampusUsage(
  response: CampusGenerateResponse
): CreateChatCompletionResult["usage"] | undefined {
  const promptTokens = response.prompt_eval_count
  const completionTokens = response.eval_count

  if (
    typeof promptTokens !== "number" ||
    typeof completionTokens !== "number"
  ) {
    return undefined
  }

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  }
}

function normalizeCampusResult(
  response: CampusGenerateResponse
): CreateChatCompletionResult {
  return {
    choices: [
      {
        index: 0,
        finish_reason: response.done_reason ?? (response.done ? "stop" : null),
        message: {
          role: "assistant",
          content: normalizeCampusText(response.response ?? ""),
          thinking: response.thinking ?? null,
        },
      },
    ],
    usage: normalizeCampusUsage(response),
  }
}

function parseCampusResponse(text: string): CreateChatCompletionResult {
  try {
    const response = JSON.parse(text) as CampusGenerateResponse
    return normalizeCampusResult(response)
  } catch {
    const chunks = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as CampusGenerateResponse]
        } catch {
          return []
        }
      })

    if (!chunks.length) {
      throw new Error("Campus AI API returned an unreadable response")
    }

    const merged: CampusGenerateResponse = chunks.reduce(
      (result, chunk) => ({
        ...result,
        ...chunk,
        response: `${result.response ?? ""}${chunk.response ?? ""}`,
      }),
      {}
    )

    return normalizeCampusResult(merged)
  }
}

async function callOpenRouter(
  messages: ChatMessage[],
  options: ChatCompletionOptions
): Promise<CreateChatCompletionResult> {
  const key = getOpenRouterKey()
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set")
  }
  const body = buildOpenRouterBody(messages, {
    model: options.model ?? getOpenRouterModel(),
    tools: options.tools,
    tool_choice: options.tool_choice,
    max_tokens: options.max_tokens,
    temperature: options.temperature,
  })
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter API error: ${res.status} ${text}`)
  }
  const data = (await res.json()) as CreateChatCompletionResult
  return data
}

async function callGemini(
  messages: ChatMessage[],
  options: ChatCompletionOptions
): Promise<CreateChatCompletionResult> {
  const key = getGeminiKey()
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set")
  }
  const body = buildOpenRouterBody(messages, {
    model: options.model ?? getGeminiModel(),
    tools: options.tools,
    tool_choice: options.tool_choice,
    max_tokens: options.max_tokens,
    temperature: options.temperature,
  })
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${text}`)
  }
  const data = (await res.json()) as CreateChatCompletionResult
  return data
}

async function callCampus(
  messages: ChatMessage[],
  options: ChatCompletionOptions
): Promise<CreateChatCompletionResult> {
  if (
    options.tools?.length ||
    (options.tool_choice && options.tool_choice !== "none")
  ) {
    throw new Error(
      "Campus AI /api/generate does not support tool calling parameters"
    )
  }
  const url = getCampusGenerateUrl()
  const body = buildCampusBody(messages, options)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const authorization = getCampusAuthorization()
  if (authorization) {
    headers.Authorization = authorization
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Campus AI API error: ${res.status} ${text}`)
  }
  const text = await res.text()
  return parseCampusResponse(text)
}

/**
 * Create a chat completion using the specified provider.
 * Use from Server Actions only (keeps API keys on server).
 */
export async function createChatCompletion(
  params: CreateChatCompletionParams
): Promise<CreateChatCompletionResult> {
  const {
    provider,
    messages,
    model,
    tools,
    tool_choice,
    max_tokens,
    temperature,
  } = params
  const options: ChatCompletionOptions = {
    model,
    tools,
    tool_choice,
    max_tokens,
    temperature,
  }
  if (provider === "openrouter") {
    return callOpenRouter(messages, options)
  }
  if (provider === "campus") {
    return callCampus(messages, options)
  }
  if (provider === "gemini") {
    return callGemini(messages, options)
  }
  throw new Error(`Unknown AI provider: ${provider}`)
}
