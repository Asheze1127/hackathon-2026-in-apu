"use server"

export async function submitOnboardingForm(data: {
  present: string
  description: string
}) {
  // TODO: persist data
  // BEはここ
  console.log("onboarding form submitted", data)
}
