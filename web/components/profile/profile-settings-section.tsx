"use client"

import {
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  UserRound,
} from "lucide-react"

import type { ProfileSettingsFormInput } from "@/lib/profile/form-schema"
import { ProfileAvatarDropzone } from "@/components/profile/profile-avatar-dropzone"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

interface ProfileSettingsSectionProps {
  description?: string
  disabled?: boolean
  errors?: Partial<Record<keyof ProfileSettingsFormInput, string | undefined>>
  onAvatarUploadingChange?: (value: boolean) => void
  onFieldChange: (field: keyof ProfileSettingsFormInput, value: string) => void
  title?: string
  userId: string
  values: ProfileSettingsFormInput
}

export function ProfileSettingsSection({
  description,
  disabled = false,
  errors,
  onAvatarUploadingChange,
  onFieldChange,
  title = "プロフィールを整える",
  userId,
  values,
}: ProfileSettingsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <Field data-invalid={Boolean(errors?.displayName)}>
        <FieldLabel htmlFor="profile-display-name" className="font-bold">
          名前
        </FieldLabel>
        <FieldDescription>
          他のユーザーから見える表示名です。オンボーディングでは必須です。
        </FieldDescription>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <UserRound className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="profile-display-name"
            aria-invalid={Boolean(errors?.displayName)}
            disabled={disabled}
            placeholder="例: 田中 太郎"
            value={values.displayName ?? ""}
            onChange={(event) => {
              onFieldChange("displayName", event.target.value)
            }}
          />
        </InputGroup>
        {errors?.displayName ? (
          <FieldError>{errors.displayName}</FieldError>
        ) : null}
      </Field>

      <ProfileAvatarDropzone
        disabled={disabled}
        onChange={(nextValue) => {
          onFieldChange("avatarUrl", nextValue)
        }}
        onUploadingChange={onAvatarUploadingChange}
        userId={userId}
        value={values.avatarUrl ?? ""}
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_150px]">
        <Field data-invalid={Boolean(errors?.currentOccupation)}>
          <FieldLabel
            htmlFor="profile-current-occupation"
            className="font-bold"
          >
            現在の職業
          </FieldLabel>
          <FieldDescription>
            今どんな立場で活動しているか、一言でわかる肩書きを入れます。
          </FieldDescription>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>
                <BriefcaseBusiness className="size-4" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="profile-current-occupation"
              aria-invalid={Boolean(errors?.currentOccupation)}
              disabled={disabled}
              placeholder="例: 大学生 / デザイナー / エンジニア"
              value={values.currentOccupation ?? ""}
              onChange={(event) => {
                onFieldChange("currentOccupation", event.target.value)
              }}
            />
          </InputGroup>
          {errors?.currentOccupation ? (
            <FieldError>{errors.currentOccupation}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(errors?.age)}>
          <FieldLabel htmlFor="profile-age" className="font-bold">
            年齢
          </FieldLabel>
          <FieldDescription>0から150の整数で入力します。</FieldDescription>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>
                <CalendarDays className="size-4" />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="profile-age"
              aria-invalid={Boolean(errors?.age)}
              disabled={disabled}
              inputMode="numeric"
              max="150"
              min="0"
              placeholder="28"
              type="number"
              value={values.age ?? ""}
              onChange={(event) => {
                onFieldChange("age", event.target.value)
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>歳</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {errors?.age ? <FieldError>{errors.age}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(errors?.location)}>
        <FieldLabel htmlFor="profile-location" className="font-bold">
          住んでいるところ
        </FieldLabel>
        <FieldDescription>
          都道府県や市区町村など、会話のきっかけになる粒度で十分です。
        </FieldDescription>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <MapPin className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="profile-location"
            aria-invalid={Boolean(errors?.location)}
            disabled={disabled}
            placeholder="例: 東京都渋谷区 / 大阪府"
            value={values.location ?? ""}
            onChange={(event) => {
              onFieldChange("location", event.target.value)
            }}
          />
        </InputGroup>
        {errors?.location ? <FieldError>{errors.location}</FieldError> : null}
      </Field>
    </section>
  )
}
