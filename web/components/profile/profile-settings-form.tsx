"use client"

import { useEffect, useState } from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { CheckCircle2, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"

import type { Tables } from "@/lib/supabase/database.types"
import {
  profileSettingsFormSchema,
  toProfileSettingsFormValues,
  type ProfileSettingsFormInput,
} from "@/lib/profile/form-schema"
import { updateProfileSettings } from "@/app/(main)/(app)/profile/actions"
import { ProfileSettingsSection } from "@/components/profile/profile-settings-section"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProfileSettingsFormProps {
  initialProfile?: Pick<
    Tables<"profiles">,
    "display_name" | "avatar_url" | "current_occupation" | "age" | "location"
  > | null
  userId: string
}

export function ProfileSettingsForm({
  initialProfile,
  userId,
}: ProfileSettingsFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<{
    message: string
    tone: "error" | "success"
  } | null>(null)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)

  const form = useForm<ProfileSettingsFormInput>({
    resolver: standardSchemaResolver(profileSettingsFormSchema),
    defaultValues: toProfileSettingsFormValues(initialProfile),
  })

  useEffect(() => {
    form.register("displayName")
    form.register("avatarUrl")
    form.register("currentOccupation")
    form.register("age")
    form.register("location")
  }, [form])

  const { errors, isSubmitting } = form.formState
  const [displayName, age, avatarUrl, currentOccupation, location] = useWatch({
    control: form.control,
    name: ["displayName", "age", "avatarUrl", "currentOccupation", "location"],
  })

  async function onSubmit(data: ProfileSettingsFormInput) {
    setStatus(null)

    const result = await updateProfileSettings(data)

    if ("error" in result) {
      setStatus({
        message: result.error.message,
        tone: "error",
      })
      return
    }

    form.reset(toProfileSettingsFormValues(result.profile))
    setStatus({
      message: "プロフィールを保存しました。",
      tone: "success",
    })
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>編集する項目</CardTitle>
          <CardDescription>
            名前、アイコン、現在の職業、年齢、住んでいるところを更新できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileSettingsSection
            description="プロフィール一覧や今後のユーザー表示で使う基本情報です。先に画像をアップロードし、最後に保存してください。"
            disabled={isSubmitting}
            errors={{
              displayName: errors.displayName?.message,
              age: errors.age?.message,
              avatarUrl: errors.avatarUrl?.message,
              currentOccupation: errors.currentOccupation?.message,
              location: errors.location?.message,
            }}
            onAvatarUploadingChange={setIsAvatarUploading}
            onFieldChange={(field, value) => {
              form.setValue(field, value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
            userId={userId}
            values={{
              displayName: displayName ?? "",
              age: age ?? "",
              avatarUrl: avatarUrl ?? "",
              currentOccupation: currentOccupation ?? "",
              location: location ?? "",
            }}
          />
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
          {status ? (
            <p
              className={
                status.tone === "success"
                  ? "flex items-center gap-2 text-sm text-emerald-700"
                  : "text-sm text-destructive"
              }
            >
              {status.tone === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : null}
              {status.message}
            </p>
          ) : (
            <span className="text-sm text-muted-foreground">
              保存するとすぐに反映されます。
            </span>
          )}
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting || isAvatarUploading}
          >
            <Save className="size-4" />
            {isAvatarUploading
              ? "画像をアップロード中..."
              : isSubmitting
                ? "保存中..."
                : "保存する"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
