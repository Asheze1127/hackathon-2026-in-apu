import type { Node, Edge } from "@xyflow/react"
import type { CircleNodeData } from "@/components/circle-node"
import { CURRENT_NODE_ID } from "@/lib/graph"

// Scale Dagre pixel coords → R3F world units
// Dagre nodesep=60, ranksep=80, graph spans ~700x800px → ~8.75x10 world units
export const DAGRE_SCALE = 1 / 80

export type NodeState = "default" | "unselected" | "current" | "future"

export type Node3D = {
  id: string
  label: string
  x: number
  y: number // negated: Dagre y+ = down, R3F y+ = up
  z: number
  state: NodeState
}

export type Edge3D = {
  id: string
  sourceId: string
  targetId: string
  isDashed: boolean
  isUnselected: boolean
  isSelected: boolean // part of the main chosen path
}

export function toNode3D(n: Node, isFuture = false): Node3D {
  const data = n.data as CircleNodeData
  let state: NodeState = "default"
  if (isFuture) state = "future"
  else if (n.id === CURRENT_NODE_ID) state = "current"
  else if (data.unselected) state = "unselected"

  const x = n.position.x * DAGRE_SCALE
  const y = n.position.y * DAGRE_SCALE
  const z = 0

  return {
    id: n.id,
    label: data.label,
    x,
    y,
    z,
    state,
  }
}

export function toEdge3D(e: Edge, isDashed = false): Edge3D {
  const isUnselected = e.style?.stroke === "#ccc"
  return {
    id: e.id,
    sourceId: e.source,
    targetId: e.target,
    isDashed,
    isUnselected: isUnselected ?? false,
    isSelected: !isUnselected && !isDashed,
  }
}
