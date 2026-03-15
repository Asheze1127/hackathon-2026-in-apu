"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitOnboardingForm(data: {
  present: string
  reason: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from("profiles")
    .update({ onboarded: true })
    .eq("id", user!.id)
  if (error) {
    throw new Error("Failed to update onboarding status")
  }
  console.log("onboarding form submitted", data)
}
