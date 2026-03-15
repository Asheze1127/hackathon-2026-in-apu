"use client"

import { useEffect } from "react"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
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
  onboardingQuestionSchema,
  type OnboardingQuestionInput,
} from "@/lib/onboarding/form-schema"
import {
  readOnboardingQuestionDraft,
  writeOnboardingQuestionDraft,
} from "@/lib/onboarding/draft-storage"

export function OnboardingQuestionForm() {
  const router = useRouter()
  const form = useForm<OnboardingQuestionInput>({
    resolver: standardSchemaResolver(onboardingQuestionSchema),
    defaultValues: {
      present: "",
      reason: "",
    },
  })

  useEffect(() => {
    const draft = readOnboardingQuestionDraft()
    if (!draft) {
      return
    }

    form.reset(draft)
  }, [form])

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        writeOnboardingQuestionDraft(data)
        router.push("/onboarding/profile")
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

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="gap-2">
          プロフィール入力へ
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  )
}
