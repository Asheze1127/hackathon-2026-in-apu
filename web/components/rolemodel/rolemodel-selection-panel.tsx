"use client"

import { useState, useTransition } from "react"
import {
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react"

import {
  deleteRoleModelSelection,
  generateRoleModelAdvice,
  saveRoleModelSelection,
  type RoleModelAdviceResult,
} from "@/actions/rolemodels/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface RoleModelSelectionPanelProps {
  initialIsPrimary: boolean
  initialIsSaved: boolean
  roleModelName: string
  targetUserId: string
}

export function RoleModelSelectionPanel({
  initialIsPrimary,
  initialIsSaved,
  roleModelName,
  targetUserId,
}: RoleModelSelectionPanelProps) {
  const [advice, setAdvice] = useState<RoleModelAdviceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPrimary, setIsPrimary] = useState(initialIsPrimary)
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isSaving, startSavingTransition] = useTransition()
  const [isGeneratingAdvice, startAdviceTransition] = useTransition()

  function handleSaveAsPrimary() {
    if (isSaving) {
      return
    }

    setError(null)

    startSavingTransition(async () => {
      const result = await saveRoleModelSelection({
        isPrimary: true,
        targetUserId,
      })

      if ("error" in result) {
        setError(result.error.message)
        return
      }

      setIsSaved(true)
      setIsPrimary(result.selection.isPrimary)
    })
  }

  function handleDelete() {
    if (isSaving) {
      return
    }

    setError(null)

    startSavingTransition(async () => {
      const result = await deleteRoleModelSelection({
        targetUserId,
      })

      if ("error" in result) {
        setError(result.error.message)
        return
      }

      setAdvice(null)
      setIsSaved(false)
      setIsPrimary(false)
    })
  }

  function handleGenerateAdvice() {
    if (isGeneratingAdvice) {
      return
    }

    setError(null)

    startAdviceTransition(async () => {
      const result = await generateRoleModelAdvice({
        targetUserId,
      })

      if ("error" in result) {
        setError(result.error.message)
        return
      }

      setAdvice(result.advice)
    })
  }

  return (
    <Card size="sm" className="border border-border/80 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              ロールモデル比較
            </CardTitle>
            <CardDescription>
              {isSaved
                ? `${roleModelName}さんを基準に、今の自分との差分から次の一手を考えられます。`
                : `${roleModelName}さんをロールモデルとして保存すると、今の自分との差分をAIに相談できます。`}
            </CardDescription>
          </div>

          {isPrimary ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <CheckCircle2 className="size-3.5" />
              現在のロールモデル
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleSaveAsPrimary}
            disabled={isSaving || (isSaved && isPrimary)}
            className="gap-2"
          >
            {isSaving ? <LoaderCircle className="animate-spin" /> : <Star />}
            {isSaved
              ? isPrimary
                ? "選択中です"
                : "この人をメインにする"
              : "ロールモデルにする"}
          </Button>

          {isSaved ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isSaving}
              className="gap-2"
            >
              <Trash2 />
              保存解除
            </Button>
          ) : null}
        </div>

        {isSaved ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-indigo-950">
                  AIに次の一手を聞く
                </div>
                <div className="mt-1 text-xs leading-relaxed text-indigo-900/70">
                  現在の自分の木と {roleModelName}{" "}
                  さんの木を比較して、次に取りやすい行動と避けたい罠を提案します。
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateAdvice}
                disabled={isGeneratingAdvice}
                className="gap-2"
              >
                {isGeneratingAdvice ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                比較アドバイスを生成
              </Button>
            </div>
          </div>
        ) : null}

        {advice ? (
          <div className="space-y-3 rounded-2xl border border-rose-200 bg-linear-to-br from-rose-50 via-white to-orange-50 px-4 py-4">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
                Current Position
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {advice.currentPosition}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
                Next Step
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {advice.nextStep}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-3">
                <div className="text-xs font-semibold text-emerald-700">
                  準備しておくこと
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {advice.preparation.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg bg-emerald-50 px-2.5 py-2 text-xs text-emerald-950"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-3">
                <div className="text-xs font-semibold text-amber-700">
                  避けたい罠
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {advice.pitfalls.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-950"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
