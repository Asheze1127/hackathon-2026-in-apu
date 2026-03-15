"use server"

import * as z from "zod"
import {
  AppActionError,
  type ActionResponse,
  mapUnknownToErrorResponse,
} from "@/lib/errors"
import { classifyNodeTags } from "@/lib/nodes/tagging"
import prisma from "@/lib/prisma/client"
import { createClient } from "@/lib/supabase/server"
import { listUserTreeNodes } from "@/lib/user-tree"

const MAX_ANSWER_LENGTH = 500
const DEFAULT_ABSTRACT_QUESTION = "なぜそれをしていますか？"
const MAX_FUTURE_SUGGESTION_DEPTH = 3
const MAX_FUTURE_SUGGESTION_BRANCHES = 5
const mutateModeSchema = z.enum(["append", "insert-between", "prepend-root"])

const addNodeSchema = z.object({
  mutateMode: mutateModeSchema,
  parentId: z.string().uuid().nullable(),
  targetChildId: z.string().uuid().optional(),
  concreteAnswer: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
  abstractAnswer: z.string().trim().max(MAX_ANSWER_LENGTH).optional(),
})

export type AddNodeInput = z.input<typeof addNodeSchema>

export interface NodeResult {
  id: string
  parentId: string | null
  concreteAnswer: string
  abstractAnswer: string | null
  realTags: string[]
  emotionalTags: string[]
  createdAt: string
}

export interface AddNodeResult {
  node: NodeResult
}

export type AddNodeResponse = ActionResponse<AddNodeResult>

const updateNodeSchema = z
  .object({
    nodeId: z.string().uuid(),
    parentId: z.string().uuid().nullable().optional(),
    concreteAnswer: z.string().trim().min(1).max(MAX_ANSWER_LENGTH).optional(),
    abstractAnswer: z
      .string()
      .trim()
      .max(MAX_ANSWER_LENGTH)
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      value.parentId !== undefined ||
      value.concreteAnswer !== undefined ||
      value.abstractAnswer !== undefined,
    {
      message: "At least one field must be provided",
    }
  )

export type UpdateNodeInput = z.input<typeof updateNodeSchema>

export interface UpdateNodeResult {
  node: NodeResult
}

export type UpdateNodeResponse = ActionResponse<UpdateNodeResult>

const deleteNodeSchema = z.object({
  nodeId: z.string().uuid(),
})

export type DeleteNodeInput = z.input<typeof deleteNodeSchema>

export interface DeleteNodeResult {
  deletedNodeId: string
}

export type DeleteNodeResponse = ActionResponse<DeleteNodeResult>

const getUserTreeSchema = z.object({
  rootId: z.string().uuid().optional(),
})

export type GetUserTreeInput = z.input<typeof getUserTreeSchema>

export interface UserTreeNodeResult extends NodeResult {
  depth: number
}

export interface GetUserTreeResult {
  nodes: UserTreeNodeResult[]
}

export type GetUserTreeResponse = ActionResponse<GetUserTreeResult>

const getFutureSuggestionsSchema = z.object({
  nodeId: z.string().uuid(),
})

export type GetFutureSuggestionsInput = z.input<
  typeof getFutureSuggestionsSchema
>

export interface FutureSuggestionResult {
  id: string
  label: string
  steps: Array<{
    id: string
    label: string
  }>
  matchedDisplayName: string
  matchedNodeLabel: string
  matchedOccupation: string | null
  overlapTagNames: string[]
  profileHref: string
  supportingExamples: number
}

export interface GetFutureSuggestionsResult {
  nodeId: string
  nodeLabel: string
  selectedTagNames: string[]
  suggestions: FutureSuggestionResult[]
}

export type GetFutureSuggestionsResponse =
  ActionResponse<GetFutureSuggestionsResult>

function normalizeTagIds(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  )
}

type SuggestionTreeNode = {
  id: string
  concreteAnswer: string
  children?: SuggestionTreeNode[]
}

function collectSuggestionPaths(
  nodes: SuggestionTreeNode[],
  maxDepth: number,
  prefix: Array<{ id: string; label: string }> = []
): Array<Array<{ id: string; label: string }>> {
  if (nodes.length === 0 || maxDepth <= 0) {
    return []
  }

  const paths: Array<Array<{ id: string; label: string }>> = []

  for (const node of nodes) {
    const label = node.concreteAnswer.trim()
    if (!label) {
      continue
    }

    const nextPath = [...prefix, { id: node.id, label }]
    const childPaths = collectSuggestionPaths(
      node.children ?? [],
      maxDepth - 1,
      nextPath
    )

    if (childPaths.length === 0) {
      paths.push(nextPath)
      continue
    }

    paths.push(...childPaths)
  }

  return paths
}

async function validateNoCircularReference(
  userId: string,
  nodeId: string,
  nextParentId: string | null
) {
  if (!nextParentId) {
    return
  }

  if (nodeId === nextParentId) {
    throw new AppActionError(
      "CIRCULAR_REFERENCE",
      "自分自身を親に指定できません。"
    )
  }

  let currentParentIds: string[] = [nodeId]

  while (currentParentIds.length > 0) {
    const children = await prisma.node.findMany({
      where: {
        userId,
        parentId: { in: currentParentIds },
      },
      select: { id: true },
    })

    const childIds = children.map((child) => child.id)
    if (childIds.includes(nextParentId)) {
      throw new AppActionError(
        "CIRCULAR_REFERENCE",
        "子孫ノードを親に指定できません。"
      )
    }

    currentParentIds = childIds
  }
}

/**
 * Server Action: add a new node to the user's decision tree.
 */
export async function addNode(
  rawInput: AddNodeInput
): Promise<AddNodeResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
    }

    const parseResult = addNodeSchema.safeParse(rawInput)
    if (!parseResult.success) {
      throw new AppActionError("VALIDATION_ERROR", "入力値が不正です。")
    }
    const input = parseResult.data
    const tags = await classifyNodeTags({
      concreteAnswer: input.concreteAnswer,
      abstractAnswer: input.abstractAnswer ?? null,
    }).catch((error: unknown) => {
      console.warn("[nodes.addNode] tag classification failed", {
        userId: user.id,
        originalError:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
              }
            : error,
      })

      return {
        realTagIds: [],
        emotionalTagIds: [],
      }
    })

    const createNodeWithQuestion = async (
      tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
      parentId: string | null
    ) => {
      const abstractQuestionDelegate = tx as unknown as {
        abstractQuestion: {
          create: (args: {
            data: { question: string }
            select: { id: true }
          }) => Promise<{ id: string }>
        }
      }

      const abstractQuestion =
        await abstractQuestionDelegate.abstractQuestion.create({
          data: {
            question: DEFAULT_ABSTRACT_QUESTION,
          },
          select: { id: true },
        })

      return await tx.node.create({
        data: {
          userId: user.id,
          parentId,
          abstractQuestionId: abstractQuestion.id,
          concreteAnswer: input.concreteAnswer,
          abstractAnswer: input.abstractAnswer ?? null,
          realTags: tags.realTagIds,
          emotionalTags: tags.emotionalTagIds,
        } as never,
      })
    }
    if (input.mutateMode === "append") {
      if (input.parentId) {
        const parentNode = await prisma.node.findUnique({
          where: { id: input.parentId },
          select: { userId: true },
        })
        if (!parentNode) {
          throw new AppActionError(
            "NODE_NOT_FOUND",
            "親ノードが見つかりません。"
          )
        }
        if (parentNode.userId !== user.id) {
          throw new AppActionError(
            "FORBIDDEN",
            "このノードへの操作は許可されていません。"
          )
        }
      }

      const node = await prisma.$transaction(async (tx) => {
        return await createNodeWithQuestion(tx, input.parentId ?? null)
      })

      return {
        node: {
          id: node.id,
          parentId: node.parentId,
          concreteAnswer: node.concreteAnswer,
          abstractAnswer: node.abstractAnswer,
          realTags: node.realTags as string[],
          emotionalTags: node.emotionalTags as string[],
          createdAt: node.createdAt.toISOString(),
        },
      }
    }

    if (input.mutateMode === "insert-between") {
      if (!input.parentId) {
        throw new AppActionError(
          "VALIDATION_ERROR",
          "insert-between では parentId に挿入先の親ノードIDが必要です。"
        )
      }

      const targetParent = await prisma.node.findUnique({
        where: { id: input.parentId },
        select: { id: true, userId: true },
      })

      if (!targetParent) {
        throw new AppActionError(
          "NODE_NOT_FOUND",
          "挿入先の親ノードが見つかりません。"
        )
      }
      if (targetParent.userId !== user.id) {
        throw new AppActionError(
          "FORBIDDEN",
          "このノードへの操作は許可されていません。"
        )
      }

      const node = await prisma.$transaction(async (tx) => {
        let childIdsToReconnect: string[] = []

        if (input.targetChildId) {
          const targetChild = await tx.node.findFirst({
            where: {
              id: input.targetChildId,
              userId: user.id,
              parentId: targetParent.id,
            },
            select: { id: true },
          })

          if (!targetChild) {
            throw new AppActionError(
              "NODE_NOT_FOUND",
              "差し込み対象の子ノードが見つかりません。"
            )
          }

          childIdsToReconnect = [targetChild.id]
        } else {
          const currentChildren = await tx.node.findMany({
            where: {
              userId: user.id,
              parentId: targetParent.id,
            },
            select: { id: true },
          })

          childIdsToReconnect = currentChildren.map((child) => child.id)
        }

        const insertedNode = await createNodeWithQuestion(tx, targetParent.id)

        if (childIdsToReconnect.length > 0) {
          await tx.node.updateMany({
            where: {
              id: { in: childIdsToReconnect },
            },
            data: { parentId: insertedNode.id },
          })
        }

        return insertedNode
      })

      return {
        node: {
          id: node.id,
          parentId: node.parentId,
          concreteAnswer: node.concreteAnswer,
          abstractAnswer: node.abstractAnswer,
          realTags: node.realTags as string[],
          emotionalTags: node.emotionalTags as string[],
          createdAt: node.createdAt.toISOString(),
        },
      }
    }

    if (input.mutateMode === "prepend-root") {
      if (!input.parentId) {
        throw new AppActionError(
          "VALIDATION_ERROR",
          "prepend-root では parentId に既存ルートノードIDが必要です。"
        )
      }

      const currentRoot = await prisma.node.findUnique({
        where: { id: input.parentId },
        select: { id: true, userId: true, parentId: true },
      })

      if (!currentRoot) {
        throw new AppActionError(
          "NODE_NOT_FOUND",
          "対象ルートノードが見つかりません。"
        )
      }
      if (currentRoot.userId !== user.id) {
        throw new AppActionError(
          "FORBIDDEN",
          "このノードへの操作は許可されていません。"
        )
      }
      if (currentRoot.parentId !== null) {
        throw new AppActionError(
          "VALIDATION_ERROR",
          "prepend-root の対象はルートノードである必要があります。"
        )
      }

      const node = await prisma.$transaction(async (tx) => {
        const insertedRoot = await createNodeWithQuestion(tx, null)

        await tx.node.update({
          where: { id: currentRoot.id },
          data: { parentId: insertedRoot.id },
        })

        return insertedRoot
      })

      return {
        node: {
          id: node.id,
          parentId: node.parentId,
          concreteAnswer: node.concreteAnswer,
          abstractAnswer: node.abstractAnswer,
          realTags: node.realTags as string[],
          emotionalTags: node.emotionalTags as string[],
          createdAt: node.createdAt.toISOString(),
        },
      }
    }

    throw new AppActionError("VALIDATION_ERROR", "mutateMode が不正です。")
  } catch (error) {
    return mapUnknownToErrorResponse(error, "ノード処理に失敗しました。")
  }
}

/**
 * Server Action: update node parent/content.
 * Supports insertion flow by re-parenting an existing node to newly added node.
 */
export async function updateNode(
  rawInput: UpdateNodeInput
): Promise<UpdateNodeResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
    }

    const parseResult = updateNodeSchema.safeParse(rawInput)
    if (!parseResult.success) {
      throw new AppActionError("VALIDATION_ERROR", "入力値が不正です。")
    }

    const input = parseResult.data

    const currentNode = await prisma.node.findUnique({
      where: { id: input.nodeId },
      select: { userId: true, parentId: true },
    })

    if (!currentNode) {
      throw new AppActionError("NODE_NOT_FOUND", "ノードが見つかりません。")
    }

    if (currentNode.userId !== user.id) {
      throw new AppActionError(
        "FORBIDDEN",
        "このノードへの操作は許可されていません。"
      )
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      const parentNode = await prisma.node.findUnique({
        where: { id: input.parentId },
        select: { userId: true },
      })

      if (!parentNode) {
        throw new AppActionError("NODE_NOT_FOUND", "親ノードが見つかりません。")
      }

      if (parentNode.userId !== user.id) {
        throw new AppActionError(
          "FORBIDDEN",
          "このノードへの操作は許可されていません。"
        )
      }
    }

    if (input.parentId !== undefined) {
      await validateNoCircularReference(user.id, input.nodeId, input.parentId)
    }

    const contentUpdate: {
      concreteAnswer?: string
      abstractAnswer?: string | null
    } = {}
    if (input.concreteAnswer !== undefined) {
      contentUpdate.concreteAnswer = input.concreteAnswer
    }
    if (input.abstractAnswer !== undefined) {
      contentUpdate.abstractAnswer = input.abstractAnswer
    }

    // When parentId is not changing, skip reconnection and do a simple update.
    if (input.parentId === undefined) {
      const node = await prisma.node.update({
        where: { id: input.nodeId },
        data: contentUpdate,
      })
      return {
        node: {
          id: node.id,
          parentId: node.parentId,
          concreteAnswer: node.concreteAnswer,
          abstractAnswer: node.abstractAnswer,
          realTags: node.realTags as string[],
          emotionalTags: node.emotionalTags as string[],
          createdAt: node.createdAt.toISOString(),
        },
      }
    }

    // parentId is changing: reconnect surrounding nodes atomically.
    const oldParentId = currentNode.parentId
    const newParentId = input.parentId

    const node = await prisma.$transaction(async (tx) => {
      // X's current child → reconnect to X's old parent (fill the gap X leaves).
      const xChild = await tx.node.findFirst({
        where: { userId: user.id, parentId: input.nodeId },
        select: { id: true },
      })
      if (xChild) {
        await tx.node.update({
          where: { id: xChild.id },
          data: { parentId: oldParentId },
        })
      }

      // New parent's current child (exclude X itself) → reconnect to X (X takes over).
      if (newParentId !== null) {
        const newParentChild = await tx.node.findFirst({
          where: {
            userId: user.id,
            parentId: newParentId,
            NOT: { id: input.nodeId },
          },
          select: { id: true },
        })
        if (newParentChild) {
          await tx.node.update({
            where: { id: newParentChild.id },
            data: { parentId: input.nodeId },
          })
        }
      }

      return await tx.node.update({
        where: { id: input.nodeId },
        data: { parentId: newParentId, ...contentUpdate },
      })
    })

    return {
      node: {
        id: node.id,
        parentId: node.parentId,
        concreteAnswer: node.concreteAnswer,
        abstractAnswer: node.abstractAnswer,
        realTags: node.realTags as string[],
        emotionalTags: node.emotionalTags as string[],
        createdAt: node.createdAt.toISOString(),
      },
    }
  } catch (error) {
    return mapUnknownToErrorResponse(error, "ノード更新に失敗しました。")
  }
}

/**
 * Server Action: delete a node while reconnecting its direct children to its parent.
 * Pattern D in API design.
 */
export async function deleteNode(
  rawInput: DeleteNodeInput
): Promise<DeleteNodeResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
    }

    const parseResult = deleteNodeSchema.safeParse(rawInput)
    if (!parseResult.success) {
      throw new AppActionError("VALIDATION_ERROR", "入力値が不正です。")
    }

    const { nodeId } = parseResult.data

    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        userId: true,
        parentId: true,
      },
    })

    if (!node) {
      throw new AppActionError("NODE_NOT_FOUND", "ノードが見つかりません。")
    }

    if (node.userId !== user.id) {
      throw new AppActionError(
        "FORBIDDEN",
        "このノードへの操作は許可されていません。"
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.node.updateMany({
        where: {
          userId: user.id,
          parentId: node.id,
        },
        data: {
          parentId: node.parentId,
        },
      })

      await tx.node.delete({
        where: { id: node.id },
      })
    })

    return {
      deletedNodeId: node.id,
    }
  } catch (error) {
    return mapUnknownToErrorResponse(error, "ノード削除に失敗しました。")
  }
}

/**
 * Server Action: get authenticated user's tree for AI question generation context.
 * Uses Prisma only (no raw SQL) and returns nodes ordered by depth ASC, createdAt ASC.
 */
export async function getUserTree(
  rawInput: GetUserTreeInput = {}
): Promise<GetUserTreeResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
    }

    const parseResult = getUserTreeSchema.safeParse(rawInput)
    if (!parseResult.success) {
      throw new AppActionError("VALIDATION_ERROR", "入力値が不正です。")
    }

    const { rootId } = parseResult.data
    const nodes = await listUserTreeNodes(user.id, rootId)

    return {
      nodes,
    }
  } catch (error) {
    console.error("[nodes.getUserTree] failed", {
      originalError:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
            }
          : error,
    })

    return mapUnknownToErrorResponse(error, "ノード処理に失敗しました。")
  }
}

/**
 * Server Action: suggest possible future nodes based on partial tag overlap.
 */
export async function getFutureSuggestions(
  rawInput: GetFutureSuggestionsInput
): Promise<GetFutureSuggestionsResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
    }

    const parseResult = getFutureSuggestionsSchema.safeParse(rawInput)
    if (!parseResult.success) {
      throw new AppActionError("VALIDATION_ERROR", "入力値が不正です。")
    }

    const { nodeId } = parseResult.data
    const sourceNode = await prisma.node.findUnique({
      where: { id: nodeId },
      select: {
        concreteAnswer: true,
        emotionalTags: true,
        id: true,
        realTags: true,
        userId: true,
      },
    })

    if (!sourceNode) {
      throw new AppActionError("NODE_NOT_FOUND", "ノードが見つかりません。")
    }

    if (sourceNode.userId !== user.id) {
      throw new AppActionError(
        "FORBIDDEN",
        "このノードへの操作は許可されていません。"
      )
    }

    const selectedRealTagIds = new Set(normalizeTagIds(sourceNode.realTags))
    const selectedEmotionalTagIds = new Set(
      normalizeTagIds(sourceNode.emotionalTags)
    )
    const selectedTagIds = [
      ...new Set([...selectedRealTagIds, ...selectedEmotionalTagIds]),
    ]

    if (selectedTagIds.length === 0) {
      return {
        nodeId: sourceNode.id,
        nodeLabel: sourceNode.concreteAnswer,
        selectedTagNames: [],
        suggestions: [],
      }
    }

    const selectedTags = await prisma.tag.findMany({
      where: {
        id: { in: selectedTagIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const tagNameById = new Map(
      selectedTags.map((tag) => [tag.id, tag.name.trim()] as const)
    )

    const candidateNodes = await prisma.node.findMany({
      where: {
        userId: { not: user.id },
        children: {
          some: {},
        },
        profile: {
          is: {
            onboarded: true,
          },
        },
      },
      select: {
        concreteAnswer: true,
        emotionalTags: true,
        id: true,
        realTags: true,
        profile: {
          select: {
            currentOccupation: true,
            displayName: true,
            id: true,
          },
        },
        children: {
          orderBy: { createdAt: "asc" },
          select: {
            concreteAnswer: true,
            id: true,
            children: {
              orderBy: { createdAt: "asc" },
              select: {
                concreteAnswer: true,
                id: true,
                children: {
                  orderBy: { createdAt: "asc" },
                  select: {
                    concreteAnswer: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const suggestionsByLabel = new Map<
      string,
      FutureSuggestionResult & {
        overlapTagIdSet: Set<string>
        pathLength: number
        score: number
      }
    >()

    for (const candidateNode of candidateNodes) {
      const candidateRealTagIds = normalizeTagIds(candidateNode.realTags)
      const candidateEmotionalTagIds = normalizeTagIds(
        candidateNode.emotionalTags
      )
      const matchedRealTagIds = candidateRealTagIds.filter((tagId) =>
        selectedRealTagIds.has(tagId)
      )
      const matchedEmotionalTagIds = candidateEmotionalTagIds.filter((tagId) =>
        selectedEmotionalTagIds.has(tagId)
      )
      const overlapTagIds = [
        ...new Set([...matchedRealTagIds, ...matchedEmotionalTagIds]),
      ]

      if (overlapTagIds.length === 0 || candidateNode.children.length === 0) {
        continue
      }

      // Prefer factual overlap slightly more than emotional overlap.
      const score = matchedRealTagIds.length * 2 + matchedEmotionalTagIds.length
      const suggestionPaths = collectSuggestionPaths(
        candidateNode.children as SuggestionTreeNode[],
        MAX_FUTURE_SUGGESTION_DEPTH
      )

      for (const path of suggestionPaths) {
        const rootStep = path[0]
        if (!rootStep) {
          continue
        }

        const key = rootStep.label.toLowerCase()
        const currentSuggestion = suggestionsByLabel.get(key)

        if (!currentSuggestion) {
          suggestionsByLabel.set(key, {
            id: rootStep.id,
            label: rootStep.label,
            steps: path,
            matchedDisplayName:
              candidateNode.profile.displayName?.trim() || "名前未設定",
            matchedNodeLabel: candidateNode.concreteAnswer,
            matchedOccupation:
              candidateNode.profile.currentOccupation?.trim() || null,
            overlapTagIdSet: new Set(overlapTagIds),
            overlapTagNames: overlapTagIds
              .map((tagId) => tagNameById.get(tagId))
              .filter((value): value is string => Boolean(value))
              .slice(0, 4),
            profileHref: `/profile/${candidateNode.profile.id}`,
            pathLength: path.length,
            score,
            supportingExamples: 1,
          })
          continue
        }

        currentSuggestion.supportingExamples += 1
        overlapTagIds.forEach((tagId) => {
          currentSuggestion.overlapTagIdSet.add(tagId)
        })

        currentSuggestion.overlapTagNames = [
          ...currentSuggestion.overlapTagIdSet,
        ]
          .map((tagId) => tagNameById.get(tagId))
          .filter((value): value is string => Boolean(value))
          .slice(0, 4)

        if (score > currentSuggestion.score) {
          currentSuggestion.id = rootStep.id
          currentSuggestion.label = rootStep.label
          currentSuggestion.steps = path
          currentSuggestion.matchedDisplayName =
            candidateNode.profile.displayName?.trim() || "名前未設定"
          currentSuggestion.matchedNodeLabel = candidateNode.concreteAnswer
          currentSuggestion.matchedOccupation =
            candidateNode.profile.currentOccupation?.trim() || null
          currentSuggestion.profileHref = `/profile/${candidateNode.profile.id}`
          currentSuggestion.pathLength = path.length
          currentSuggestion.score = score
          continue
        }

        if (
          score === currentSuggestion.score &&
          path.length > currentSuggestion.pathLength
        ) {
          currentSuggestion.id = rootStep.id
          currentSuggestion.label = rootStep.label
          currentSuggestion.steps = path
          currentSuggestion.pathLength = path.length
        }
      }
    }

    const suggestions = [...suggestionsByLabel.values()]
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        if (right.supportingExamples !== left.supportingExamples) {
          return right.supportingExamples - left.supportingExamples
        }

        if (right.pathLength !== left.pathLength) {
          return right.pathLength - left.pathLength
        }

        return left.label.localeCompare(right.label, "ja")
      })
      .slice(0, MAX_FUTURE_SUGGESTION_BRANCHES)
      .map((value) => {
        return {
          id: value.id,
          label: value.label,
          steps: value.steps,
          matchedDisplayName: value.matchedDisplayName,
          matchedNodeLabel: value.matchedNodeLabel,
          matchedOccupation: value.matchedOccupation,
          overlapTagNames: value.overlapTagNames,
          profileHref: value.profileHref,
          supportingExamples: value.supportingExamples,
        }
      })

    return {
      nodeId: sourceNode.id,
      nodeLabel: sourceNode.concreteAnswer,
      selectedTagNames: selectedTagIds
        .map((tagId) => tagNameById.get(tagId))
        .filter((value): value is string => Boolean(value)),
      suggestions,
    }
  } catch (error) {
    return mapUnknownToErrorResponse(error, "未来候補の取得に失敗しました。")
  }
}
