import { MessageCircle } from "lucide-react"

import { ChatRoomList } from "@/components/chat/chat-room-list"
import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"
import {
  ensureChatRoomsForCurrentUser,
  listChatRoomsForCurrentUser,
} from "@/lib/chat"

export default async function ChatPage() {
  await ensureChatRoomsForCurrentUser()
  const rooms = await listChatRoomsForCurrentUser()

  return (
    <PageLayout className="pb-28">
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-sm text-muted-foreground">
          <MessageCircle className="size-4" />
          room based chat
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">チャット</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            ユーザーとの 1 対 1 と、同じ goal を持つコミュニティを同じ room
            構造で扱います。
          </p>
        </div>
      </section>

      <ChatRoomList rooms={rooms} />
      <GraphTabBar />
    </PageLayout>
  )
}
