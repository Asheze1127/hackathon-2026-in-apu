"use client"

import Graph from "@/components/graph"
import type { RoleModel } from "@/lib/profile-data"

interface ProfileTreeProps {
  nodes: RoleModel["profileNodes"]
  edges: RoleModel["profileEdges"]
}

export function ProfileTree({ nodes, edges }: ProfileTreeProps) {
  return (
    <div className="h-120 w-full overflow-hidden rounded-xl border border-border">
      <Graph nodes={nodes} edges={edges} className="h-full w-full" />
    </div>
  )
}
