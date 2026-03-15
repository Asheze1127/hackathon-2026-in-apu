"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  applyLayout,
  baseEdges,
  baseRawNodes,
  CURRENT_NODE_ID,
} from "@/lib/graph"
import { fetchPossiblePaths } from "@/lib/graph-api"
import { toNode3D, toEdge3D, type Node3D, type Edge3D } from "@/lib/graph-3d"
import type { Edge, Node } from "@xyflow/react"

export function use3DGraphState() {
  const [nodes, setNodes] = useState<Node3D[]>(() => {
    const laid = applyLayout(baseRawNodes, baseEdges)
    return laid.map((n) => toNode3D(n))
  })
  const [edges, setEdges] = useState<Edge3D[]>(() =>
    baseEdges.map((e) => toEdge3D(e))
  )
  const hoveredNodeId = useRef<string | null>(null)
  const futureData = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

  const showFuturePaths = useCallback(() => {
    const data = futureData.current
    if (!data || data.nodes.length === 0) return
    const allNodes = [...baseRawNodes, ...data.nodes]
    const allEdges = [...baseEdges, ...data.edges]
    const laid = applyLayout(allNodes, allEdges)
    const futureIds = new Set(data.nodes.map((n) => n.id))
    setNodes(laid.map((n) => toNode3D(n, futureIds.has(n.id))))
    const futureEdgeIds = new Set(data.edges.map((e) => e.id))
    setEdges(allEdges.map((e) => toEdge3D(e, futureEdgeIds.has(e.id))))
  }, [])

  const hideFuturePaths = useCallback(() => {
    const laid = applyLayout(baseRawNodes, baseEdges)
    setNodes(laid.map((n) => toNode3D(n)))
    setEdges(baseEdges.map((e) => toEdge3D(e)))
  }, [])

  const handleHover = useCallback(
    (id: string | null) => {
      if (id === CURRENT_NODE_ID && hoveredNodeId.current !== CURRENT_NODE_ID) {
        hoveredNodeId.current = id
        showFuturePaths()
      } else if (id === null && hoveredNodeId.current === CURRENT_NODE_ID) {
        hoveredNodeId.current = null
        hideFuturePaths()
      }
    },
    [showFuturePaths, hideFuturePaths]
  )

  useEffect(() => {
    fetchPossiblePaths(CURRENT_NODE_ID).then((d) => {
      futureData.current = d
    })
  }, [])

  return { nodes, edges, handleHover }
}
