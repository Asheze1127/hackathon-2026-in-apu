"use client"

import Link from "next/link"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import {
  ArrowLeft,
  LoaderCircle,
  SendHorizonal,
  Sparkles,
  Users,
} from "lucide-react"

import { ChatMessage, ChatRoom, CHAT_ROOM_TYPES } from "@/lib/chat-shared"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const formatter = new Intl.DateTimeFormat("ja-JP", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "numeric",
})

function mergeMessages(messages: ChatMessage[], nextMessage: ChatMessage) {
  const existingIndex = messages.findIndex(
    (message) => message.id === nextMessage.id
  )

  if (existingIndex >= 0) {
    const updatedMessages = [...messages]
    updatedMessages[existingIndex] = nextMessage
    return updatedMessages
  }

  return [...messages, nextMessage].sort((left, right) =>
    left.created_at.localeCompare(right.created_at)
  )
}

function getSenderLabel(
  room: ChatRoom,
  senderId: string,
  currentUserId: string
) {
  if (senderId === currentUserId) {
    return "あなた"
  }

  if (room.room_type === CHAT_ROOM_TYPES.dmModel) {
    return room.name
  }

  return `メンバー ${senderId.slice(0, 8)}`
}

function getRoomIcon(roomType: string) {
  if (roomType === CHAT_ROOM_TYPES.dmModel) {
    return Sparkles
  }

  return Users
}

export function ChatRoomView({
  currentUserId,
  initialMessages,
  room,
}: {
  currentUserId: string
  initialMessages: ChatMessage[]
  room: ChatRoom
}) {
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const handleIncomingMessage = useEffectEvent((message: ChatMessage) => {
    if (message.room_id !== room.id) {
      return
    }

    setMessages((current) => mergeMessages(current, message))
  })

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`room:${room.id}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `room_id=eq.${room.id}`,
          schema: "public",
          table: "messages",
        },
        (payload) => {
          handleIncomingMessage(payload.new as ChatMessage)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [room.id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return
    }

    setIsSending(true)
    setError(null)
    setContent("")

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        content: trimmedContent,
        room_id: room.id,
        sender_id: currentUserId,
      })
      .select("id, room_id, sender_id, content, created_at")
      .single()

    if (insertError) {
      setError(insertError.message)
      setContent(trimmedContent)
      setIsSending(false)
      return
    }

    setMessages((current) => mergeMessages(current, data))
    setIsSending(false)
  }

  const Icon = getRoomIcon(room.room_type)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/chat" aria-label="チャット一覧へ戻る">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{room.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {room.goal
                  ? room.goal
                  : room.room_type === CHAT_ROOM_TYPES.dmModel
                    ? "ロールモデルとの1対1チャット"
                    : "コミュニティチャット"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 sm:px-6">
        <div className="flex-1 space-y-4 py-6">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-8 text-center">
              <p className="text-sm font-medium">まだメッセージはありません</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                最初の一言を送ると、この room の履歴がここに表示されます。
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ring-1 ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground ring-primary/20"
                        : "bg-card text-card-foreground ring-foreground/10"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                      <span>
                        {getSenderLabel(room, message.sender_id, currentUserId)}
                      </span>
                      <span>
                        {formatter.format(new Date(message.created_at))}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 border-t border-border/70 bg-background/95 py-4 backdrop-blur"
        >
          <div className="rounded-[28px] border border-border/70 bg-card/80 p-3 shadow-sm">
            <Textarea
              name="message"
              placeholder="メッセージを入力"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={isSending}
              className="min-h-24 border-0 bg-transparent px-1 py-1 shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {error ? error : "複数行のメッセージもそのまま送信できます。"}
              </div>
              <Button
                type="submit"
                disabled={isSending || content.trim().length === 0}
              >
                {isSending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <SendHorizonal />
                )}
                送信
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
