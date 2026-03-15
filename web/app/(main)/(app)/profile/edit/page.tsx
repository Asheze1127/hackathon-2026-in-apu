import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, UserRoundPen } from "lucide-react"

import { GraphTabBar } from "@/components/nav/tabbar"
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form"
import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, current_occupation, age, location")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <PageLayout className="pb-28">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm text-muted-foreground">
            <UserRoundPen className="size-4" />
            profile editor
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">
              <ArrowLeft className="size-4" />
              プロフィールに戻る
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            プロフィールを編集
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            アイコンや今の活動状況を更新して、あなたのプロフィールを整えます。
          </p>
        </div>
      </section>

      <ProfileSettingsForm initialProfile={profile} userId={user.id} />

      <GraphTabBar />
    </PageLayout>
  )
}
