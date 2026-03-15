import Link from "next/link"
import { MessageCircle, Sparkles, Users } from "lucide-react"

import { ChatRoomSummary, CHAT_ROOM_TYPES } from "@/lib/chat-shared"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const formatter = new Intl.DateTimeFormat("ja-JP", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "numeric",
})

function getRoomIcon(roomType: string) {
  if (roomType === CHAT_ROOM_TYPES.dmModel) {
    return Sparkles
  }

  return Users
}

function getRoomDescription(room: ChatRoomSummary) {
  if (room.latestMessage) {
    return room.latestMessage.content
  }

  if (room.room_type === CHAT_ROOM_TYPES.dmModel) {
    return "ロールモデルとの会話をここから始められます。"
  }

  return "同じ goal を持つメンバーと会話できます。"
}

function getRoomTypeLabel(roomType: string) {
  if (roomType === CHAT_ROOM_TYPES.dmModel) {
    return "DM"
  }

  return "COMMUNITY"
}

export function ChatRoomList({ rooms }: { rooms: ChatRoomSummary[] }) {
  if (rooms.length === 0) {
    return (
      <Card className="border border-dashed border-border/80 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            チャットルームはまだありません
          </CardTitle>
          <CardDescription>
            goal を設定するとコミュニティルームが作られます。
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {rooms.map((room) => {
        const Icon = getRoomIcon(room.room_type)
        const latestTimestamp =
          room.latestMessage?.created_at ?? room.created_at

        return (
          <Link key={room.id} href={`/chat/${room.id}`} className="block">
            <Card className="border border-border/70 bg-card/90 transition-transform hover:-translate-y-0.5 hover:bg-card">
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-1 font-medium tracking-[0.16em] text-foreground/80 uppercase">
                          {getRoomTypeLabel(room.room_type)}
                        </span>
                        {room.goal ? (
                          <span className="rounded-full border border-border px-2 py-1">
                            {room.goal}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatter.format(new Date(latestTimestamp))}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {getRoomDescription(room)}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
