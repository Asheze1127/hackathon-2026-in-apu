import { notFound } from "next/navigation"

import { ChatRoomView } from "@/components/chat/chat-room-view"
import { getChatRoomForCurrentUser, listMessagesForRoom } from "@/lib/chat"
import { createClient } from "@/lib/supabase/server"

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const room = await getChatRoomForCurrentUser(roomId)
  if (!room) {
    notFound()
  }

  const messages = await listMessagesForRoom(roomId)

  return (
    <ChatRoomView
      currentUserId={user.id}
      initialMessages={messages}
      room={room}
    />
  )
}
