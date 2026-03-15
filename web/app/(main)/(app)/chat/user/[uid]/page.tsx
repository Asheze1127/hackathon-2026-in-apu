import { notFound, redirect } from "next/navigation"

import { getOrCreateUserDmRoomForCurrentUser } from "@/lib/chat"
import { createClient } from "@/lib/supabase/server"

export default async function UserDmEntryPage({
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

  const roomId = await getOrCreateUserDmRoomForCurrentUser(uid)
  if (!roomId) {
    notFound()
  }

  redirect(`/chat/${roomId}`)
}
