import "server-only"

import { createClient, getProfile } from "@/lib/supabase/server"
import {
  ChatMessage,
  ChatRoom,
  ChatRoomSummary,
  CHAT_ROOM_TYPES,
} from "@/lib/chat-shared"

async function ensureRoomMembership(roomId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("chat_room_members").insert({
    room_id: roomId,
    user_id: userId,
  })

  if (error && error.code !== "23505") {
    throw new Error(error.message)
  }
}

async function ensureDmModelRoom(userId: string, goal: string | null) {
  const supabase = await createClient()
  const { data: existingRoom, error: selectError } = await supabase
    .from("chat_rooms")
    .select("id, goal")
    .eq("room_type", CHAT_ROOM_TYPES.dmModel)
    .eq("created_by", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    throw new Error(selectError.message)
  }

  let roomId = existingRoom?.id
  if (!roomId) {
    const { data: insertedRoom, error: insertError } = await supabase
      .from("chat_rooms")
      .insert({
        created_by: userId,
        goal,
        name: "Decision Path Mentor",
        room_type: CHAT_ROOM_TYPES.dmModel,
      })
      .select("id")
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    roomId = insertedRoom.id
  } else if (existingRoom && (existingRoom.goal ?? null) !== goal) {
    const { error: updateError } = await supabase
      .from("chat_rooms")
      .update({ goal })
      .eq("id", roomId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  await ensureRoomMembership(roomId, userId)
}

async function ensureGoalCommunityRoom(goal: string, userId: string) {
  const supabase = await createClient()
  const { data: existingRoom, error: selectError } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("room_type", CHAT_ROOM_TYPES.community)
    .eq("goal", goal)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    throw new Error(selectError.message)
  }

  let roomId = existingRoom?.id
  if (!roomId) {
    const { data: insertedRoom, error: insertError } = await supabase
      .from("chat_rooms")
      .insert({
        created_by: userId,
        goal,
        name: `${goal}コミュニティ`,
        room_type: CHAT_ROOM_TYPES.community,
      })
      .select("id")
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    roomId = insertedRoom.id
  }

  await ensureRoomMembership(roomId, userId)
}

export async function ensureChatRoomsForCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const profile = await getProfile()
  const normalizedGoal = profile?.goal?.trim() || null

  await ensureDmModelRoom(user.id, normalizedGoal)

  if (!normalizedGoal) {
    return
  }

  await ensureGoalCommunityRoom(normalizedGoal, user.id)
}

export async function listChatRoomsForCurrentUser(): Promise<
  ChatRoomSummary[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("chat_room_members")
    .select(
      "room_id, chat_rooms!inner(id, name, room_type, created_by, goal, created_at)"
    )
    .eq("user_id", user.id)

  if (membershipsError) {
    throw new Error(membershipsError.message)
  }

  const rooms = memberships
    .map((membership) => membership.chat_rooms)
    .filter((room): room is ChatRoom => Boolean(room))

  if (rooms.length === 0) {
    return []
  }

  const roomIds = rooms.map((room) => room.id)

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, room_id, sender_id, content, created_at")
    .in("room_id", roomIds)
    .order("created_at", { ascending: false })

  if (messagesError) {
    throw new Error(messagesError.message)
  }

  const latestByRoom = new Map<string, ChatMessage>()
  for (const message of messages) {
    if (!latestByRoom.has(message.room_id)) {
      latestByRoom.set(message.room_id, message)
    }
  }

  return rooms
    .map((room) => ({
      ...room,
      latestMessage: latestByRoom.get(room.id) ?? null,
      unreadCount: 0,
    }))
    .sort((left, right) => {
      const leftTimestamp =
        left.latestMessage?.created_at ?? left.created_at ?? ""
      const rightTimestamp =
        right.latestMessage?.created_at ?? right.created_at ?? ""

      return rightTimestamp.localeCompare(leftTimestamp)
    })
}

export async function getChatRoomForCurrentUser(roomId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: membership, error } = await supabase
    .from("chat_room_members")
    .select(
      "chat_rooms!inner(id, name, room_type, created_by, goal, created_at)"
    )
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(error.message)
  }

  return membership?.chat_rooms ?? null
}

export async function listMessagesForRoom(roomId: string) {
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, room_id, sender_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return messages
}
