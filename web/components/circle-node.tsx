"use client"
import { cva } from "class-variance-authority"
import { Handle, Position } from "@xyflow/react"
import type { Node, NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"

export type CircleNodeData = {
  label: string
  unselected?: boolean
  isCurrent?: boolean
  isFuture?: boolean
  onHover?: (id: string | null) => void
}
export type CircleNode = Node<CircleNodeData, "circle">

const circleNodeVariants = cva(
  "relative flex h-20 w-20 items-center justify-center rounded-full border shadow-sm transition-opacity",
  {
    variants: {
      state: {
        default: "border-border bg-white",
        unselected: "border-border/40 bg-gray-100 opacity-50",
        current: "border-blue-400 bg-blue-50 ring-2 ring-blue-300",
        future: "animate-pulse border-blue-300 bg-blue-50 opacity-80",
      },
    },
    defaultVariants: { state: "default" },
  }
)

function getState(
  data: CircleNodeData
): "unselected" | "future" | "current" | "default" {
  if (data.unselected) return "unselected"
  if (data.isFuture) return "future"
  if (data.isCurrent) return "current"
  return "default"
}

export function CircleNodeComponent({ data, id }: NodeProps<CircleNode>) {
  return (
    <div
      className={cn(circleNodeVariants({ state: getState(data) }))}
      onMouseEnter={() => data.onHover?.(id)}
      onMouseLeave={() => data.onHover?.(null)}
    >
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
    </div>
  )
}

export const nodeTypes = { circle: CircleNodeComponent }
