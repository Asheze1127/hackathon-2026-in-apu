import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { PageLayout } from "@/components/shared/page-layout"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

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
        <p className="text-sm text-muted-foreground">ステップ 2 / 2</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          今のあなたを教えてください
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          必須の2問に加えて、名前もここで設定します。アイコンや住んでいる場所などの追加プロフィールはスキップできます。
        </p>
      </div>
      <OnboardingForm userId={user.id} />
    </PageLayout>
  )
}

export default Page
