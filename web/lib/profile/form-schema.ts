import * as z from "zod"

import type { Tables } from "@/lib/supabase/database.types"

// Maximum stored URL length for public avatar images.
const MAX_PROFILE_IMAGE_URL_LENGTH = 2048

// Maximum input length for the display name field.
const MAX_DISPLAY_NAME_LENGTH = 40

// Maximum input length for the current occupation field.
const MAX_OCCUPATION_LENGTH = 80

// Maximum input length for the location field.
const MAX_LOCATION_LENGTH = 120

// Maximum supported human age for profile display.
const MAX_PROFILE_AGE = 150

function nullishToEmptyString(value: unknown) {
  return value == null ? "" : value
}

function createOptionalTextField(maxLength: number, label: string) {
  return z.preprocess(
    nullishToEmptyString,
    z
      .string()
      .trim()
      .max(maxLength, `${label}は${maxLength}文字以内で入力してください。`)
  )
}

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const profileSettingsFormSchema = z.object({
  displayName: z.preprocess(
    nullishToEmptyString,
    z
      .string()
      .trim()
      .min(1, "名前は必須です。")
      .max(
        MAX_DISPLAY_NAME_LENGTH,
        `名前は${MAX_DISPLAY_NAME_LENGTH}文字以内で入力してください。`
      )
  ),
  avatarUrl: z.preprocess(
    nullishToEmptyString,
    z
      .string()
      .trim()
      .max(
        MAX_PROFILE_IMAGE_URL_LENGTH,
        `画像URLは${MAX_PROFILE_IMAGE_URL_LENGTH}文字以内で入力してください。`
      )
      .refine(
        (value) => value === "" || isValidUrl(value),
        "アイコン画像のURLが不正です。"
      )
  ),
  currentOccupation: createOptionalTextField(
    MAX_OCCUPATION_LENGTH,
    "現在の職業"
  ),
  age: z.preprocess(
    nullishToEmptyString,
    z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (/^\d+$/.test(value) &&
            Number(value) >= 0 &&
            Number(value) <= MAX_PROFILE_AGE),
        `年齢は0から${MAX_PROFILE_AGE}の整数で入力してください。`
      )
  ),
  location: createOptionalTextField(MAX_LOCATION_LENGTH, "住んでいるところ"),
})

export type ProfileSettingsFormInput = z.infer<typeof profileSettingsFormSchema>

export function normalizeProfileSettingsInput(input: ProfileSettingsFormInput) {
  const trimmedDisplayName = input.displayName.trim()
  const trimmedAvatarUrl = input.avatarUrl.trim()
  const trimmedOccupation = input.currentOccupation.trim()
  const trimmedAge = input.age.trim()
  const trimmedLocation = input.location.trim()

  return {
    displayName: trimmedDisplayName,
    avatarUrl: trimmedAvatarUrl || null,
    currentOccupation: trimmedOccupation || null,
    age: trimmedAge === "" ? null : Number(trimmedAge),
    location: trimmedLocation || null,
  }
}

export function toProfileSettingsFormValues(
  profile?: Pick<
    Tables<"profiles">,
    "display_name" | "avatar_url" | "current_occupation" | "age" | "location"
  > | null
): ProfileSettingsFormInput {
  return {
    displayName: profile?.display_name ?? "",
    avatarUrl: profile?.avatar_url ?? "",
    currentOccupation: profile?.current_occupation ?? "",
    age: profile?.age == null ? "" : String(profile.age),
    location: profile?.location ?? "",
  }
}
