"use client"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from "@xyflow/react"
import { nodeTypes } from "@/components/circle-node"
import { useGraphState } from "@/hooks/use-graph-state"

export default function Graph() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useGraphState()

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      minZoom={0.1}
      className="fixed top-0"
    >
      <Controls position="top-right" />
      <Background color="#ccc" variant={BackgroundVariant.Dots} />
    </ReactFlow>
  )
}
