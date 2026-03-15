import "server-only"

import { type Edge } from "@xyflow/react"

import prisma from "@/lib/prisma/client"
import {
  buildGraphTreeData,
  buildLatestBranch,
  buildTimelineItems,
  listUserTreeNodes,
} from "@/lib/user-tree"

function getAvatarText(displayName: string | null, fallbackId: string) {
  const trimmedName = displayName?.trim()
  if (trimmedName) {
    return trimmedName[0] ?? fallbackId.slice(0, 1).toUpperCase()
  }

  return fallbackId.slice(0, 1).toUpperCase()
}

function normalizeTags(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()))
}

export interface RoleModelSummary {
  avatarText: string
  branch: string
  id: string
  name: string
  role: string
  tags: string[]
}

export interface RoleModelDetail {
  age: string
  aiChatHref: string
  avatarText: string
  branchFrom: string
  branchTo: string
  dmHref: string
  location: string
  name: string
  profileEdges: Edge[]
  profileNodes: ReturnType<typeof buildGraphTreeData>["nodes"]
  role: string
  timelineItems: ReturnType<typeof buildTimelineItems>
  years: string
}

export async function listRoleModels(currentUserId: string) {
  const profiles = await prisma.profile.findMany({
    where: {
      id: { not: currentUserId },
      onboarded: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      displayName: true,
      currentOccupation: true,
      location: true,
      goal: true,
      nodes: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          parentId: true,
          concreteAnswer: true,
          createdAt: true,
        },
      },
    },
  })

  return profiles.map<RoleModelSummary>((profile) => {
    const latestNode = profile.nodes[profile.nodes.length - 1] ?? null
    const parentNode =
      latestNode?.parentId != null
        ? (profile.nodes.find((node) => node.id === latestNode.parentId) ??
          null)
        : null

    return {
      avatarText: getAvatarText(profile.displayName, profile.id),
      branch: latestNode
        ? `${parentNode?.concreteAnswer ?? "最初の分岐"} → ${latestNode.concreteAnswer}`
        : "まだ分岐は登録されていません",
      id: profile.id,
      name: profile.displayName?.trim() || "名前未設定",
      role: profile.currentOccupation?.trim() || "活動内容を設定中",
      tags: normalizeTags([
        profile.goal,
        profile.location,
        profile.currentOccupation,
      ]).slice(0, 3),
    }
  })
}

export async function getRoleModelDetail(
  targetUserId: string
): Promise<RoleModelDetail | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      displayName: true,
      currentOccupation: true,
      age: true,
      location: true,
      onboarded: true,
    },
  })

  if (!profile || !profile.onboarded) {
    return null
  }

  const treeNodes = await listUserTreeNodes(targetUserId)
  const graphData = buildGraphTreeData(treeNodes)
  const latestBranch = buildLatestBranch(treeNodes)

  return {
    age: profile.age == null ? "年齢未設定" : `${profile.age}歳`,
    aiChatHref: `/chat/model/${profile.id}`,
    avatarText: getAvatarText(profile.displayName, profile.id),
    branchFrom: latestBranch.from,
    branchTo: latestBranch.to,
    dmHref: `/chat/user/${profile.id}`,
    location: profile.location?.trim() || "住んでいるところ未設定",
    name: profile.displayName?.trim() || "名前未設定",
    profileEdges: graphData.edges,
    profileNodes: graphData.nodes,
    role: profile.currentOccupation?.trim() || "活動内容を設定中",
    timelineItems: buildTimelineItems(treeNodes),
    years:
      treeNodes.length === 0
        ? "ノード未登録"
        : `意思決定ノード ${treeNodes.length}件`,
  }
}
