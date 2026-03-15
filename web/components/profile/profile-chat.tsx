"use client"

import {
  Bot,
  RotateCcw,
  CheckCheck,
  Paperclip,
  SendHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Message } from "@/lib/profile-data"

interface ProfileChatProps {
  name: string
  messages: Message[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
}

export function ProfileChat({
  name,
  messages,
  input,
  onInputChange,
  onSend,
}: ProfileChatProps) {
  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <Bot size={16} color="white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">{name}（AI擬似人格）</div>
          <div className="mt-0.5 flex items-center gap-1">
            <div className="size-1.75 rounded-full bg-green-400" />
            <span className="text-xs text-muted-foreground">
              オンライン・返答可能
            </span>
          </div>
        </div>
        <Button variant="outline" size="icon-sm" className="rounded-lg!">
          <RotateCcw size={13} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex max-h-120 min-h-64 flex-col gap-3.5 overflow-y-auto bg-muted/40 px-4 py-4">
        {messages.map((msg, i) =>
          msg.role === "ai" ? (
            <div key={i} className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot size={14} color="white" />
              </div>
              <div className="max-w-[80%] flex-1">
                <div className="mb-1 text-[11px] font-bold text-primary">
                  {name} AI
                </div>
                <div className="rounded-[0_14px_14px_14px] border border-border bg-white px-3.5 py-3">
                  <p className="m-0 text-sm leading-relaxed text-foreground">
                    {msg.text}
                  </p>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {msg.time}
                </div>
              </div>
            </div>
          ) : msg.role === "user" ? (
            <div key={i} className="flex flex-col items-end gap-1">
              <div className="max-w-[80%] rounded-[14px_14px_0_14px] bg-primary px-3.5 py-3">
                <p className="m-0 text-sm leading-relaxed text-primary-foreground">
                  {msg.text}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CheckCheck size={11} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {msg.time}
                </span>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot size={14} color="white" />
              </div>
              <div>
                <div className="mb-1 text-[11px] font-bold text-primary">
                  {name} AI
                </div>
                <div className="flex items-center gap-1.5 rounded-[0_14px_14px_14px] border border-border bg-white px-4 py-3.5">
                  {["bg-indigo-300", "bg-primary", "bg-indigo-300"].map(
                    (cls, j) => (
                      <div
                        key={j}
                        className={`size-1.75 rounded-full ${cls}`}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder={`${name}さんに質問する…`}
            className="h-10 flex-1 text-sm"
          />
          <Button
            onClick={onSend}
            size="icon-sm"
            className="shrink-0 rounded-full"
          >
            <SendHorizontal size={16} />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Shift+Enterで改行 / Enterで送信
        </p>
      </div>
    </div>
  )
}
