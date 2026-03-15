"use client"

import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react"
import type { Edge } from "@xyflow/react"
import { nodeTypes } from "@/components/circle-node"
import type { CircleNode } from "@/components/circle-node"

interface ProfileGraphProps {
  nodes: CircleNode[]
  edges: Edge[]
}

export function ProfileGraph({ nodes, edges }: ProfileGraphProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      minZoom={0.1}
      className="h-full w-full"
    >
      <Background color="#ccc" variant={BackgroundVariant.Dots} />
    </ReactFlow>
  )
}
