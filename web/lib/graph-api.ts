import type { Edge, Node } from "@xyflow/react"

// TODO: Replace with a real API call. Signature: (fromNodeId: string) => Promise<{ nodes: Node[]; edges: Edge[] }>
// Returns possible future nodes+edges branching from the given node id.
export async function fetchPossiblePaths(
  fromNodeId: string
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  await new Promise((r) => setTimeout(r, 80)) // simulate latency
  const map: Record<string, { nodes: Node[]; edges: Edge[] }> = {
    n8a: {
      nodes: [
        {
          id: "future-1",
          type: "circle",
          position: { x: 0, y: 0 },
          data: { label: "上場" },
        },
        {
          id: "future-2",
          type: "circle",
          position: { x: 0, y: 0 },
          data: { label: "海外展開" },
        },
        {
          id: "future-3",
          type: "circle",
          position: { x: 0, y: 0 },
          data: { label: "M&A売却" },
        },
        {
          id: "future-4",
          type: "circle",
          position: { x: 0, y: 0 },
          data: { label: "再起業" },
        },
      ],
      edges: [
        { id: "n8a-future-1", source: "n8a", target: "future-1" },
        { id: "n8a-future-2", source: "n8a", target: "future-2" },
        { id: "n8a-future-3", source: "n8a", target: "future-3" },
        { id: "future-1-future-4", source: "future-1", target: "future-4" },
      ],
    },
  }
  return map[fromNodeId] ?? { nodes: [], edges: [] }
}
