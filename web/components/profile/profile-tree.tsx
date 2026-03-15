"use client"

import type { Edge } from "@xyflow/react"
import type { CircleNode } from "@/components/circle-node"
import { ProfileGraph } from "./profile-graph"

interface ProfileTreeProps {
  nodes: CircleNode[]
  edges: Edge[]
}

export function ProfileTree({ nodes, edges }: ProfileTreeProps) {
  return (
    <div className="h-120 w-full overflow-hidden rounded-xl border border-border">
      <ProfileGraph nodes={nodes} edges={edges} />
    </div>
  )
}
