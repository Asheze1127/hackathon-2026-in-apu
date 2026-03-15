"use client"

import Link from "next/link"
import { LoaderCircle, Sparkles, X } from "lucide-react"

import type { GetFutureSuggestionsResult } from "@/actions/nodes/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GraphFutureSuggestionsPanel({
  errorMessage,
  isLoading,
  onClose,
  payload,
}: {
  errorMessage: string | null
  isLoading: boolean
  onClose: () => void
  payload: GetFutureSuggestionsResult | null
}) {
  if (!isLoading && !errorMessage && !payload) {
    return null
  }

  return (
    <Card className="pointer-events-auto absolute top-20 right-4 z-20 flex max-h-[calc(100vh-7rem)] w-full max-w-sm flex-col overflow-hidden border border-border/80 bg-card/95 shadow-xl backdrop-blur">
      <CardHeader className="shrink-0 gap-3 border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              未来候補
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              タグの部分一致から、近い状態の先にあった未来を表示します。
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="未来候補を閉じる"
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pt-4">
        {isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            近い未来候補を検索しています...
          </div>
        ) : null}

        {!isLoading && payload ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Selected Node
              </div>
              <div className="mt-2 text-base font-semibold">
                {payload.nodeLabel}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {payload.selectedTagNames.length > 0 ? (
                  payload.selectedTagNames.map((tagName) => (
                    <span
                      key={tagName}
                      className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {tagName}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    このノードにはまだタグがありません。
                  </span>
                )}
              </div>
            </div>

            {payload.selectedTagNames.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                タグがないノードは未来候補を検索できません。AI
                タグ付け済みのノードを選んでください。
              </div>
            ) : payload.suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                一致する未来候補はまだ見つかりませんでした。別のノードを選ぶと見つかる場合があります。
              </div>
            ) : (
              <div className="space-y-3">
                {payload.suggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.id}-${suggestion.label}`}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold">
                          {suggestion.label}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {suggestion.matchedNodeLabel} の先で見られた未来
                        </div>
                      </div>
                      <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {suggestion.supportingExamples}例
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestion.overlapTagNames.map((tagName) => (
                        <span
                          key={tagName}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tagName}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-3 py-3">
                      <div className="text-[11px] font-semibold tracking-[0.18em] text-rose-700 uppercase">
                        Path Preview
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {suggestion.steps.map((step, index) => (
                          <div
                            key={`${suggestion.id}-${step.id}-${index}`}
                            className="flex items-center gap-2"
                          >
                            {index > 0 ? (
                              <span className="text-xs text-rose-400">→</span>
                            ) : null}
                            <span className="rounded-full border border-rose-200 bg-white/90 px-2.5 py-1 text-xs font-medium text-rose-900">
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {suggestion.matchedDisplayName}
                        </div>
                        <div className="truncate text-muted-foreground">
                          {suggestion.matchedOccupation?.trim() ||
                            "活動内容を設定中"}
                        </div>
                      </div>
                      <Link
                        href={suggestion.profileHref}
                        className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        プロフィール
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
