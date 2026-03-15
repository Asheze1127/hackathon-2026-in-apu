import { redirect } from "next/navigation"

import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { PageLayout } from "@/components/shared/page-layout"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const currentStep = 3

const Page = async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                "size-2 rounded-full transition-colors",
                n === currentStep
                  ? "bg-foreground"
                  : n < currentStep
                    ? "bg-foreground/40"
                    : "bg-border"
              )}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            ステップ {currentStep} / 3
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          名前とプロフィールを設定してください
        </h1>
        {/* <p className="leading-relaxed text-muted-foreground">
          名前は必須です。アイコンや住んでいるところなどの追加プロフィールは任意です。
        </p> */}
      </div>
      <OnboardingForm userId={user.id} />
    </PageLayout>
  )
}

export default Page
