"use client"

import type { RoleModel } from "@/lib/profile-data"
import { ProfileGraph } from "./profile-graph"

interface ProfileTreeProps {
  nodes: RoleModel["profileNodes"]
  edges: RoleModel["profileEdges"]
}

export function ProfileTree({ nodes, edges }: ProfileTreeProps) {
  return (
    <div className="h-120 w-full overflow-hidden rounded-xl border border-border">
      <ProfileGraph nodes={nodes} edges={edges} />
    </div>
  )
}
