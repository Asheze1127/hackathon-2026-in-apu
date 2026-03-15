"use server"

export async function submitOnboardingForm(data: {
  present: string
  reason: string
}) {
  // TODO: persist data
  // BEはここ
  await new Promise((resolve) => setTimeout(resolve, 2000))
  console.log("onboarding form submitted", data)
}
