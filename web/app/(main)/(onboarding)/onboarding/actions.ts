"use server"

import {
  formSchema,
  type OnboardingFormInput,
} from "@/lib/onboarding/form-schema"
import { AppActionError, mapUnknownToAppActionError } from "@/lib/errors"
import prisma from "@/lib/prisma/client"
import { createClient } from "@/lib/supabase/server"

function normalizeInput(input: OnboardingFormInput) {
  return {
    concreteAnswer: input.present.trim(),
    abstractAnswer: input.reason?.trim() || null,
  }
}

export async function submitOnboardingForm(data: unknown) {
  const parsed = formSchema.parse(data)
  const normalized = normalizeInput(parsed)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.warn("[onboarding] unauthorized access")
    throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: user.id },
        select: { id: true },
      })

      if (!profile) {
        throw new AppActionError(
          "PROFILE_NOT_FOUND",
          "プロフィールが見つかりません。"
        )
      }

      const updatedProfile = await tx.profile.update({
        where: { id: user.id },
        data: {
          onboarded: true,
        },
        select: {
          id: true,
          goal: true,
          onboarded: true,
        },
      })

      const node = await tx.node.create({
        data: {
          userId: user.id,
          parentId: null,
          concreteAnswer: normalized.concreteAnswer,
          abstractAnswer: normalized.abstractAnswer,
          realTags: [], //TODO: AIでタグ付け
          emotionalTags: [], //TODO: AIでタグ付け
        },
        select: {
          id: true,
          parentId: true,
          concreteAnswer: true,
          abstractAnswer: true,
          realTags: true,
          emotionalTags: true,
          createdAt: true,
        },
      })

      return { profile: updatedProfile, node }
    })

    console.info("[onboarding] completed", {
      userId: user.id,
      concreteAnswerLength: normalized.concreteAnswer.length,
      abstractAnswerLength: normalized.abstractAnswer?.length ?? 0,
    })

    return result
  } catch (error) {
    const mappedError = mapUnknownToAppActionError(
      error,
      "オンボーディングの保存に失敗しました。"
    )

    console.error("[onboarding] failed", {
      userId: user.id,
      code: mappedError.code,
      message: mappedError.message,
    })

    throw mappedError
  }
}
