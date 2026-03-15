"use server"

import { createChatCompletion as createChatCompletionClient } from "./client"
import type {
  CreateChatCompletionParams,
  CreateChatCompletionResult,
} from "./types"

/**
 * Server Action: call AI chat completion (OpenRouter, Gemini, or campus).
 * Use from hooks; API keys stay on server.
 */
export async function createChatCompletion(
  params: CreateChatCompletionParams
): Promise<CreateChatCompletionResult> {
  return createChatCompletionClient(params)
}

// Re-export types so hooks can import from one place
export type {
  AiProvider,
  ChatMessage,
  ChatRole,
  ChatCompletionChoice,
  CreateChatCompletionParams,
  CreateChatCompletionResult,
  Tool,
  ToolChoice,
  ToolCall,
  FunctionDefinition,
  JsonSchema,
} from "./types"
