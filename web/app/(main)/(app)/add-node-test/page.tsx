"use client"

import { useState, useTransition } from "react"
import {
  addNode,
  deleteNode,
  getUserTree,
  updateNode,
  type AddNodeResponse,
  type DeleteNodeResponse,
  type GetUserTreeResponse,
  type UpdateNodeResponse,
} from "@/actions/nodes/actions"
import type { AddNodeInput } from "@/actions/nodes/actions"
import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function AddNodeTestPage() {
  const [rootId, setRootId] = useState("")
  const [mutateMode, setMutateMode] =
    useState<AddNodeInput["mutateMode"]>("append")
  const [targetNodeId, setTargetNodeId] = useState("")
  const [deleteNodeId, setDeleteNodeId] = useState("")
  const [newParentId, setNewParentId] = useState("")
  const [updateConcreteAnswer, setUpdateConcreteAnswer] = useState("")
  const [updateAbstractAnswer, setUpdateAbstractAnswer] = useState("")
  const [useNullParent, setUseNullParent] = useState(false)
  const [parentId, setParentId] = useState("")
  const [concreteAnswer, setConcreteAnswer] = useState("")
  const [abstractAnswer, setAbstractAnswer] = useState("")
  const [addNodeResponse, setAddNodeResponse] =
    useState<AddNodeResponse | null>(null)
  const [getTreeResponse, setGetTreeResponse] =
    useState<GetUserTreeResponse | null>(null)
  const [updateNodeResponse, setUpdateNodeResponse] =
    useState<UpdateNodeResponse | null>(null)
  const [deleteNodeResponse, setDeleteNodeResponse] =
    useState<DeleteNodeResponse | null>(null)
  const [isAddNodePending, startAddNodeTransition] = useTransition()
  const [isGetTreePending, startGetTreeTransition] = useTransition()
  const [isUpdateNodePending, startUpdateNodeTransition] = useTransition()
  const [isDeleteNodePending, startDeleteNodeTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startAddNodeTransition(async () => {
      const result = await addNode({
        mutateMode,
        parentId: parentId.trim() === "" ? null : parentId.trim(),
        concreteAnswer,
        abstractAnswer,
      })
      setAddNodeResponse(result)
    })
  }

  const handleGetTree = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startGetTreeTransition(async () => {
      const result = await getUserTree({
        rootId: rootId.trim() === "" ? undefined : rootId.trim(),
      })
      setGetTreeResponse(result)
    })
  }

  const handleUpdateNode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startUpdateNodeTransition(async () => {
      const payload: {
        nodeId: string
        parentId?: string | null
        concreteAnswer?: string
        abstractAnswer?: string | null
      } = {
        nodeId: targetNodeId.trim(),
      }

      if (useNullParent) {
        payload.parentId = null
      } else if (newParentId.trim() !== "") {
        payload.parentId = newParentId.trim()
      }

      if (updateConcreteAnswer.trim() !== "") {
        payload.concreteAnswer = updateConcreteAnswer
      }

      if (updateAbstractAnswer.trim() !== "") {
        payload.abstractAnswer = updateAbstractAnswer
      }

      const result = await updateNode(payload)
      setUpdateNodeResponse(result)
    })
  }

  const handleDeleteNode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startDeleteNodeTransition(async () => {
      const result = await deleteNode({
        nodeId: deleteNodeId.trim(),
      })
      setDeleteNodeResponse(result)
    })
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">nodes 検証</h1>
        <p className="text-sm text-muted-foreground">
          Server Action `addNode` / `updateNode` / `deleteNode` を検証します。
        </p>
      </div>

      {/* Test list */}
      <Card>
        <CardHeader>
          <CardTitle>テスト一覧</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <p className="mb-2 font-semibold">addNode</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  [append-root]
                </span>{" "}
                mutateMode=append / parentId=空 → ルートノード作成。
                <code className="ml-1 rounded bg-muted px-1 text-xs">
                  node.parentId === null
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [append-child]
                </span>{" "}
                mutateMode=append / parentId=既存ノードID → 子ノード追加。
                <code className="ml-1 rounded bg-muted px-1 text-xs">
                  node.parentId === 指定ID
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [append-parent-not-found]
                </span>{" "}
                mutateMode=append / parentId=存在しないUUID →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  NODE_NOT_FOUND
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [insert-between]
                </span>{" "}
                mutateMode=insert-between / parentId=親ノードID →
                親と既存の子ノード群の間にノードを差し込む。 差し込み後
                getUserTree で、既存子の parentId が新規ノードID
                になることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [insert-between-not-found]
                </span>{" "}
                mutateMode=insert-between / parentId=存在しないUUID →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  NODE_NOT_FOUND
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [insert-between-no-parent]
                </span>{" "}
                mutateMode=insert-between / parentId=空 →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  VALIDATION_ERROR
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [prepend-root]
                </span>{" "}
                mutateMode=prepend-root / parentId=現在のルートID →
                新ルートを先頭に追加。 既存ルートの parentId
                が新ノードIDになることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [prepend-root-non-root]
                </span>{" "}
                mutateMode=prepend-root / parentId=子ノードID（parentId≠null）→{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  VALIDATION_ERROR
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [validation-empty-concrete]
                </span>{" "}
                concreteAnswer=空文字 →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  VALIDATION_ERROR
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [validation-over-limit]
                </span>{" "}
                concreteAnswer=501文字 →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  VALIDATION_ERROR
                </code>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <p className="mb-2 font-semibold">getUserTree</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">[get-all]</span>{" "}
                rootId=空 → 全ノードを depth 昇順・createdAt 昇順で取得。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [get-subtree]
                </span>{" "}
                rootId=中間ノードID → そのノードを起点とするサブツリーのみ返却。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [get-leaf-subtree]
                </span>{" "}
                rootId=葉ノードID → 自身1件のみ返却（子なし）。
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <p className="mb-2 font-semibold">updateNode</p>
            <p className="mb-2 text-xs text-muted-foreground">
              parentId
              を変更すると①Cの現在の子→Cの旧親へ付け替え、②新親の現在の子→Cへ付け替え、③C本体を更新、の3操作がトランザクションで実行される。
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  [update-parent-middle]
                </span>{" "}
                A→B→D の状態で nodeId=C（旧親 null, 子 null）/ parentId=B →
                A→B→C→D になることを getUserTree で確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [update-parent-swap]
                </span>{" "}
                A→B→C の状態で nodeId=B / parentId=null → A（ルート）＋ null→B→C
                になり、A の子が null になることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [update-to-root]
                </span>{" "}
                nodeId=C / &ldquo;parentId を null にする&rdquo; チェック ON → C
                をルートへ移動。C の旧子の親が C の旧親になることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [update-concrete]
                </span>{" "}
                concreteAnswer のみ変更 → parentId
                は変わらず回答のみ更新（副作用なし）。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [update-circular-self]
                </span>{" "}
                nodeId=A / parentId=A →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  CIRCULAR_REFERENCE
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [update-circular-descendant]
                </span>{" "}
                nodeId=A / parentId=（Aの子孫ID）→{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  CIRCULAR_REFERENCE
                </code>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [update-node-not-found]
                </span>{" "}
                nodeId=存在しないUUID →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  NODE_NOT_FOUND
                </code>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <p className="mb-2 font-semibold">deleteNode（パターンD）</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  [delete-leaf]
                </span>{" "}
                子なし葉ノードを削除 → 子の付け替えなし。削除後 getUserTree
                で消えていることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [delete-with-children]
                </span>{" "}
                子ノードを持つ中間ノードを削除 → 子の parentId
                が削除ノードの親に付け替えられることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [delete-root-with-children]
                </span>{" "}
                ルートノード（parentId=null）を削除 → 直接の子の parentId が
                null（新ルート）になることを確認。
              </li>
              <li>
                <span className="font-medium text-foreground">
                  [delete-not-found]
                </span>{" "}
                nodeId=存在しないUUID →{" "}
                <code className="rounded bg-muted px-1 text-xs">
                  NODE_NOT_FOUND
                </code>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mutateMode">mutateMode</Label>
              <select
                id="mutateMode"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                value={mutateMode}
                onChange={(event) =>
                  setMutateMode(
                    event.target.value as AddNodeInput["mutateMode"]
                  )
                }
              >
                <option value="append">append（末尾追加 / ルート追加）</option>
                <option value="insert-between">
                  insert-between（差し込み）
                </option>
                <option value="prepend-root">
                  prepend-root（新ルート追加）
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="parentId">parentId (UUID / 空でルート)</Label>
              <Input
                id="parentId"
                placeholder="例: 8f07dfb5-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="concreteAnswer">concreteAnswer</Label>
              <Textarea
                id="concreteAnswer"
                value={concreteAnswer}
                onChange={(event) => setConcreteAnswer(event.target.value)}
                placeholder="今何をしていますか？"
                rows={3}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="abstractAnswer">abstractAnswer</Label>
              <Textarea
                id="abstractAnswer"
                value={abstractAnswer}
                onChange={(event) => setAbstractAnswer(event.target.value)}
                placeholder="なぜそれをしていますか？"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isAddNodePending}>
              {isAddNodePending ? "実行中..." : "addNode 実行"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>addNode レスポンス</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {addNodeResponse
              ? JSON.stringify(addNodeResponse, null, 2)
              : "ここにレスポンスが表示されます"}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>getUserTree 入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleGetTree}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rootId">rootId (UUID / 空で全体)</Label>
              <Input
                id="rootId"
                placeholder="例: 8f07dfb5-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={rootId}
                onChange={(event) => setRootId(event.target.value)}
              />
            </div>

            <Button type="submit" disabled={isGetTreePending}>
              {isGetTreePending ? "実行中..." : "getUserTree 実行"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>getUserTree レスポンス</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {getTreeResponse
              ? JSON.stringify(getTreeResponse, null, 2)
              : "ここにレスポンスが表示されます"}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>updateNode 入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleUpdateNode}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="targetNodeId">nodeId (更新対象)</Label>
              <Input
                id="targetNodeId"
                placeholder="例: C_id"
                value={targetNodeId}
                onChange={(event) => setTargetNodeId(event.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="newParentId">parentId（新しい親）</Label>
              <Input
                id="newParentId"
                placeholder="例: X_id（空欄で変更しない）"
                value={newParentId}
                onChange={(event) => setNewParentId(event.target.value)}
                disabled={useNullParent}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useNullParent}
                onChange={(event) => setUseNullParent(event.target.checked)}
              />
              parentId を null にする（ルートへ移動）
            </label>

            <div className="flex flex-col gap-2">
              <Label htmlFor="updateConcreteAnswer">
                concreteAnswer（任意）
              </Label>
              <Textarea
                id="updateConcreteAnswer"
                value={updateConcreteAnswer}
                onChange={(event) =>
                  setUpdateConcreteAnswer(event.target.value)
                }
                placeholder="空欄で変更しない"
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="updateAbstractAnswer">
                abstractAnswer（任意）
              </Label>
              <Textarea
                id="updateAbstractAnswer"
                value={updateAbstractAnswer}
                onChange={(event) =>
                  setUpdateAbstractAnswer(event.target.value)
                }
                placeholder="空欄で変更しない"
                rows={2}
              />
            </div>

            <Button type="submit" disabled={isUpdateNodePending}>
              {isUpdateNodePending ? "実行中..." : "updateNode 実行"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>updateNode レスポンス</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {updateNodeResponse
              ? JSON.stringify(updateNodeResponse, null, 2)
              : "ここにレスポンスが表示されます"}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>deleteNode 入力（パターンD）</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleDeleteNode}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deleteNodeId">nodeId (削除対象)</Label>
              <Input
                id="deleteNodeId"
                placeholder="例: B_id"
                value={deleteNodeId}
                onChange={(event) => setDeleteNodeId(event.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isDeleteNodePending}>
              {isDeleteNodePending ? "実行中..." : "deleteNode 実行"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>deleteNode レスポンス</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {deleteNodeResponse
              ? JSON.stringify(deleteNodeResponse, null, 2)
              : "ここにレスポンスが表示されます"}
          </pre>
        </CardContent>
      </Card>

      <GraphTabBar />
    </PageLayout>
  )
}
