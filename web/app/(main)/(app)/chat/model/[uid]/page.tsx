import { notFound, redirect } from "next/navigation"

import { RoleModelAiChatView } from "@/components/chat/rolemodel-ai-chat-view"
import { AppActionError } from "@/lib/errors"
import { getRoleModelChatPersona } from "@/lib/rolemodel-chat"
import { createClient } from "@/lib/supabase/server"

export default async function RoleModelAiChatPage({
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

  if (uid === user.id) {
    redirect("/profile")
  }

  let persona
  try {
    persona = await getRoleModelChatPersona(uid)
  } catch (error) {
    if (error instanceof AppActionError && error.code === "PROFILE_NOT_FOUND") {
      notFound()
    }

    throw error
  }

  return (
    <RoleModelAiChatView
      currentOccupation={persona.currentOccupation}
      displayName={persona.displayName}
      introMessage={persona.introMessage}
      introTimestamp={new Date().toISOString()}
      profileHref={persona.profileHref}
      targetUserId={persona.id}
    />
  )
}
