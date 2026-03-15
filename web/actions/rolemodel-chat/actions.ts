"use server"

import * as z from "zod"

import { createChatCompletion } from "@/actions/ai/actions"
import {
  AppActionError,
  type ActionResponse,
  mapUnknownToErrorResponse,
} from "@/lib/errors"
import { getRoleModelChatPersona } from "@/lib/rolemodel-chat"
import { createClient } from "@/lib/supabase/server"

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_MESSAGES = 16

const historyMessageSchema = z.object({
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  role: z.enum(["assistant", "user"]),
})

const generateRoleModelReplySchema = z.object({
  history: z.array(historyMessageSchema).default([]),
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  targetUserId: z.string().uuid(),
})

export type GenerateRoleModelReplyInput = z.input<
  typeof generateRoleModelReplySchema
>

export interface GenerateRoleModelReplyResult {
  message: string
}

export type GenerateRoleModelReplyResponse =
  ActionResponse<GenerateRoleModelReplyResult>

export async function generateRoleModelReply(
  rawInput: GenerateRoleModelReplyInput
): Promise<GenerateRoleModelReplyResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
    }

    const input = generateRoleModelReplySchema.parse(rawInput)
    const persona = await getRoleModelChatPersona(input.targetUserId)
    const recentHistory = input.history.slice(-MAX_HISTORY_MESSAGES)

    const completion = await createChatCompletion({
      provider: "campus",
      messages: [
        {
          role: "system",
          content: persona.systemPrompt,
        },
        ...recentHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: input.message,
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message.content?.trim()
    if (!content) {
      throw new AppActionError(
        "INTERNAL_ERROR",
        "AIから返答を取得できませんでした。"
      )
    }

    return {
      message: content,
    }
  } catch (error) {
    return mapUnknownToErrorResponse(
      error,
      "AIとの相談に失敗しました。時間をおいて再度お試しください。"
    )
  }
}
