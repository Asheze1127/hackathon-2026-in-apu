"use client"

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"

import { submitOnboardingForm } from "@/app/(main)/(onboarding)/onboarding/actions"
import {
  formSchema,
  type OnboardingFormInput,
} from "@/lib/onboarding/form-schema"

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

export function OnboardingForm() {
  const router = useRouter()
  const form = useForm<OnboardingFormInput>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      present: "",
      reason: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(data: OnboardingFormInput) {
    await submitOnboardingForm(data)
    router.push("/onboarding/done")
  }

  return (
    <form
      id="onboarding-form"
      onSubmit={form.handleSubmit(onSubmit)}
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
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "続ける →"}
        </Button>
      </div>
    </form>
  )
}
