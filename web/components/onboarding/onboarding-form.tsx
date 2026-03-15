"use client"

import { useEffect, useState } from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"

import { submitOnboardingForm } from "@/app/(main)/(onboarding)/onboarding/actions"
import { ProfileSettingsSection } from "@/components/profile/profile-settings-section"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  formSchema,
  type OnboardingFormInput,
} from "@/lib/onboarding/form-schema"

interface OnboardingFormProps {
  userId: string
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)

  const form = useForm<OnboardingFormInput>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      displayName: "",
      age: "",
      avatarUrl: "",
      currentOccupation: "",
      location: "",
      present: "",
      reason: "",
    },
  })

  useEffect(() => {
    form.register("displayName")
    form.register("avatarUrl")
    form.register("currentOccupation")
    form.register("age")
    form.register("location")
  }, [form])

  const { isSubmitting } = form.formState
  const [displayName, avatarUrl, currentOccupation, age, location] = useWatch({
    control: form.control,
    name: ["displayName", "avatarUrl", "currentOccupation", "age", "location"],
  })

  async function onSubmit(
    data: OnboardingFormInput,
    options?: { saveProfile?: boolean }
  ) {
    await submitOnboardingForm(data, options)
    router.push("/onboarding/done")
  }

  async function handleSkipProfile() {
    form.setValue("avatarUrl", "", { shouldDirty: true, shouldValidate: false })
    form.setValue("currentOccupation", "", {
      shouldDirty: true,
      shouldValidate: false,
    })
    form.setValue("age", "", { shouldDirty: true, shouldValidate: false })
    form.setValue("location", "", {
      shouldDirty: true,
      shouldValidate: false,
    })
    form.clearErrors(["avatarUrl", "currentOccupation", "age", "location"])

    await form.handleSubmit(async (data) => {
      await onSubmit(data, {
        saveProfile: false,
      })
    })()
  }

  return (
    <form
      id="onboarding-form"
      onSubmit={form.handleSubmit(async (data) => {
        await onSubmit(data, {
          saveProfile: true,
        })
      })}
      className="flex flex-col gap-8"
    >
      <FieldGroup>
        <Controller
          name="present"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-present" className="font-bold">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  1
                </span>
                現在、あなたが熱心に取り組んでいることは何ですか
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id="form-present"
                  placeholder="大学生・社会人・フリーランスなど、なんでもいいので教えてください！"
                  rows={5}
                  className="min-h-24 resize-none"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {field.value.length}/100 文字
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="reason"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-reason" className="font-bold">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  2
                </span>
                それに注力している理由を教えてください
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id="form-reason"
                  placeholder="モチベーションや背景など、なんでもいいので教えてください！"
                  rows={5}
                  className="min-h-24 resize-none"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {field.value.length}/100 文字
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
          <CardDescription>
            名前は必須です。アイコン、職業、年齢、住んでいるところはあとからプロフィール画面でも編集できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsSection
            description="名前は他のユーザーに見える表示名です。その他の項目は不要ならスキップできます。"
            disabled={isSubmitting}
            errors={{
              displayName: form.formState.errors.displayName?.message,
              age: form.formState.errors.age?.message,
              avatarUrl: form.formState.errors.avatarUrl?.message,
              currentOccupation:
                form.formState.errors.currentOccupation?.message,
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
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting || isAvatarUploading}
          onClick={() => {
            void handleSkipProfile()
          }}
        >
          名前だけ保存して続ける
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || isAvatarUploading}
        >
          <CheckCircle2 className="size-4" />
          {isAvatarUploading
            ? "画像をアップロード中..."
            : isSubmitting
              ? "送信中..."
              : "名前とプロフィールを保存して続ける"}
        </Button>
      </div>
    </form>
  )
}
