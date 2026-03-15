import Dagre from "@dagrejs/dagre"
import type { Edge, Node } from "@xyflow/react"

const NODE_W = 80
const NODE_H = 80

export function applyLayout(nodes: Node[], edges: Edge[]) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  Dagre.layout(g)
  return nodes.map((n) => {
    const { x, y } = g.node(n.id)
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } }
  })
}

export const selNode = (id: string, label: string): Node => ({
  id,
  type: "circle",
  position: { x: 0, y: 0 },
  data: { label },
})

export const unselNode = (id: string, label: string): Node => ({
  id,
  type: "circle",
  position: { x: 0, y: 0 },
  data: { label, unselected: true },
})

export const selEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
})

export const unselEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  style: { stroke: "#ccc" },
  markerEnd: { type: "arrowclosed", color: "#ccc" },
})

// ─── Static graph data ────────────────────────────────────────────────────────
export const CURRENT_NODE_ID = "n8a"

export const baseEdges: Edge[] = [
  selEdge("n1", "n2"),
  selEdge("n2", "n3a"),
  unselEdge("n2", "n3b"),
  selEdge("n3a", "n4a"),
  unselEdge("n3a", "n4b"),
  unselEdge("n3a", "n4c"),
  selEdge("n4a", "n5a"),
  unselEdge("n4a", "n5b"),
  unselEdge("n4a", "n5c"),
  unselEdge("n5b", "n6b"),
  selEdge("n5a", "n6a"),
  selEdge("n6a", "n7a"),
  unselEdge("n6a", "n7b"),
  unselEdge("n6a", "n7c"),
  selEdge("n7a", "n8a"),
  unselEdge("n7b", "n8b"),
  unselEdge("n4b", "n9b"),
  unselEdge("n9b", "n9c"),
]

export const baseRawNodes: Node[] = [
  selNode("n1", "生まれ"),
  selNode("n2", "中学卒業"),
  selNode("n3a", "高校進学"),
  unselNode("n3b", "専門学校"),
  selNode("n4a", "大学進学"),
  unselNode("n4b", "高卒就職"),
  unselNode("n4c", "海外留学"),
  selNode("n5a", "大企業就職"),
  unselNode("n5b", "大学院進学"),
  unselNode("n5c", "公務員"),
  unselNode("n6b", "研究職"),
  selNode("n6a", "転職検討"),
  selNode("n7a", "スタートアップ"),
  unselNode("n7b", "外資転職"),
  unselNode("n7c", "社内異動"),
  selNode("n8a", "起業"),
  unselNode("n8b", "マネージャー"),
  unselNode("n9b", "夜間学校"),
  unselNode("n9c", "資格取得"),
]

export const DASHED_EDGE_STYLE = {
  stroke: "#60a5fa",
  strokeDasharray: "6 4",
  strokeWidth: 2,
  animation: "dash-blink 1s ease-in-out infinite",
}
