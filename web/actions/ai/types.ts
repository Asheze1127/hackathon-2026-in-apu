/**
 * OpenAI-compatible types for chat completions.
 * Shared by OpenRouter, Gemini, and campus backend so hooks can use the same interface.
 */

export type ChatRole = "system" | "user" | "assistant" | "tool"

export interface ChatMessage {
  role: ChatRole
  content: string | null
  /** Present when provider exposes separate reasoning text. */
  thinking?: string | null
  /** Present when model returns tool calls (assistant message). */
  tool_calls?: ToolCall[]
  /** Present when submitting tool results (tool role). */
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

/** JSON Schema for function parameters (OpenAI tool.function.parameters). */
export type JsonSchema = Record<string, unknown>

export interface FunctionDefinition {
  name: string
  description?: string
  parameters?: JsonSchema
}

export interface Tool {
  type: "function"
  function: FunctionDefinition
}

/** "none" | "auto" | { type: "function", function: { name: string } } */
export type ToolChoice =
  | "none"
  | "auto"
  | { type: "function"; function: { name: string } }

export type AiProvider = "openrouter" | "gemini" | "campus"

export interface CreateChatCompletionParams {
  provider: AiProvider
  messages: ChatMessage[]
  model?: string
  tools?: Tool[]
  tool_choice?: ToolChoice
  max_tokens?: number
  temperature?: number
}

export interface ChatCompletionChoice {
  message: ChatMessage
  finish_reason: string | null
  index: number
}

export interface CreateChatCompletionResult {
  id?: string
  choices: ChatCompletionChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
