"use server"

import { revalidatePath } from "next/cache"

import {
  AppActionError,
  mapUnknownToErrorResponse,
  type ActionResponse,
} from "@/lib/errors"
import {
  normalizeProfileSettingsInput,
  profileSettingsFormSchema,
} from "@/lib/profile/form-schema"
import { createClient } from "@/lib/supabase/server"

export async function updateProfileSettings(data: unknown): Promise<
  ActionResponse<{
    profile: {
      age: number | null
      avatar_url: string | null
      created_at: string
      current_occupation: string | null
      display_name: string | null
      goal: string | null
      id: string
      location: string | null
      onboarded: boolean
    }
  }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: {
        code: "UNAUTHORIZED",
        message: "認証が必要です。",
      },
    }
  }

  try {
    const parsed = profileSettingsFormSchema.parse(data)
    const normalized = normalizeProfileSettingsInput(parsed)

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        age: normalized.age,
        avatar_url: normalized.avatarUrl,
        current_occupation: normalized.currentOccupation,
        display_name: normalized.displayName,
        location: normalized.location,
      })
      .eq("id", user.id)
      .select("*")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppActionError(
          "PROFILE_NOT_FOUND",
          "プロフィールが見つかりません。"
        )
      }

      throw new Error(error.message)
    }

    revalidatePath("/profile")
    revalidatePath("/profile/edit")

    return {
      profile,
    }
  } catch (error) {
    return mapUnknownToErrorResponse(
      error,
      "プロフィールの保存に失敗しました。"
    )
  }
}
