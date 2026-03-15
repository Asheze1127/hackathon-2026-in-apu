"use client"

import type { OnboardingQuestionInput } from "@/lib/onboarding/form-schema"

const ONBOARDING_QUESTION_DRAFT_KEY = "onboarding-question-draft"

export function readOnboardingQuestionDraft(): OnboardingQuestionInput | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawValue = window.sessionStorage.getItem(ONBOARDING_QUESTION_DRAFT_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as OnboardingQuestionInput
  } catch {
    window.sessionStorage.removeItem(ONBOARDING_QUESTION_DRAFT_KEY)
    return null
  }
}

export function writeOnboardingQuestionDraft(value: OnboardingQuestionInput) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(
    ONBOARDING_QUESTION_DRAFT_KEY,
    JSON.stringify(value)
  )
}

export function clearOnboardingQuestionDraft() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.removeItem(ONBOARDING_QUESTION_DRAFT_KEY)
}
