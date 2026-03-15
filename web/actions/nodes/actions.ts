"use server"

import * as z from "zod"
import {
  AppActionError,
  type ActionResponse,
  mapUnknownToErrorResponse,
} from "@/lib/errors"
import prisma from "@/lib/prisma/client"
import { createClient } from "@/lib/supabase/server"

const MAX_ANSWER_LENGTH = 500
const DEFAULT_ABSTRACT_QUESTION = "なぜそれをしていますか？"

const addNodeSchema = z.object({
  parentId: z.string().uuid().nullable(),
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

    if (input.parentId) {
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

    const node = await prisma.$transaction(async (tx) => {
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

      return tx.node.create({
        data: {
          userId: user.id,
          parentId: input.parentId ?? null,
          abstractQuestionId: abstractQuestion.id,
          concreteAnswer: input.concreteAnswer,
          abstractAnswer: input.abstractAnswer ?? null,
        } as never,
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
    return mapUnknownToErrorResponse(error, "ノード処理に失敗しました。")
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

    const toResultNode = (
      node: {
        id: string
        parentId: string | null
        concreteAnswer: string
        abstractAnswer: string | null
        realTags: unknown
        emotionalTags: unknown
        createdAt: Date
      },
      depth: number
    ): UserTreeNodeResult => ({
      id: node.id,
      parentId: node.parentId,
      concreteAnswer: node.concreteAnswer,
      abstractAnswer: node.abstractAnswer,
      realTags: node.realTags as string[],
      emotionalTags: node.emotionalTags as string[],
      createdAt: node.createdAt.toISOString(),
      depth,
    })

    const selection = {
      id: true,
      parentId: true,
      concreteAnswer: true,
      abstractAnswer: true,
      realTags: true,
      emotionalTags: true,
      createdAt: true,
    } as const

    const nodes: UserTreeNodeResult[] = []

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
        throw new AppActionError(
          "NODE_NOT_FOUND",
          "起点ノードが見つかりません。"
        )
      }

      if (rootNode.userId !== user.id) {
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
          userId: user.id,
          parentId: null,
        },
        orderBy: { createdAt: "asc" },
        select: selection,
      })
    }

    let depth = 0

    while (currentLevel.length > 0) {
      nodes.push(...currentLevel.map((node) => toResultNode(node, depth)))

      const parentIds: string[] = currentLevel.map((node) => node.id)

      currentLevel = await prisma.node.findMany({
        where: {
          userId: user.id,
          parentId: { in: parentIds },
        },
        orderBy: { createdAt: "asc" },
        select: selection,
      })

      depth += 1
    }

    return { nodes }
  } catch (error) {
    return mapUnknownToErrorResponse(error, "ノード処理に失敗しました。")
  }
}
