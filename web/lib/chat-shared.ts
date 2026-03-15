import { Tables } from "@/lib/supabase/database.types"

export const CHAT_ROOM_TYPES = {
  community: "community",
  dmModel: "dm_model",
} as const

export type ChatRoomType =
  (typeof CHAT_ROOM_TYPES)[keyof typeof CHAT_ROOM_TYPES]

export type ChatRoom = Tables<"chat_rooms">
export type ChatMessage = Tables<"messages">

export type ChatRoomSummary = ChatRoom & {
  latestMessage: ChatMessage | null
  unreadCount: number
}
