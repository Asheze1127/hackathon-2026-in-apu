import { useCallback, useEffect, useRef } from "react"
import { useEdgesState, useNodesState } from "@xyflow/react"
import type { Edge, Node } from "@xyflow/react"
import { type CircleNodeData } from "@/components/circle-node"
import {
  applyLayout,
  baseEdges,
  baseRawNodes,
  CURRENT_NODE_ID,
  DASHED_EDGE_STYLE,
} from "@/lib/graph"
import { fetchPossiblePaths } from "@/lib/graph-api"

export function useGraphState() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const hoveredNodeId = useRef<string | null>(null)
  const futureData = useRef<Awaited<
    ReturnType<typeof fetchPossiblePaths>
  > | null>(null)
  // Store handler in a ref so node data closures never go stale
  const handleHoverRef = useRef<(id: string | null) => void>(() => {})

  function decorateNode(n: Node, isFuture = false): Node {
    return {
      ...n,
      data: {
        ...n.data,
        isCurrent: n.id === CURRENT_NODE_ID,
        isFuture,
        onHover: (id: string | null) => handleHoverRef.current(id),
      },
    }
  }

  const showFuturePaths = useCallback(() => {
    const data = futureData.current
    if (!data || data.nodes.length === 0) return
    const allNodes = [...baseRawNodes, ...data.nodes]
    const allEdges = [...baseEdges, ...data.edges]
    const laid = applyLayout(allNodes, allEdges)
    const futureIds = new Set(data.nodes.map((n) => n.id))
    setNodes(laid.map((n) => decorateNode(n, futureIds.has(n.id))))
    const futureEdgeIds = new Set(data.edges.map((e) => e.id))
    setEdges(
      allEdges.map((e) =>
        futureEdgeIds.has(e.id) ? { ...e, style: DASHED_EDGE_STYLE } : e
      )
    )
  }, [setNodes, setEdges])

  const hideFuturePaths = useCallback(() => {
    setNodes((nds) =>
      nds
        .filter((n) => !(n.data as CircleNodeData).isFuture)
        .map((n) => ({ ...n, className: undefined }))
    )
    setEdges(baseEdges)
  }, [setNodes, setEdges])

  useEffect(() => {
    handleHoverRef.current = (id: string | null) => {
      if (id === CURRENT_NODE_ID && hoveredNodeId.current !== CURRENT_NODE_ID) {
        hoveredNodeId.current = id
        showFuturePaths()
      } else if (id === null && hoveredNodeId.current === CURRENT_NODE_ID) {
        hoveredNodeId.current = null
        hideFuturePaths()
      }
    }
  }, [showFuturePaths, hideFuturePaths])

  // Build base layout once
  useEffect(() => {
    const laid = applyLayout(baseRawNodes, baseEdges)
    setNodes(laid.map((n) => decorateNode(n)))
    setEdges(baseEdges)
    fetchPossiblePaths(CURRENT_NODE_ID).then((d) => {
      futureData.current = d
    })
  }, [setNodes, setEdges])

  return { nodes, edges, onNodesChange, onEdgesChange }
}
