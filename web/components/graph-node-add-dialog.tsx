"use client"

import { LoaderCircle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export interface GraphNodeAddDraft {
  anchor: "future" | "past"
  nodeId: string
  nodeLabel: string
}

function getCopy(anchor: GraphNodeAddDraft["anchor"]) {
  if (anchor === "future") {
    return {
      title: "未来の出来事を追加",
      description:
        "このノードの先に続く出来事を追加します。保存時に AI がタグ付けを行います。",
      concreteLabel: "その先で何をしていますか？",
      concretePlaceholder: "例: 新しい事業を立ち上げている",
      abstractLabel: "なぜその未来に進みたいですか？",
      abstractPlaceholder: "例: より大きな裁量で社会に影響を与えたいから",
      submitLabel: "未来を追加する",
    }
  }

  return {
    title: "過去の出来事を追加",
    description:
      "このノードの手前にある出来事を追加します。保存時に AI がタグ付けを行います。",
    concreteLabel: "その頃、何をしていましたか？",
    concretePlaceholder: "例: 学生団体でイベントを企画していた",
    abstractLabel: "なぜその時それをしていましたか？",
    abstractPlaceholder: "例: 人を巻き込む経験を積みたかったから",
    submitLabel: "過去を追加する",
  }
}

export function GraphNodeAddDialog({
  concreteAnswer,
  draft,
  errorMessage,
  isPending,
  onClose,
  onConcreteAnswerChange,
  onOpenChange,
  onSubmit,
  onAbstractAnswerChange,
  abstractAnswer,
}: {
  abstractAnswer: string
  concreteAnswer: string
  draft: GraphNodeAddDraft | null
  errorMessage: string | null
  isPending: boolean
  onAbstractAnswerChange: (value: string) => void
  onClose: () => void
  onConcreteAnswerChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  const copy = draft ? getCopy(draft.anchor) : null

  return (
    <Dialog
      open={Boolean(draft)}
      onOpenChange={(open) => {
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy?.title ?? "ノードを追加"}</DialogTitle>
          <DialogDescription>
            {copy?.description}
            {draft ? (
              <span className="mt-2 block text-foreground/80">
                対象ノード: {draft.nodeLabel}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="graph-node-concrete" className="font-bold">
              {copy?.concreteLabel}
            </FieldLabel>
            <FieldDescription>
              その時点の状態や行動を、できるだけ具体的に書いてください。
            </FieldDescription>
            <Textarea
              id="graph-node-concrete"
              value={concreteAnswer}
              onChange={(event) => {
                onConcreteAnswerChange(event.target.value)
              }}
              placeholder={copy?.concretePlaceholder}
              disabled={isPending}
              rows={4}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="graph-node-abstract" className="font-bold">
              {copy?.abstractLabel}
            </FieldLabel>
            <FieldDescription>
              任意です。理由や動機があれば入れてください。
            </FieldDescription>
            <Textarea
              id="graph-node-abstract"
              value={abstractAnswer}
              onChange={(event) => {
                onAbstractAnswerChange(event.target.value)
              }}
              placeholder={copy?.abstractPlaceholder}
              disabled={isPending}
              rows={4}
            />
          </Field>

          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={isPending || concreteAnswer.trim() === ""}
            onClick={onSubmit}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            {copy?.submitLabel ?? "追加する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
