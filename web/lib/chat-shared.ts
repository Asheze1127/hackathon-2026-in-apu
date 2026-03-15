import { Tables } from "@/lib/supabase/database.types"

export const CHAT_ROOM_TYPES = {
  community: "community",
  dmModel: "dm_model",
} as const

export type ChatRoomType =
  (typeof CHAT_ROOM_TYPES)[keyof typeof CHAT_ROOM_TYPES]

export type ChatMessage = Tables<"messages">
export type ChatRoomRecord = Tables<"chat_rooms">
export type ChatPeerProfile = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "avatar_url" | "current_occupation"
>

export type ChatRoom = ChatRoomRecord & {
  peerProfile: ChatPeerProfile | null
  resolvedName: string
  resolvedSubtitle: string | null
}

export type ChatRoomSummary = ChatRoom & {
  latestMessage: ChatMessage | null
  unreadCount: number
}
