"use server"

import {
  formSchema,
  type OnboardingFormInput,
} from "@/lib/onboarding/form-schema"
import { AppActionError, mapUnknownToAppActionError } from "@/lib/errors"
import { classifyOnboardingTags } from "@/lib/onboarding/tagging"
import { createClient } from "@/lib/supabase/server"

function normalizeInput(input: OnboardingFormInput) {
  return {
    concreteAnswer: input.present.trim(),
    abstractAnswer: input.reason?.trim() || null,
  }
}

export async function submitOnboardingForm(data: unknown) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.warn("[onboarding] unauthorized access")
    throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
  }

  try {
    const parsed = formSchema.parse(data)
    const normalized = normalizeInput(parsed)

    const tags = await classifyOnboardingTags({
      concreteAnswer: normalized.concreteAnswer,
      abstractAnswer: normalized.abstractAnswer,
    }).catch((error: unknown) => {
      console.warn("[onboarding] tag classification failed", {
        userId: user.id,
        originalError:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
              }
            : error,
      })

      return {
        realTagIds: [],
        emotionalTagIds: [],
      }
    })

    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          onboarded: false,
        },
        {
          onConflict: "id",
        }
      )

    if (profileUpsertError) {
      throw new Error(profileUpsertError.message)
    }

    const nodeId = crypto.randomUUID()
    const { data: node, error: nodeInsertError } = await supabase
      .from("nodes")
      .insert({
        id: nodeId,
        user_id: user.id,
        parent_id: null,
        concrete_answer: normalized.concreteAnswer,
        abstract_answer: normalized.abstractAnswer,
        real_tags: tags.realTagIds,
        emotional_tags: tags.emotionalTagIds,
      })
      .select(
        "id, parent_id, concrete_answer, abstract_answer, real_tags, emotional_tags, created_at"
      )
      .single()

    if (nodeInsertError) {
      throw new Error(nodeInsertError.message)
    }

    const { data: profile, error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        onboarded: true,
      })
      .eq("id", user.id)
      .select("id, goal, onboarded")
      .single()

    if (profileUpdateError) {
      throw new Error(profileUpdateError.message)
    }

    const result = {
      profile,
      node: {
        id: node.id,
        parentId: node.parent_id,
        concreteAnswer: node.concrete_answer,
        abstractAnswer: node.abstract_answer,
        realTags: node.real_tags,
        emotionalTags: node.emotional_tags,
        createdAt: node.created_at,
      },
    }

    console.info("[onboarding] completed", {
      userId: user.id,
      concreteAnswerLength: normalized.concreteAnswer.length,
      abstractAnswerLength: normalized.abstractAnswer?.length ?? 0,
      realTagCount: tags.realTagIds.length,
      emotionalTagCount: tags.emotionalTagIds.length,
    })

    return result
  } catch (error) {
    const mappedError = mapUnknownToAppActionError(
      error,
      "オンボーディングの保存に失敗しました。"
    )

    console.error("[onboarding] failed", {
      userId: user.id,
      originalError:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
            }
          : error,
      code: mappedError.code,
      message: mappedError.message,
    })

    throw mappedError
  }
}
