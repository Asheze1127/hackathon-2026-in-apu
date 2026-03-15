"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import {
  ArrowLeft,
  Bot,
  LoaderCircle,
  SendHorizonal,
  Sparkles,
} from "lucide-react"

import { generateRoleModelReply } from "@/actions/rolemodel-chat/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface RoleModelAiChatMessage {
  content: string
  createdAt: string
  id: string
  role: "assistant" | "user"
}

interface RoleModelAiChatViewProps {
  currentOccupation: string | null
  displayName: string
  introMessage: string
  introTimestamp: string
  profileHref: string
  targetUserId: string
}

const formatter = new Intl.DateTimeFormat("ja-JP", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "numeric",
})

function createChatMessage(
  role: RoleModelAiChatMessage["role"],
  content: string
): RoleModelAiChatMessage {
  return {
    content,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    role,
  }
}

export function RoleModelAiChatView({
  currentOccupation,
  displayName,
  introMessage,
  introTimestamp,
  profileHref,
  targetUserId,
}: RoleModelAiChatViewProps) {
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<RoleModelAiChatMessage[]>([
    {
      content: introMessage,
      createdAt: introTimestamp,
      id: "assistant-intro",
      role: "assistant",
    },
  ])
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [isPending, messages])

  const helperText = useMemo(() => {
    if (error) {
      return error
    }

    return "この返答は本人の公開プロフィールと意思決定ツリーをもとにした擬似応答です。"
  }, [error])

  function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent || isPending) {
      return
    }

    const userMessage = createChatMessage("user", trimmedContent)
    const nextMessages = [...messages, userMessage]
    const history = messages.map((message) => ({
      content: message.content,
      role: message.role,
    }))

    setError(null)
    setMessages(nextMessages)
    setContent("")

    startTransition(async () => {
      const result = await generateRoleModelReply({
        history,
        message: trimmedContent,
        targetUserId,
      })

      if ("error" in result) {
        setError(result.error.message)
        return
      }

      setMessages((current) => [
        ...current,
        createChatMessage("assistant", result.message),
      ])
    })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={profileHref} aria-label="プロフィールへ戻る">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{displayName}</p>
              <p className="truncate text-sm text-muted-foreground">
                {currentOccupation?.trim() || "AI擬似人格との相談"}
              </p>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <Sparkles className="size-3.5" />
            AI相談モード
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 sm:px-6">
        <div className="pt-6">
          <div className="rounded-3xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            {helperText}
          </div>
        </div>

        <div className="flex-1 space-y-4 py-6">
          {messages.map((message) => {
            const isAssistant = message.role === "assistant"

            return (
              <div
                key={message.id}
                className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ring-1 ${
                    isAssistant
                      ? "bg-card text-card-foreground ring-foreground/10"
                      : "bg-primary text-primary-foreground ring-primary/20"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                    <span>{isAssistant ? `${displayName} AI` : "あなた"}</span>
                    <span>{formatter.format(new Date(message.createdAt))}</span>
                  </div>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            )
          })}

          {isPending ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-3xl bg-card px-4 py-3 text-card-foreground shadow-sm ring-1 ring-foreground/10">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{displayName} AI</span>
                  <span>入力中...</span>
                </div>
                <div className="flex items-center gap-1.5 py-1">
                  <div className="size-2 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.2s]" />
                  <div className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.1s]" />
                  <div className="size-2 animate-bounce rounded-full bg-primary/80" />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 border-t border-border/70 bg-background/95 py-4 backdrop-blur"
        >
          <div className="rounded-[28px] border border-border/70 bg-card/80 p-3 shadow-sm">
            <Textarea
              name="message"
              placeholder={`${displayName}さんに相談する`}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={isPending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit()
                }
              }}
              className="min-h-24 border-0 bg-transparent px-1 py-1 shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Shift+Enter で改行、Enter で送信できます。
              </div>
              <Button
                type="submit"
                disabled={isPending || content.trim().length === 0}
              >
                {isPending ? (
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
