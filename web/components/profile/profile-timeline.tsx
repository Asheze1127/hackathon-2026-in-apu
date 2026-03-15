import { Bot, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TimelineItem } from "@/lib/profile-data"

interface ProfileTimelineProps {
  name: string
  timelineItems: TimelineItem[]
  onStartChat: () => void
}

export function ProfileTimeline({
  name,
  timelineItems,
  onStartChat,
}: ProfileTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      <div className="mb-4">
        <div className="text-base font-bold">歩んだ道</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {name}さんが歩んできた道と意思決定の軌跡を確認できます。
        </div>
      </div>

      {timelineItems.map((item, i) => (
        <div key={i} className="relative flex items-start">
          <div className="flex w-8 shrink-0 flex-col items-center">
            <div
              className={`flex size-8 items-center justify-center rounded-full ${item.dotClass}`}
            >
              <item.Icon size={13} color={item.dotIconColor} />
            </div>
            {item.hasLine && (
              <div className="absolute top-8 bottom-0 left-3.75 w-0.5 bg-border" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5 pt-1 pb-5 pl-3">
            <div
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.75 ${item.dateClass}`}
            >
              <item.DateIcon size={10} />
              <span className="text-[11px] font-semibold">{item.date}</span>
            </div>
            <div className="text-sm font-bold">{item.title}</div>
            <Card
              size="sm"
              className={`rounded-[10px] shadow-none ${item.cardClass}`}
            >
              <CardContent className="flex flex-col gap-1.5 px-3.5! py-3!">
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                {item.choice && (
                  <div
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.75 ${item.choiceClass}`}
                  >
                    <div
                      className={`size-1.5 rounded-full ${item.choiceDotClass}`}
                    />
                    <span
                      className={`text-[11px] font-semibold ${item.choiceTextClass}`}
                    >
                      {item.choice}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      <div className="mt-2 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary">
          <Bot size={18} color="white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{name} AIと話してみよう</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            キャリアの選択理由や悩みを本人に質問できます。
          </div>
        </div>
        <Button size="sm" onClick={onStartChat} className="shrink-0 gap-1">
          話す <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  )
}
