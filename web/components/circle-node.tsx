"use client"
import { cva } from "class-variance-authority"
import { ArrowDown, ArrowUp, Plus } from "lucide-react"
import { Handle, Position } from "@xyflow/react"
import type { Node, NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"

export type CircleNodeData = {
  canAddFuture?: boolean
  canAddPast?: boolean
  isSelected?: boolean
  label: string
  unselected?: boolean
  isCurrent?: boolean
  isFuture?: boolean
  isPrediction?: boolean
  predictionDepth?: number
  onAddFuture?: (id: string) => void
  onAddPast?: (id: string) => void
  onHover?: (id: string | null) => void
}
export type CircleNode = Node<CircleNodeData, "circle">

const circleNodeVariants = cva(
  "relative flex h-20 w-20 items-center justify-center overflow-visible rounded-full border shadow-sm transition-opacity",
  {
    variants: {
      state: {
        default: "border-border bg-white",
        unselected: "border-border/40 bg-gray-100 opacity-50",
        selected: "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200",
        current: "border-blue-400 bg-blue-50 ring-2 ring-blue-300",
        future: "animate-pulse border-blue-300 bg-blue-50 opacity-80",
        prediction:
          "border-rose-200 bg-rose-50/95 text-rose-950 shadow-rose-100/80",
      },
    },
    defaultVariants: { state: "default" },
  }
)

function getState(
  data: CircleNodeData
): "unselected" | "future" | "current" | "selected" | "prediction" | "default" {
  if (data.unselected) return "unselected"
  if (data.isCurrent) return "current"
  if (data.isSelected) return "selected"
  if (data.isPrediction) return "prediction"
  if (data.isFuture) return "future"
  return "default"
}

function GhostAddNodeButton({
  direction,
  onClick,
}: {
  direction: "future" | "past"
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const isFuture = direction === "future"
  const ArrowIcon = isFuture ? ArrowUp : ArrowDown

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 z-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border/80 to-border/20 transition duration-200 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100",
          isFuture ? "-top-14 h-14" : "-bottom-14 h-14"
        )}
      />
      <button
        type="button"
        aria-label={isFuture ? "未来ノードを追加" : "過去ノードを追加"}
        className={cn(
          "nodrag nopan absolute left-1/2 z-10 flex size-16 -translate-x-1/2 flex-col items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition duration-200",
          "scale-100 opacity-100 md:scale-95 md:opacity-0 md:group-focus-within:scale-100 md:group-focus-within:opacity-100 md:group-hover:scale-100 md:group-hover:opacity-100",
          "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none",
          isFuture
            ? "-top-18 border-emerald-200/80 bg-emerald-50/92 text-emerald-700 shadow-emerald-100/80"
            : "-bottom-18 border-sky-200/80 bg-sky-50/92 text-sky-700 shadow-sky-100/80"
        )}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={onClick}
      >
        <div className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.18em]">
          <ArrowIcon className="size-3" />
          <span>{isFuture ? "FUTURE" : "PAST"}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold">
          <Plus className="size-3.5" />
          <span>{isFuture ? "追加" : "追加"}</span>
        </div>
      </button>
    </>
  )
}

export function CircleNodeComponent({ data, id }: NodeProps<CircleNode>) {
  return (
    <div
      className={cn(
        circleNodeVariants({ state: getState(data) }),
        data.isPrediction
          ? data.predictionDepth && data.predictionDepth >= 3
            ? "opacity-70"
            : data.predictionDepth === 2
              ? "opacity-80"
              : "opacity-90"
          : null,
        "group isolate"
      )}
      onMouseEnter={() => data.onHover?.(id)}
      onMouseLeave={() => data.onHover?.(null)}
    >
      {data.onAddFuture && data.canAddFuture !== false ? (
        <GhostAddNodeButton
          direction="future"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            data.onAddFuture?.(id)
          }}
        />
      ) : null}

      <Handle type="target" position={Position.Top} />
      <span
        className={cn(
          "line-clamp-3 w-14 text-center text-xs font-medium break-all select-none",
          data.unselected ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} />

      {data.onAddPast && data.canAddPast !== false ? (
        <GhostAddNodeButton
          direction="past"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            data.onAddPast?.(id)
          }}
        />
      ) : null}
    </div>
  )
}

export const nodeTypes = { circle: CircleNodeComponent }
