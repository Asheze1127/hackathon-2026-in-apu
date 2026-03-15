import "server-only"

import { type Edge } from "@xyflow/react"

import prisma from "@/lib/prisma/client"
import {
  buildGraphTreeData,
  buildLatestBranch,
  buildTimelineItems,
  listUserTreeNodes,
} from "@/lib/user-tree"

interface RoleModelSelectionLookupRow {
  isPrimary: boolean
  roleModelUserId: string
}

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
  isPrimary: boolean
  isSaved: boolean
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
  isPrimary: boolean
  isSaved: boolean
  profileEdges: Edge[]
  profileNodes: ReturnType<typeof buildGraphTreeData>["nodes"]
  role: string
  timelineItems: ReturnType<typeof buildTimelineItems>
  years: string
}

async function listSavedRoleModelSelections(userId: string) {
  return prisma.$queryRaw<Array<RoleModelSelectionLookupRow>>`
    select
      role_model_user_id as "roleModelUserId",
      is_primary as "isPrimary"
    from role_model_selections
    where user_id = cast(${userId} as uuid)
  `
}

async function getSavedRoleModelSelection(
  userId: string,
  targetUserId: string
) {
  const rows = await prisma.$queryRaw<Array<RoleModelSelectionLookupRow>>`
    select
      role_model_user_id as "roleModelUserId",
      is_primary as "isPrimary"
    from role_model_selections
    where user_id = cast(${userId} as uuid)
      and role_model_user_id = cast(${targetUserId} as uuid)
    limit 1
  `

  return rows[0] ?? null
}

export async function listRoleModels(currentUserId: string) {
  const [profiles, savedSelections] = await Promise.all([
    prisma.profile.findMany({
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
    }),
    listSavedRoleModelSelections(currentUserId),
  ])

  const selectionByUserId = new Map(
    savedSelections.map((selection) => [selection.roleModelUserId, selection])
  )

  return profiles.map<RoleModelSummary>((profile) => {
    const latestNode = profile.nodes[profile.nodes.length - 1] ?? null
    const parentNode =
      latestNode?.parentId != null
        ? (profile.nodes.find((node) => node.id === latestNode.parentId) ??
          null)
        : null
    const savedSelection = selectionByUserId.get(profile.id)

    return {
      avatarText: getAvatarText(profile.displayName, profile.id),
      branch: latestNode
        ? `${parentNode?.concreteAnswer ?? "最初の分岐"} → ${latestNode.concreteAnswer}`
        : "まだ分岐は登録されていません",
      id: profile.id,
      isPrimary: savedSelection?.isPrimary ?? false,
      isSaved: Boolean(savedSelection),
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
  targetUserId: string,
  currentUserId: string
): Promise<RoleModelDetail | null> {
  const [profile, savedSelection] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        displayName: true,
        currentOccupation: true,
        age: true,
        location: true,
        onboarded: true,
      },
    }),
    getSavedRoleModelSelection(currentUserId, targetUserId),
  ])

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
    isPrimary: savedSelection?.isPrimary ?? false,
    isSaved: Boolean(savedSelection),
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
