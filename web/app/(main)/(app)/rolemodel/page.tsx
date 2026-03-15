import { redirect } from "next/navigation"
import { UsersRound } from "lucide-react"

import { GraphTabBar } from "@/components/nav/tabbar"
import { RoleModelDirectory } from "@/components/rolemodel/rolemodel-directory"
import { PageLayout } from "@/components/shared/page-layout"
import { createClient } from "@/lib/supabase/server"
import { listRoleModels } from "@/lib/rolemodels"

export default async function RoleModelPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const roleModels = await listRoleModels(user.id)

  return (
    <PageLayout>
      <div className="flex flex-col gap-6 pb-24">
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm text-muted-foreground">
            <UsersRound className="size-4" />
            real profiles
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              ロールモデルを探す
            </h1>
            <p className="text-sm text-muted-foreground">
              実際のユーザーが登録した意思決定の軌跡から、新しい視点を見つけよう
            </p>
          </div>
        </div>

        <RoleModelDirectory roleModels={roleModels} />
      </div>
      <GraphTabBar />
    </PageLayout>
  )
}
