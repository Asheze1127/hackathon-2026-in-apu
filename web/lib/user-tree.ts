import "server-only"

import { Calendar, Flag, MapPin, RefreshCcw, Star } from "lucide-react"
import type { Edge } from "@xyflow/react"

import type { CircleNode } from "@/components/circle-node"
import { AppActionError } from "@/lib/errors"
import prisma from "@/lib/prisma/client"
import { applyLayout } from "@/lib/graph"

export interface UserTreeNodeData {
  id: string
  parentId: string | null
  concreteAnswer: string
  abstractAnswer: string | null
  realTags: string[]
  emotionalTags: string[]
  createdAt: string
  depth: number
}

export interface GraphTreeData {
  currentNodeId: string | null
  edges: Edge[]
  nodes: CircleNode[]
}

export async function listUserTreeNodes(
  userId: string,
  rootId?: string
): Promise<UserTreeNodeData[]> {
  const selection = {
    id: true,
    parentId: true,
    concreteAnswer: true,
    abstractAnswer: true,
    realTags: true,
    emotionalTags: true,
    createdAt: true,
  } as const

  const nodes: UserTreeNodeData[] = []

  let currentLevel:
    | Array<{
        id: string
        parentId: string | null
        concreteAnswer: string
        abstractAnswer: string | null
        realTags: unknown
        emotionalTags: unknown
        createdAt: Date
      }>
    | undefined

  if (rootId) {
    const rootNode = await prisma.node.findUnique({
      where: { id: rootId },
      select: {
        userId: true,
        ...selection,
      },
    })

    if (!rootNode) {
      throw new AppActionError("NODE_NOT_FOUND", "起点ノードが見つかりません。")
    }

    if (rootNode.userId !== userId) {
      throw new AppActionError(
        "FORBIDDEN",
        "このノードへの操作は許可されていません。"
      )
    }

    currentLevel = [
      {
        id: rootNode.id,
        parentId: rootNode.parentId,
        concreteAnswer: rootNode.concreteAnswer,
        abstractAnswer: rootNode.abstractAnswer,
        realTags: rootNode.realTags,
        emotionalTags: rootNode.emotionalTags,
        createdAt: rootNode.createdAt,
      },
    ]
  } else {
    currentLevel = await prisma.node.findMany({
      where: {
        userId,
        parentId: null,
      },
      orderBy: { createdAt: "asc" },
      select: selection,
    })
  }

  let depth = 0

  while (currentLevel.length > 0) {
    nodes.push(
      ...currentLevel.map((node) => ({
        id: node.id,
        parentId: node.parentId,
        concreteAnswer: node.concreteAnswer,
        abstractAnswer: node.abstractAnswer,
        realTags: node.realTags as string[],
        emotionalTags: node.emotionalTags as string[],
        createdAt: node.createdAt.toISOString(),
        depth,
      }))
    )

    const parentIds: string[] = currentLevel.map((node) => node.id)

    currentLevel = await prisma.node.findMany({
      where: {
        userId,
        parentId: { in: parentIds },
      },
      orderBy: { createdAt: "asc" },
      select: selection,
    })

    depth += 1
  }

  return nodes
}

export function selectCurrentTreeNodeId(nodes: UserTreeNodeData[]) {
  return (
    [...nodes].sort((left, right) => {
      if (right.depth !== left.depth) {
        return right.depth - left.depth
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
    })[0]?.id ?? null
  )
}

export function buildGraphTreeData(nodes: UserTreeNodeData[]): GraphTreeData {
  const currentNodeId = selectCurrentTreeNodeId(nodes)

  const rawNodes: CircleNode[] = nodes.map((node) => ({
    id: node.id,
    type: "circle",
    position: { x: 0, y: 0 },
    data: {
      label: node.concreteAnswer,
      isCurrent: currentNodeId !== null && node.id === currentNodeId,
    },
  }))

  const edges: Edge[] = nodes
    .filter((node) => node.parentId !== null)
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId!,
      target: node.id,
    }))

  return {
    currentNodeId,
    edges,
    nodes: applyLayout(rawNodes, edges, { rankdir: "BT" }) as CircleNode[],
  }
}

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value))
}

export function buildTimelineItems(nodes: UserTreeNodeData[]) {
  const parentById = new Map(nodes.map((node) => [node.id, node]))
  const orderedNodes = [...nodes].sort((left, right) => {
    if (right.depth !== left.depth) {
      return right.depth - left.depth
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  })

  return orderedNodes.map((node, index) => {
    const isCurrent = index === 0
    const isFirstStep = index === orderedNodes.length - 1
    const parent = node.parentId ? parentById.get(node.parentId) : null

    return {
      Icon: isCurrent ? Star : isFirstStep ? Flag : RefreshCcw,
      dotClass: isCurrent
        ? "bg-amber-50 border-2 border-amber-300"
        : isFirstStep
          ? "bg-slate-800"
          : "bg-primary",
      dotIconColor: isCurrent ? "#d97706" : "white",
      date: isCurrent ? "現在" : formatTimelineDate(node.createdAt),
      dateClass: isCurrent
        ? "bg-amber-50 text-amber-600"
        : "bg-indigo-50 text-indigo-500",
      DateIcon: isCurrent ? MapPin : Calendar,
      title: node.concreteAnswer,
      body:
        node.abstractAnswer?.trim() ||
        "この時点の判断理由はまだ登録されていません。",
      choice: parent ? `${parent.concreteAnswer} からこの道を選択` : null,
      choiceClass: "bg-indigo-50",
      choiceDotClass: "bg-indigo-500",
      choiceTextClass: "text-indigo-600",
      cardClass: isCurrent
        ? "bg-amber-50 border border-amber-200 ring-0"
        : "bg-white",
      hasLine: index < orderedNodes.length - 1,
    }
  })
}

export function buildLatestBranch(nodes: UserTreeNodeData[]) {
  const currentNodeId = selectCurrentTreeNodeId(nodes)
  const currentNode = nodes.find((node) => node.id === currentNodeId) ?? null
  const parentNode = currentNode?.parentId
    ? (nodes.find((node) => node.id === currentNode.parentId) ?? null)
    : null

  return {
    from: parentNode?.concreteAnswer ?? "最初の分岐",
    to: currentNode?.concreteAnswer ?? "まだノードがありません",
  }
}
