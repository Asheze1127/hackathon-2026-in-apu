"use client"

import Link from "next/link"
import { useEffect, useSyncExternalStore, useState } from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"

import { submitOnboardingForm } from "@/app/(main)/(onboarding)/onboarding/actions"
import { ProfileSettingsSection } from "@/components/profile/profile-settings-section"
import { Button } from "@/components/ui/button"
import { profileSettingsFormSchema } from "@/lib/profile/form-schema"
import type { ProfileSettingsFormInput } from "@/lib/profile/form-schema"
import type { OnboardingFormInput } from "@/lib/onboarding/form-schema"
import type { OnboardingQuestionInput } from "@/lib/onboarding/form-schema"
import {
  clearOnboardingQuestionDraft,
  readOnboardingQuestionDraft,
} from "@/lib/onboarding/draft-storage"

interface OnboardingFormProps {
  userId: string
}

function subscribeToOnboardingDraft(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleStorage = () => {
    callback()
  }

  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener("storage", handleStorage)
  }
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const questionDraft = useSyncExternalStore<
    OnboardingQuestionInput | null | undefined
  >(subscribeToOnboardingDraft, readOnboardingQuestionDraft, () => undefined)

  const form = useForm<ProfileSettingsFormInput>({
    resolver: standardSchemaResolver(profileSettingsFormSchema),
    defaultValues: {
      displayName: "",
      age: "",
      avatarUrl: "",
      currentOccupation: "",
      location: "",
    },
  })

  const { isSubmitting } = form.formState

  useEffect(() => {
    form.register("displayName")
    form.register("avatarUrl")
    form.register("currentOccupation")
    form.register("age")
    form.register("location")

    if (questionDraft === null && !isSubmitting && !submitted) {
      router.replace("/onboarding/form")
    }
  }, [form, isSubmitting, questionDraft, router, submitted])
  const [displayName, avatarUrl, currentOccupation, age, location] = useWatch({
    control: form.control,
    name: ["displayName", "avatarUrl", "currentOccupation", "age", "location"],
  })

  async function onSubmit(data: ProfileSettingsFormInput) {
    if (!questionDraft) {
      router.replace("/onboarding/form")
      return
    }

    const payload: OnboardingFormInput = {
      ...questionDraft,
      ...data,
    }

    await submitOnboardingForm(payload)
    setSubmitted(true)
    clearOnboardingQuestionDraft()
    router.push("/onboarding/done")
  }

  if (questionDraft == null) {
    return null
  }

  return (
    <form
      id="onboarding-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-8"
    >
      <ProfileSettingsSection
        description="名前は他のユーザーに見える表示名です。残りの項目は任意です。"
        disabled={isSubmitting}
        errors={{
          displayName: form.formState.errors.displayName?.message,
          age: form.formState.errors.age?.message,
          avatarUrl: form.formState.errors.avatarUrl?.message,
          currentOccupation: form.formState.errors.currentOccupation?.message,
          location: form.formState.errors.location?.message,
        }}
        onAvatarUploadingChange={setIsAvatarUploading}
        onFieldChange={(field, value) => {
          form.setValue(field, value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
        title="今のあなたが伝わる情報"
        userId={userId}
        values={{
          displayName: displayName ?? "",
          age: age ?? "",
          avatarUrl: avatarUrl ?? "",
          currentOccupation: currentOccupation ?? "",
          location: location ?? "",
        }}
      />

      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/onboarding/form">← 質問に戻る</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          className="gap-2"
          disabled={isSubmitting || isAvatarUploading}
        >
          <CheckCircle2 className="size-4" />
          {isAvatarUploading
            ? "画像をアップロード中..."
            : isSubmitting
              ? "送信中..."
              : "続ける"}
        </Button>
      </div>
    </form>
  )
}
