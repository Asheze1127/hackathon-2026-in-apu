import { redirect } from "next/navigation"

import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { PageLayout } from "@/components/shared/page-layout"
import { createClient } from "@/lib/supabase/server"

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
        <p className="text-sm text-muted-foreground">ステップ 3 / 3</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          名前とプロフィールを設定してください
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          名前は必須です。アイコンや住んでいるところなどの追加プロフィールは任意です。
        </p>
      </div>
      <OnboardingForm userId={user.id} />
    </PageLayout>
  )
}

export default Page
