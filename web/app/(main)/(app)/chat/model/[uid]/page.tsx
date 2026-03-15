import { notFound, redirect } from "next/navigation"

import { getOrCreateModelChatRoomForCurrentUser } from "@/lib/chat"
import { ROLE_MODELS } from "@/lib/profile-data"

export default async function ModelChatRedirectPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const model = ROLE_MODELS[uid]

  if (!model) {
    notFound()
  }

  const roomId = await getOrCreateModelChatRoomForCurrentUser(model.name)

  if (!roomId) {
    notFound()
  }

  redirect(`/chat/${roomId}`)
}
