"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"
import Link from "next/link"
import { ROLE_MODELS } from "@/lib/profile-data"
import { ProfileCard } from "@/components/profile/profile-card"
import { ProfileSegmentControl } from "@/components/profile/profile-segment-control"
import { ProfileTimeline } from "@/components/profile/profile-timeline"
import { ProfileTree } from "@/components/profile/profile-tree"

export default function RoleModelChatScreen() {
  const params = useParams<{ uid: string }>()
  const router = useRouter()
  const model = ROLE_MODELS[params.uid] ?? ROLE_MODELS["tanaka"]
  const chatHref = `/chat/model/${params.uid}`

  const [activeSegment, setActiveSegment] = useState(0)

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
        avatarText={model.avatarText}
        name={model.name}
        role={model.role}
        age={model.age}
        location={model.location}
        years={model.years}
        branchFrom={model.branchFrom}
        branchTo={model.branchTo}
        chatHref={chatHref}
      />

      <ProfileSegmentControl
        activeSegment={activeSegment}
        onChange={(nextSegment) => {
          if (nextSegment === 2) {
            router.push(chatHref)
            return
          }

          setActiveSegment(nextSegment)
        }}
      />

      {activeSegment === 0 && (
        <ProfileTimeline
          name={model.name}
          timelineItems={model.timelineItems}
          onStartChat={() => router.push(chatHref)}
        />
      )}
      {activeSegment === 1 && (
        <ProfileTree nodes={model.profileNodes} edges={model.profileEdges} />
      )}

      <GraphTabBar />
    </PageLayout>
  )
}
