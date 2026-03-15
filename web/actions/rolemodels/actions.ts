"use server"

import * as z from "zod"

import { createChatCompletion } from "@/actions/ai/actions"
import {
  AppActionError,
  type ActionResponse,
  mapUnknownToErrorResponse,
} from "@/lib/errors"
import prisma from "@/lib/prisma/client"
import { createClient } from "@/lib/supabase/server"
import { listUserTreeNodes, selectCurrentTreeNodeId } from "@/lib/user-tree"

const saveRoleModelSelectionSchema = z.object({
  isPrimary: z.boolean().default(true),
  targetUserId: z.string().uuid(),
})

const deleteRoleModelSelectionSchema = z.object({
  targetUserId: z.string().uuid(),
})

const generateRoleModelAdviceSchema = z.object({
  targetUserId: z.string().uuid(),
})

const roleModelAdviceSchema = z.object({
  currentPosition: z.string().trim().min(1),
  nextStep: z.string().trim().min(1),
  pitfalls: z.array(z.string().trim().min(1)).min(1).max(4),
  preparation: z.array(z.string().trim().min(1)).min(1).max(4),
})

type SaveRoleModelSelectionInput = z.input<typeof saveRoleModelSelectionSchema>
type DeleteRoleModelSelectionInput = z.input<
  typeof deleteRoleModelSelectionSchema
>
type GenerateRoleModelAdviceInput = z.input<
  typeof generateRoleModelAdviceSchema
>

export interface RoleModelSelectionResult {
  createdAt: string
  id: string
  isPrimary: boolean
  targetUserId: string
  updatedAt: string
}

export interface SaveRoleModelSelectionResponsePayload {
  selection: RoleModelSelectionResult
}

export interface DeleteRoleModelSelectionResponsePayload {
  deletedTargetUserId: string
}

export interface RoleModelAdviceResult {
  currentPosition: string
  nextStep: string
  pitfalls: string[]
  preparation: string[]
  roleModelName: string
}

export interface GenerateRoleModelAdviceResponsePayload {
  advice: RoleModelAdviceResult
}

export type SaveRoleModelSelectionResponse =
  ActionResponse<SaveRoleModelSelectionResponsePayload>
export type DeleteRoleModelSelectionResponse =
  ActionResponse<DeleteRoleModelSelectionResponsePayload>
export type GenerateRoleModelAdviceResponse =
  ActionResponse<GenerateRoleModelAdviceResponsePayload>

interface RoleModelSelectionLookupRow {
  createdAt: Date | string
  id: string
  isPrimary: boolean
  roleModelUserId: string
  updatedAt: Date | string
}

function extractJsonText(content: string): string {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")

  if (start >= 0 && end > start) {
    return content.slice(start, end + 1)
  }

  return content.trim()
}

function trimOrFallback(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function toISOString(value: Date | string) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString()
}

function collectTagIds(input: unknown) {
  if (!Array.isArray(input)) {
    return []
  }

  return input.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  )
}

function buildTimelineContext(
  nodes: Awaited<ReturnType<typeof listUserTreeNodes>>
) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return [...nodes]
    .sort((left, right) => {
      if (left.depth !== right.depth) {
        return left.depth - right.depth
      }

      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      )
    })
    .map((node, index) => {
      const parentNode = node.parentId ? nodeById.get(node.parentId) : null

      return {
        concreteAnswer: node.concreteAnswer,
        createdAt: node.createdAt,
        depth: node.depth,
        order: index + 1,
        parentAnswer: parentNode?.concreteAnswer ?? null,
        reason: node.abstractAnswer?.trim() || null,
      }
    })
}

async function getAuthenticatedUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AppActionError("UNAUTHORIZED", "認証が必要です。")
  }

  return user.id
}

async function ensureSelectableRoleModel(
  currentUserId: string,
  targetUserId: string
) {
  if (currentUserId === targetUserId) {
    throw new AppActionError(
      "VALIDATION_ERROR",
      "自分自身をロールモデルに設定することはできません。"
    )
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      displayName: true,
      id: true,
      onboarded: true,
    },
  })

  if (!profile?.onboarded) {
    throw new AppActionError(
      "PROFILE_NOT_FOUND",
      "ロールモデルプロフィールが見つかりません。"
    )
  }

  return profile
}

async function getSavedRoleModelSelection(
  userId: string,
  targetUserId: string
) {
  const rows = await prisma.$queryRaw<Array<RoleModelSelectionLookupRow>>`
    select
      id,
      role_model_user_id as "roleModelUserId",
      is_primary as "isPrimary",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from role_model_selections
    where user_id = cast(${userId} as uuid)
      and role_model_user_id = cast(${targetUserId} as uuid)
    limit 1
  `

  return rows[0] ?? null
}

export async function saveRoleModelSelection(
  rawInput: SaveRoleModelSelectionInput
): Promise<SaveRoleModelSelectionResponse> {
  try {
    const userId = await getAuthenticatedUserId()
    const input = saveRoleModelSelectionSchema.parse(rawInput)

    await ensureSelectableRoleModel(userId, input.targetUserId)

    const selection = await prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.$executeRaw`
          update role_model_selections
          set
            is_primary = false,
            updated_at = now()
          where user_id = cast(${userId} as uuid)
            and is_primary = true
        `
      }

      const rows = await tx.$queryRaw<Array<RoleModelSelectionLookupRow>>`
        insert into role_model_selections (
          user_id,
          role_model_user_id,
          is_primary
        )
        values (
          cast(${userId} as uuid),
          cast(${input.targetUserId} as uuid),
          ${input.isPrimary}
        )
        on conflict (user_id, role_model_user_id)
        do update set
          is_primary = excluded.is_primary,
          updated_at = now()
        returning
          id,
          role_model_user_id as "roleModelUserId",
          is_primary as "isPrimary",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `

      const savedSelection = rows[0]
      if (!savedSelection) {
        throw new AppActionError(
          "INTERNAL_ERROR",
          "ロールモデルの保存結果を取得できませんでした。"
        )
      }

      return savedSelection
    })

    return {
      selection: {
        createdAt: toISOString(selection.createdAt),
        id: selection.id,
        isPrimary: selection.isPrimary,
        targetUserId: selection.roleModelUserId,
        updatedAt: toISOString(selection.updatedAt),
      },
    }
  } catch (error) {
    return mapUnknownToErrorResponse(
      error,
      "ロールモデルの保存に失敗しました。"
    )
  }
}

export async function deleteRoleModelSelection(
  rawInput: DeleteRoleModelSelectionInput
): Promise<DeleteRoleModelSelectionResponse> {
  try {
    const userId = await getAuthenticatedUserId()
    const input = deleteRoleModelSelectionSchema.parse(rawInput)

    const deletedCount = await prisma.$executeRaw`
      delete from role_model_selections
      where user_id = cast(${userId} as uuid)
        and role_model_user_id = cast(${input.targetUserId} as uuid)
    `

    if (deletedCount === 0) {
      throw new AppActionError(
        "ROLE_MODEL_SELECTION_NOT_FOUND",
        "保存済みのロールモデルが見つかりません。"
      )
    }

    return {
      deletedTargetUserId: input.targetUserId,
    }
  } catch (error) {
    return mapUnknownToErrorResponse(
      error,
      "ロールモデルの解除に失敗しました。"
    )
  }
}

export async function generateRoleModelAdvice(
  rawInput: GenerateRoleModelAdviceInput
): Promise<GenerateRoleModelAdviceResponse> {
  try {
    const userId = await getAuthenticatedUserId()
    const input = generateRoleModelAdviceSchema.parse(rawInput)

    const [selection, ownProfile, targetProfile] = await Promise.all([
      getSavedRoleModelSelection(userId, input.targetUserId),
      prisma.profile.findUnique({
        where: {
          id: userId,
        },
        select: {
          currentOccupation: true,
          displayName: true,
          goal: true,
          id: true,
          location: true,
        },
      }),
      prisma.profile.findUnique({
        where: {
          id: input.targetUserId,
        },
        select: {
          age: true,
          currentOccupation: true,
          displayName: true,
          goal: true,
          id: true,
          location: true,
          onboarded: true,
        },
      }),
    ])

    if (!selection) {
      throw new AppActionError(
        "ROLE_MODEL_SELECTION_NOT_FOUND",
        "先にこのユーザーをロールモデルとして保存してください。"
      )
    }

    if (!ownProfile) {
      throw new AppActionError(
        "PROFILE_NOT_FOUND",
        "あなたのプロフィールが見つかりません。"
      )
    }

    if (!targetProfile?.onboarded) {
      throw new AppActionError(
        "PROFILE_NOT_FOUND",
        "ロールモデルプロフィールが見つかりません。"
      )
    }

    const [myTreeNodes, roleModelTreeNodes] = await Promise.all([
      listUserTreeNodes(userId),
      listUserTreeNodes(input.targetUserId),
    ])

    const myCurrentNodeId = selectCurrentTreeNodeId(myTreeNodes)
    const roleModelCurrentNodeId = selectCurrentTreeNodeId(roleModelTreeNodes)
    const myCurrentNode =
      myTreeNodes.find((node) => node.id === myCurrentNodeId) ?? null
    const roleModelCurrentNode =
      roleModelTreeNodes.find((node) => node.id === roleModelCurrentNodeId) ??
      null

    const myCurrentTagIds = new Set([
      ...collectTagIds(myCurrentNode?.realTags),
      ...collectTagIds(myCurrentNode?.emotionalTags),
    ])
    const roleModelCurrentTagIds = new Set([
      ...collectTagIds(roleModelCurrentNode?.realTags),
      ...collectTagIds(roleModelCurrentNode?.emotionalTags),
    ])
    const overlapTagIds = [...myCurrentTagIds].filter((tagId) =>
      roleModelCurrentTagIds.has(tagId)
    )

    const tagRows = overlapTagIds.length
      ? await prisma.tag.findMany({
          where: {
            id: {
              in: overlapTagIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : []

    const overlapTagNames = tagRows
      .map((tag) => tag.name.trim())
      .filter(Boolean)
    const roleModelName = trimOrFallback(
      targetProfile.displayName,
      "名前未設定"
    )

    const completion = await createChatCompletion({
      provider: "campus",
      messages: [
        {
          role: "system",
          content: [
            "You are a practical career advisor for a Japanese decision-tree app.",
            "Always reply in Japanese.",
            "Compare the user's current state and the selected role model's path.",
            "Base statements on the provided data first.",
            "If you need to infer, explicitly say it is an inference.",
            "Return JSON only.",
            'The JSON schema is {"currentPosition":"string","nextStep":"string","preparation":["string"],"pitfalls":["string"]}.',
            "Keep each preparation and pitfalls item short and actionable.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              selection: {
                isPrimary: selection.isPrimary,
              },
              self: {
                currentNode: myCurrentNode?.concreteAnswer ?? "未登録",
                displayName: trimOrFallback(
                  ownProfile.displayName,
                  "名前未設定"
                ),
                goal: trimOrFallback(ownProfile.goal, "未設定"),
                latestReason: myCurrentNode?.abstractAnswer ?? null,
                location: trimOrFallback(ownProfile.location, "未設定"),
                occupation: trimOrFallback(
                  ownProfile.currentOccupation,
                  "未設定"
                ),
                timeline: buildTimelineContext(myTreeNodes),
              },
              roleModel: {
                age:
                  targetProfile.age == null ? null : `${targetProfile.age}歳`,
                currentNode: roleModelCurrentNode?.concreteAnswer ?? "未登録",
                displayName: roleModelName,
                goal: trimOrFallback(targetProfile.goal, "未設定"),
                latestReason: roleModelCurrentNode?.abstractAnswer ?? null,
                location: trimOrFallback(targetProfile.location, "未設定"),
                occupation: trimOrFallback(
                  targetProfile.currentOccupation,
                  "未設定"
                ),
                timeline: buildTimelineContext(roleModelTreeNodes),
              },
              sharedSignals: {
                overlapTagNames,
              },
              task: [
                "現在の自分の位置づけを短く説明する",
                "次に取りやすい一手を1段落で提案する",
                "準備しておくことを2-3個出す",
                "避けたい罠を2-3個出す",
              ],
            },
            null,
            2
          ),
        },
      ],
      max_tokens: 700,
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message.content?.trim()
    if (!content) {
      throw new AppActionError(
        "INTERNAL_ERROR",
        "AIから比較アドバイスを取得できませんでした。"
      )
    }

    const parsedAdvice = roleModelAdviceSchema.parse(
      JSON.parse(extractJsonText(content))
    )

    return {
      advice: {
        currentPosition: parsedAdvice.currentPosition,
        nextStep: parsedAdvice.nextStep,
        pitfalls: parsedAdvice.pitfalls,
        preparation: parsedAdvice.preparation,
        roleModelName,
      },
    }
  } catch (error) {
    return mapUnknownToErrorResponse(
      error,
      "ロールモデル比較のAI助言に失敗しました。時間をおいて再度お試しください。"
    )
  }
}
