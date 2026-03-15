import * as z from "zod"

const MAX_ANSWER_LENGTH = 100

export const formSchema = z.object({
  present: z
    .string()
    .trim()
    .min(1, "テキストは必須です。")
    .max(
      MAX_ANSWER_LENGTH,
      `テキストは${MAX_ANSWER_LENGTH}文字以内で入力してください。`
    ),
  reason: z
    .string()
    .trim()
    .min(1, "テキストは必須です。")
    .max(
      MAX_ANSWER_LENGTH,
      `テキストは${MAX_ANSWER_LENGTH}文字以内で入力してください。`
    ),
})

export type OnboardingFormInput = z.infer<typeof formSchema>

export { MAX_ANSWER_LENGTH }
