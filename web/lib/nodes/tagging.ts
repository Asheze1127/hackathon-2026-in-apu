import "server-only"

import { classifyOnboardingTags } from "@/lib/onboarding/tagging"

export async function classifyNodeTags(input: {
  concreteAnswer: string
  abstractAnswer: string | null
}) {
  return classifyOnboardingTags(input)
}
