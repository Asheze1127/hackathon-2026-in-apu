"use server"

import { ZodError } from "zod"

import {
  formSchema,
  type OnboardingFormInput,
} from "@/lib/onboarding/form-schema"
import prisma from "@/lib/prisma/client"
import { createClient } from "@/lib/supabase/server"

class OnboardingActionError extends Error {
  constructor(
    public readonly code:
      | "VALIDATION_ERROR"
      | "UNAUTHORIZED"
      | "PROFILE_NOT_FOUND"
      | "INTERNAL_ERROR",
    message: string
  ) {
    super(message)
    this.name = "OnboardingActionError"
  }
}

function normalizeInput(input: OnboardingFormInput) {
  return {
    concreteAnswer: input.present.trim(),
    abstractAnswer: input.reason?.trim() || null,
  }
}

function mapError(error: unknown): OnboardingActionError {
  if (error instanceof OnboardingActionError) {
    return error
  }

  if (error instanceof ZodError) {
    return new OnboardingActionError(
      "VALIDATION_ERROR",
      "オンボーディング入力が不正です。"
    )
  }

  return new OnboardingActionError(
    "INTERNAL_ERROR",
    "オンボーディングの保存に失敗しました。"
  )
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
    throw new OnboardingActionError("UNAUTHORIZED", "認証が必要です。")
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: user.id },
        select: { id: true },
      })

      if (!profile) {
        throw new OnboardingActionError(
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
    const mappedError = mapError(error)

    console.error("[onboarding] failed", {
      userId: user.id,
      code: mappedError.code,
      message: mappedError.message,
    })

    throw mappedError
  }
}
