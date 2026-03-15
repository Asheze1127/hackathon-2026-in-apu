import { redirect } from "next/navigation"
import { ShieldCheck, User } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { GraphTabBar } from "@/components/nav/tabbar"
import { OwnProfileOverview } from "@/components/profile/own-profile-overview"
import { PageLayout } from "@/components/shared/page-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
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
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">プロフィール</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            まずは今の登録内容を確認し、必要なら編集画面から更新できます。
          </p>
        </div>
      </section>

      <OwnProfileOverview
        age={profile?.age ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        currentOccupation={profile?.current_occupation ?? null}
        displayName={profile?.display_name ?? null}
        email={user.email ?? null}
        location={profile?.location ?? null}
      />

      <Card size="sm" className="border border-destructive/10 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            セッション
          </CardTitle>
          <CardDescription>
            この端末のログイン状態を終了します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton className="w-full sm:w-auto" />
        </CardContent>
      </Card>

      <GraphTabBar />
    </PageLayout>
  )
}
