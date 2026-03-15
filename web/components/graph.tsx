"use client"
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
} from "@xyflow/react"
import type { Node, NodeProps } from "@xyflow/react"

type CircleNodeData = { label: string }
type CircleNode = Node<CircleNodeData, "circle">

function CircleNode({ data }: NodeProps<CircleNode>) {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <span className="max-w-15 truncate text-center text-xs font-medium text-foreground select-none">
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// ─── Node types (outside component to keep stable reference) ───────────────────
const nodeTypes = {
  circle: CircleNode,
}

const initialNodes = [
  {
    id: "n1",
    type: "circle",
    position: { x: 0, y: 0 },
    data: { label: "生まれ" },
  },
  {
    id: "n2",
    type: "circle",
    position: { x: 0, y: -100 },
    data: { label: "小学" },
  },
  {
    id: "n3",
    type: "circle",
    position: { x: 0, y: -200 },
    data: { label: "中学" },
  },
]

const initialEdges = [
  { id: "n1-n2", source: "n1", target: "n2" },
  { id: "n2-n3", source: "n2", target: "n3" },
]

export default function Graph() {
  return (
    <ReactFlow
      nodes={initialNodes}
      edges={initialEdges}
      nodeTypes={nodeTypes}
      fitView
      className="fixed top-0"
    >
      <Controls position="top-right" />
      <Background color="#ccc" variant={BackgroundVariant.Dots} />
    </ReactFlow>
  )
}
