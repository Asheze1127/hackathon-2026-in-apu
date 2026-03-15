"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"
import Link from "next/link"
import { ROLE_MODELS } from "@/lib/profile-data"
import type { Message } from "@/lib/profile-data"
import { ProfileCard } from "@/components/profile/profile-card"
import { ProfileSegmentControl } from "@/components/profile/profile-segment-control"
import { ProfileTimeline } from "@/components/profile/profile-timeline"
import { ProfileTree } from "@/components/profile/profile-tree"
import { ProfileChat } from "@/components/profile/profile-chat"

export default function RoleModelChatScreen() {
  const params = useParams<{ uid: string }>()
  const model = ROLE_MODELS[params.uid] ?? ROLE_MODELS["tanaka"]

  const [activeSegment, setActiveSegment] = useState(0)
  const [messages, setMessages] = useState<Message[]>(model.initialMessages)
  const [input, setInput] = useState("")

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages((prev) => [
      ...prev.filter((m) => m.role !== "typing"),
      { role: "user", text: input, time: "今" },
      { role: "typing" },
    ])
    setInput("")
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
        avatarText={model.avatarText}
        name={model.name}
        role={model.role}
        age={model.age}
        location={model.location}
        years={model.years}
        branchFrom={model.branchFrom}
        branchTo={model.branchTo}
      />

      <ProfileSegmentControl
        activeSegment={activeSegment}
        onChange={setActiveSegment}
      />

      {activeSegment === 0 && (
        <ProfileTimeline
          name={model.name}
          timelineItems={model.timelineItems}
          onStartChat={() => setActiveSegment(2)}
        />
      )}
      {activeSegment === 1 && (
        <ProfileTree nodes={model.profileNodes} edges={model.profileEdges} />
      )}
      {activeSegment === 2 && (
        <ProfileChat
          name={model.name}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={sendMessage}
        />
      )}

      <GraphTabBar />
    </PageLayout>
  )
}
