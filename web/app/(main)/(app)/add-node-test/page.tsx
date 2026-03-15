"use client"

import { useState, useTransition } from "react"
import {
  addNode,
  getUserTree,
  type AddNodeResponse,
  type GetUserTreeResponse,
} from "@/actions/nodes/actions"
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
  const [parentId, setParentId] = useState("")
  const [concreteAnswer, setConcreteAnswer] = useState("")
  const [abstractAnswer, setAbstractAnswer] = useState("")
  const [addNodeResponse, setAddNodeResponse] =
    useState<AddNodeResponse | null>(null)
  const [getTreeResponse, setGetTreeResponse] =
    useState<GetUserTreeResponse | null>(null)
  const [isAddNodePending, startAddNodeTransition] = useTransition()
  const [isGetTreePending, startGetTreeTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startAddNodeTransition(async () => {
      const result = await addNode({
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

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">addNode 検証</h1>
        <p className="text-sm text-muted-foreground">
          Server Action `addNode` を直接実行して結果を確認します。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>入力</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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

      <GraphTabBar />
    </PageLayout>
  )
}
