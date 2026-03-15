import { useCallback, useEffect, useRef, useState } from "react"
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
import { SHOULD_USE_MOCK_GRAPH_DATA } from "@/lib/graph-config"
import { fetchPossiblePaths } from "@/lib/graph-api"
import type { GraphTreeData } from "@/lib/user-tree"

export function useGraphState(initialGraphData?: GraphTreeData | null) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hoveredNodeId = useRef<string | null>(null)
  const futureData = useRef<Awaited<
    ReturnType<typeof fetchPossiblePaths>
  > | null>(null)
  // Store handler in a ref so node data closures never go stale
  const handleHoverRef = useRef<(id: string | null) => void>(() => {})

  function decorateNode(
    n: Node,
    options?: { currentNodeId?: string | null; isFuture?: boolean }
  ): Node {
    const currentNodeId = options?.currentNodeId ?? null
    const isFuture = options?.isFuture ?? false

    return {
      ...n,
      data: {
        ...n.data,
        isCurrent: currentNodeId !== null && n.id === currentNodeId,
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
    setNodes(
      laid.map((n) =>
        decorateNode(n, {
          currentNodeId: CURRENT_NODE_ID,
          isFuture: futureIds.has(n.id),
        })
      )
    )
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
    if (!SHOULD_USE_MOCK_GRAPH_DATA) {
      handleHoverRef.current = () => {}
      return
    }

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

  useEffect(() => {
    let isActive = true

    async function initializeGraph() {
      setIsLoading(true)
      setErrorMessage(null)

      if (SHOULD_USE_MOCK_GRAPH_DATA) {
        const laid = applyLayout(baseRawNodes, baseEdges)

        if (!isActive) {
          return
        }

        setNodes(
          laid.map((n) =>
            decorateNode(n, {
              currentNodeId: CURRENT_NODE_ID,
            })
          )
        )
        setEdges(baseEdges)
        setIsLoading(false)

        const nextFutureData = await fetchPossiblePaths(CURRENT_NODE_ID)
        if (!isActive) {
          return
        }

        futureData.current = nextFutureData
        return
      }

      if (!initialGraphData) {
        setNodes([])
        setEdges([])
        setIsLoading(false)
        return
      }

      setNodes(
        initialGraphData.nodes.map((node) =>
          decorateNode(node, {
            currentNodeId: initialGraphData.currentNodeId,
          })
        )
      )
      setEdges(initialGraphData.edges)
      setIsLoading(false)
    }

    void initializeGraph()

    return () => {
      isActive = false
    }
  }, [initialGraphData, setNodes, setEdges])

  return {
    edges,
    errorMessage,
    isLoading,
    isUsingMockData: SHOULD_USE_MOCK_GRAPH_DATA,
    nodes,
    onEdgesChange,
    onNodesChange,
  }
}
