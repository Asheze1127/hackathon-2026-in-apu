"use client"

import { List, TreeDeciduous, MessageCircle } from "lucide-react"

const TABS = [
  { Icon: List, label: "歩んだ道" },
  { Icon: TreeDeciduous, label: "ツリー" },
  { Icon: MessageCircle, label: "AIチャット" },
]

interface ProfileSegmentControlProps {
  activeSegment: number
  onChange: (index: number) => void
}

export function ProfileSegmentControl({
  activeSegment,
  onChange,
}: ProfileSegmentControlProps) {
  return (
    <div className="flex h-10 gap-0.5 rounded-[10px] bg-muted p-0.75">
      {TABS.map(({ Icon, label }, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-none font-sans text-sm transition-all ${activeSegment === i ? "bg-white font-semibold text-foreground shadow-sm" : "bg-transparent font-medium text-muted-foreground"}`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
