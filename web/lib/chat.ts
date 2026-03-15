import "server-only"

import prisma from "@/lib/prisma/client"
import { createClient, getProfile } from "@/lib/supabase/server"
import {
  type ChatMessage,
  type ChatPeerProfile,
  type ChatRoom,
  type ChatRoomSummary,
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

function toChatMessage(message: {
  id: string
  roomId: string
  senderId: string
  content: string
  createdAt: Date
}): ChatMessage {
  return {
    content: message.content,
    created_at: message.createdAt.toISOString(),
    id: message.id,
    room_id: message.roomId,
    sender_id: message.senderId,
  }
}

function toPeerProfile(profile: {
  id: string
  displayName: string | null
  avatarUrl: string | null
  currentOccupation: string | null
}): ChatPeerProfile {
  return {
    avatar_url: profile.avatarUrl,
    current_occupation: profile.currentOccupation,
    display_name: profile.displayName,
    id: profile.id,
  }
}

function resolveChatRoom(
  room: {
    id: string
    name: string
    roomType: string
    createdBy: string
    goal: string | null
    createdAt: Date
    members: Array<{
      userId: string
      user: {
        id: string
        displayName: string | null
        avatarUrl: string | null
        currentOccupation: string | null
      }
    }>
  },
  currentUserId: string
): ChatRoom {
  const peerMember =
    room.members.find((member) => member.userId !== currentUserId) ?? null
  const peerProfile = peerMember ? toPeerProfile(peerMember.user) : null

  return {
    created_at: room.createdAt.toISOString(),
    created_by: room.createdBy,
    goal: room.goal,
    id: room.id,
    name: room.name,
    peerProfile,
    resolvedName:
      peerProfile?.display_name?.trim() || room.name || "チャットルーム",
    resolvedSubtitle: peerProfile?.current_occupation?.trim() || room.goal,
    room_type: room.roomType,
  }
}

async function ensureDmModelRoom(
  userId: string,
  goal: string | null,
  roomName = "Decision Path Mentor"
) {
  const supabase = await createClient()
  const { data: existingRoom, error: selectError } = await supabase
    .from("chat_rooms")
    .select("id, goal")
    .eq("room_type", CHAT_ROOM_TYPES.dmModel)
    .eq("created_by", userId)
    .eq("name", roomName)
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
        name: roomName,
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

  return roomId
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

  const { data: existingDmRoom, error: existingDmRoomError } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("room_type", CHAT_ROOM_TYPES.dmModel)
    .eq("created_by", user.id)
    .eq("name", "Decision Path Mentor")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingDmRoomError) {
    throw new Error(existingDmRoomError.message)
  }

  if (!existingDmRoom) {
    await ensureDmModelRoom(user.id, normalizedGoal)
  }

  if (!normalizedGoal) {
    return
  }

  await ensureGoalCommunityRoom(normalizedGoal, user.id)
}

export async function getOrCreateModelChatRoomForCurrentUser(roomName: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const profile = await getProfile()
  const normalizedGoal = profile?.goal?.trim() || null

  return ensureDmModelRoom(user.id, normalizedGoal, roomName)
}

export async function getOrCreateUserDmRoomForCurrentUser(
  targetUserId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id === targetUserId) {
    return null
  }

  const targetProfile = await prisma.profile.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      displayName: true,
      onboarded: true,
    },
  })

  if (!targetProfile?.onboarded) {
    return null
  }

  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      roomType: CHAT_ROOM_TYPES.dmModel,
      members: {
        some: {
          userId: user.id,
        },
      },
      AND: [
        {
          members: {
            some: {
              userId: targetUserId,
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (existingRoom) {
    return existingRoom.id
  }

  const room = await prisma.chatRoom.create({
    data: {
      createdBy: user.id,
      goal: null,
      name: "1対1のDM",
      roomType: CHAT_ROOM_TYPES.dmModel,
      members: {
        create: [{ userId: user.id }, { userId: targetUserId }],
      },
    },
    select: { id: true },
  })

  return room.id
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

  const rooms = await prisma.chatRoom.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      roomType: true,
      createdBy: true,
      goal: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              currentOccupation: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          roomId: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
      },
    },
  })

  return rooms
    .map((room) => ({
      ...resolveChatRoom(room, user.id),
      latestMessage: room.messages[0] ? toChatMessage(room.messages[0]) : null,
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

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      roomType: true,
      createdBy: true,
      goal: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              currentOccupation: true,
            },
          },
        },
      },
    },
  })

  if (!room) {
    return null
  }

  return resolveChatRoom(room, user.id)
}

export async function listMessagesForRoom(roomId: string) {
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      roomId: true,
      senderId: true,
      content: true,
      createdAt: true,
    },
  })

  return messages.map((message) => toChatMessage(message))
}
