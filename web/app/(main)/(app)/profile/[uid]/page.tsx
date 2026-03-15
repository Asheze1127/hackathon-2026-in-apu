import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, GitBranch } from "lucide-react"

import { GraphTabBar } from "@/components/nav/tabbar"
import { ProfileCard } from "@/components/profile/profile-card"
import { ProfileTimeline } from "@/components/profile/profile-timeline"
import { ProfileTree } from "@/components/profile/profile-tree"
import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getRoleModelDetail } from "@/lib/rolemodels"
import { Separator } from "@/components/ui/separator"

export default async function RoleModelProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (uid === user.id) {
    redirect("/profile")
  }

  const roleModel = await getRoleModelDetail(uid)

  if (!roleModel) {
    notFound()
  }

  return (
    <PageLayout className="gap-6 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/rolemodel">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={15} />
            ロールモデル一覧
          </Button>
        </Link>
      </div>

      <ProfileCard
        avatarText={roleModel.avatarText}
        name={roleModel.name}
        role={roleModel.role}
        age={roleModel.age}
        location={roleModel.location}
        years={roleModel.years}
        branchFrom={roleModel.branchFrom}
        branchTo={roleModel.branchTo}
        dmHref={roleModel.dmHref}
      />

      <section className="space-y-4">
        <ProfileTimeline
          aiChatHref={roleModel.aiChatHref}
          name={roleModel.name}
          timelineItems={roleModel.timelineItems}
        />
      </section>
      <Separator />
      <section className="space-y-4">
        <ProfileTree
          nodes={roleModel.profileNodes}
          edges={roleModel.profileEdges}
        />
      </section>

      <GraphTabBar />
    </PageLayout>
  )
}
