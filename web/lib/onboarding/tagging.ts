import "server-only"

import { z } from "zod"

import { createChatCompletion } from "@/actions/ai/client"
import type { ChatMessage } from "@/actions/ai/types"
import type { Tables } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

const MAX_TAGS_PER_TYPE = 3

const tagSelectionSchema = z.object({
  realTagCodes: z.array(z.string()).default([]),
  emotionalTagCodes: z.array(z.string()).default([]),
})

type TagType = "real" | "emotional"
type TagRow = Pick<Tables<"tags">, "id" | "name" | "type">

interface TagCandidate {
  code: string
  id: string
  name: string
  type: TagType
}

interface OnboardingTaggingInput {
  concreteAnswer: string
  abstractAnswer: string | null
}

interface OnboardingTaggingResult {
  realTagIds: string[]
  emotionalTagIds: string[]
}

function logTaggingCompletion(
  stage: "empty-content" | "invalid-json",
  input: OnboardingTaggingInput,
  payload: {
    content?: string | null
    finishReason?: string | null
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    message?: ChatMessage
  }
) {
  console.warn("[onboarding] tag classification raw response", {
    stage,
    concreteAnswer: input.concreteAnswer,
    abstractAnswer: input.abstractAnswer,
    finishReason: payload.finishReason ?? null,
    usage: payload.usage,
    message: payload.message,
    content: payload.content ?? null,
  })
}

function normalizeTagType(value: string): TagType | null {
  if (value === "real" || value === "emotional") {
    return value
  }

  return null
}

function buildCandidates(tags: TagRow[]) {
  const realCandidates: TagCandidate[] = []
  const emotionalCandidates: TagCandidate[] = []
  const candidateByCode = new Map<string, TagCandidate>()

  let realIndex = 0
  let emotionalIndex = 0

  for (const tag of tags) {
    const type = normalizeTagType(tag.type)
    if (!type) {
      continue
    }

    if (type === "real") {
      realIndex += 1
      const candidate = {
        code: `R${String(realIndex).padStart(2, "0")}`,
        id: tag.id,
        name: tag.name,
        type,
      }
      realCandidates.push(candidate)
      candidateByCode.set(candidate.code, candidate)
      continue
    }

    emotionalIndex += 1
    const candidate = {
      code: `E${String(emotionalIndex).padStart(2, "0")}`,
      id: tag.id,
      name: tag.name,
      type,
    }
    emotionalCandidates.push(candidate)
    candidateByCode.set(candidate.code, candidate)
  }

  return {
    realCandidates,
    emotionalCandidates,
    candidateByCode,
  }
}

function buildMessages(
  input: OnboardingTaggingInput,
  candidates: {
    realCandidates: TagCandidate[]
    emotionalCandidates: TagCandidate[]
  }
): ChatMessage[] {
  const payload = {
    task: "select_tags_for_onboarding",
    input: {
      concreteAnswer: input.concreteAnswer,
      abstractAnswer: input.abstractAnswer,
    },
    rules: {
      maxRealTags: MAX_TAGS_PER_TYPE,
      maxEmotionalTags: MAX_TAGS_PER_TYPE,
      selectOnlyFromCandidates: true,
      outputJsonOnly: true,
    },
    candidates: {
      real: candidates.realCandidates.map(({ code, name }) => ({
        code,
        name,
      })),
      emotional: candidates.emotionalCandidates.map(({ code, name }) => ({
        code,
        name,
      })),
    },
    outputSchema: {
      realTagCodes: ["R01"],
      emotionalTagCodes: ["E01"],
    },
  }

  return [
    {
      role: "system",
      content: [
        "You are a strict tag classifier for a Japanese career reflection app.",
        "Select up to 3 real tags and up to 3 emotional tags.",
        "Only choose from the provided candidate codes.",
        "Do not invent new tags.",
        "Return JSON only.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify(payload, null, 2),
    },
  ]
}

function extractJsonText(content: string): string {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")

  if (start >= 0 && end > start) {
    return content.slice(start, end + 1)
  }

  return content.trim()
}

function dedupeTagIds(
  codes: string[],
  candidateByCode: Map<string, TagCandidate>
) {
  const seen = new Set<string>()
  const ids: string[] = []

  for (const code of codes) {
    const candidate = candidateByCode.get(code)
    if (!candidate || seen.has(candidate.id)) {
      continue
    }

    seen.add(candidate.id)
    ids.push(candidate.id)

    if (ids.length >= MAX_TAGS_PER_TYPE) {
      break
    }
  }

  return ids
}

async function fetchTagRows(): Promise<TagRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, type")
    .in("type", ["real", "emotional"])
    .order("type", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function classifyOnboardingTags(
  input: OnboardingTaggingInput
): Promise<OnboardingTaggingResult> {
  const tags = await fetchTagRows()
  const { realCandidates, emotionalCandidates, candidateByCode } =
    buildCandidates(tags)

  if (realCandidates.length === 0 && emotionalCandidates.length === 0) {
    return {
      realTagIds: [],
      emotionalTagIds: [],
    }
  }

  const messages = buildMessages(input, {
    realCandidates,
    emotionalCandidates,
  })

  const completion = await createChatCompletion({
    provider: "campus",
    messages,
    max_tokens: 300,
    temperature: 0.1,
  })

  const firstChoice = completion.choices[0]
  const content = firstChoice?.message.content?.trim()
  if (!content) {
    logTaggingCompletion("empty-content", input, {
      content: firstChoice?.message.content,
      finishReason: firstChoice?.finish_reason,
      usage: completion.usage,
      message: firstChoice?.message,
    })
    throw new Error("AI provider returned empty content")
  }

  const jsonText = extractJsonText(content)

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(jsonText)
  } catch {
    logTaggingCompletion("invalid-json", input, {
      content,
      finishReason: firstChoice?.finish_reason,
      usage: completion.usage,
      message: firstChoice?.message,
    })
    throw new Error("AI provider returned non-JSON content")
  }

  const parsed = tagSelectionSchema.parse(parsedJson)

  return {
    realTagIds: dedupeTagIds(parsed.realTagCodes, candidateByCode),
    emotionalTagIds: dedupeTagIds(parsed.emotionalTagCodes, candidateByCode),
  }
}
