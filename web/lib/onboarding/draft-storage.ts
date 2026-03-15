"use client"

import type { OnboardingQuestionInput } from "@/lib/onboarding/form-schema"

const ONBOARDING_QUESTION_DRAFT_KEY = "onboarding-question-draft"

let _cachedRaw: string | null = null
let _cachedParsed: OnboardingQuestionInput | null = null

export function readOnboardingQuestionDraft(): OnboardingQuestionInput | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawValue = window.sessionStorage.getItem(ONBOARDING_QUESTION_DRAFT_KEY)
  if (!rawValue) {
    _cachedRaw = null
    _cachedParsed = null
    return null
  }

  if (rawValue === _cachedRaw) {
    return _cachedParsed
  }

  try {
    _cachedRaw = rawValue
    _cachedParsed = JSON.parse(rawValue) as OnboardingQuestionInput
    return _cachedParsed
  } catch {
    window.sessionStorage.removeItem(ONBOARDING_QUESTION_DRAFT_KEY)
    _cachedRaw = null
    _cachedParsed = null
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
  _cachedRaw = null
  _cachedParsed = null
}
