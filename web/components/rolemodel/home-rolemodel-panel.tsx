"use client"

import Link from "next/link"
import { useState, useSyncExternalStore, useTransition } from "react"
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Compass,
  GitBranch,
  LoaderCircle,
  Sparkles,
  Star,
} from "lucide-react"

import {
  generateRoleModelAdvice,
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
import { cn } from "@/lib/utils"

interface HomeRoleModelPanelProps {
  primaryRoleModel: {
    avatarText: string
    currentNodeLabel: string
    id: string
    location: string
    name: string
    ownBranchFrom: string
    ownBranchTo: string
    ownCurrentNodeLabel: string
    profileHref: string
    role: string
    roleModelBranchFrom: string
    roleModelBranchTo: string
  } | null
}

const panelCardClassName =
  "pointer-events-auto w-full max-w-[20.5rem] border border-border/70 bg-white/82 shadow-[0_18px_65px_rgba(15,23,42,0.1)] backdrop-blur-md sm:max-w-[24rem] md:max-w-[28rem]"
const compactPillClassName =
  "pointer-events-auto inline-flex max-w-[11.75rem] items-center gap-2 rounded-full border border-border/70 bg-white/88 px-2.5 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-md"

function subscribeToMobileViewport(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const mediaQuery = window.matchMedia("(max-width: 767px)")
  const handleChange = () => {
    callback()
  }

  mediaQuery.addEventListener("change", handleChange)

  return () => {
    mediaQuery.removeEventListener("change", handleChange)
  }
}

function getMobileViewportSnapshot() {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia("(max-width: 767px)").matches
}

function CompactToggleButton({
  isCompact,
  onToggle,
}: {
  isCompact: boolean
  onToggle: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={isCompact ? "比較カードを開く" : "比較カードを小さくする"}
      className="shrink-0 rounded-full"
      onClick={onToggle}
    >
      {isCompact ? <ChevronDown /> : <ChevronUp />}
    </Button>
  )
}

function AdviceSection({ advice }: { advice: RoleModelAdviceResult }) {
  return (
    <div className="space-y-3 rounded-[1.4rem] border border-rose-200/80 bg-linear-to-br from-rose-50 via-white to-orange-50 px-4 py-4">
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

      <div className="grid gap-3">
        <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-3">
          <div className="text-xs font-semibold text-emerald-700">
            準備しておくこと
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {advice.preparation.map((item) => (
              <div
                key={item}
                className="rounded-xl bg-emerald-50 px-2.5 py-2 text-xs text-emerald-950"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-3">
          <div className="text-xs font-semibold text-amber-700">避けたい罠</div>
          <div className="mt-2 flex flex-col gap-2">
            {advice.pitfalls.map((item) => (
              <div
                key={item}
                className="rounded-xl bg-amber-50 px-2.5 py-2 text-xs text-amber-950"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactPanelTrigger({
  avatarText,
  eyebrow,
  title,
  onOpen,
}: {
  avatarText?: string
  eyebrow: string
  title: string
  onOpen: () => void
}) {
  return (
    <button type="button" className={compactPillClassName} onClick={onOpen}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          avatarText
            ? "bg-primary text-primary-foreground"
            : "bg-amber-50 text-amber-700"
        )}
      >
        {avatarText ? avatarText : <Star className="size-3.5" />}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {eyebrow}
        </div>
        <div className="truncate text-xs font-semibold text-foreground">
          {title}
        </div>
      </div>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function HomeRoleModelPanel({
  primaryRoleModel,
}: HomeRoleModelPanelProps) {
  const isMobile = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    () => false
  )
  const [advice, setAdvice] = useState<RoleModelAdviceResult | null>(null)
  const [desktopCompact, setDesktopCompact] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [isGeneratingAdvice, startAdviceTransition] = useTransition()
  const isCompact = isMobile ? !mobileExpanded : desktopCompact

  function toggleCompact() {
    if (isMobile) {
      setMobileExpanded((current) => !current)
      return
    }

    setDesktopCompact((current) => !current)
  }

  function handleGenerateAdvice() {
    if (!primaryRoleModel || isGeneratingAdvice) {
      return
    }

    setError(null)

    if (isMobile) {
      setMobileExpanded(true)
    } else {
      setDesktopCompact(false)
    }

    startAdviceTransition(async () => {
      const result = await generateRoleModelAdvice({
        targetUserId: primaryRoleModel.id,
      })

      if ("error" in result) {
        setError(result.error.message)
        return
      }

      setAdvice(result.advice)
    })
  }

  if (!primaryRoleModel) {
    if (isCompact) {
      return (
        <CompactPanelTrigger
          eyebrow="Role Model"
          title="未選択"
          onOpen={toggleCompact}
        />
      )
    }

    return (
      <Card size="sm" className={panelCardClassName}>
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-indigo-700 uppercase">
              <Star className="size-3.5" />
              Role Model
            </div>
            <CompactToggleButton
              isCompact={isCompact}
              onToggle={toggleCompact}
            />
          </div>

          {isCompact ? (
            <div className="space-y-2">
              <CardTitle className="text-sm">ロールモデル未選択</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                選ぶとホームで比較と AI アドバイスが使えます。
              </CardDescription>
            </div>
          ) : (
            <>
              <CardTitle>ホームで比較するロールモデルを選ぶ</CardTitle>
              <CardDescription>
                主ロールモデルを選ぶと、この画面から現在地の比較と AI
                アドバイスが使えます。
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className={cn(isCompact ? "pt-0" : "")}>
          <Button asChild size="sm" className="w-full gap-2">
            <Link href="/rolemodel">
              ロールモデルを探す
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isCompact) {
    return (
      <CompactPanelTrigger
        avatarText={primaryRoleModel.avatarText}
        eyebrow="Role Model"
        title={primaryRoleModel.name}
        onOpen={toggleCompact}
      />
    )
  }

  return (
    <Card size="sm" className={panelCardClassName}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-amber-700 uppercase">
              <Star className="size-3.5" />
              Current Role Model
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {primaryRoleModel.avatarText}
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base font-semibold sm:text-lg">
                  {primaryRoleModel.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {primaryRoleModel.role} ・ {primaryRoleModel.location}
                </CardDescription>
              </div>
            </div>
          </div>
          <CompactToggleButton isCompact={isCompact} onToggle={toggleCompact} />
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "overflow-y-auto",
          "max-h-[min(54svh,30rem)] space-y-4 sm:max-h-[min(62svh,32rem)]"
        )}
      >
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full shrink-0 gap-2 sm:w-auto"
            >
              <Link href={primaryRoleModel.profileHref}>
                詳細を見る
                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.35rem] border border-indigo-100 bg-linear-to-br from-slate-50 to-white px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                <Compass className="size-3.5" />
                Your Current Node
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                {primaryRoleModel.ownCurrentNodeLabel}
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <GitBranch className="size-3.5" />
                <span className="truncate">
                  {primaryRoleModel.ownBranchFrom}
                </span>
                <ArrowRight className="size-3.5 shrink-0" />
                <span className="truncate">{primaryRoleModel.ownBranchTo}</span>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-rose-100 bg-linear-to-br from-rose-50 via-white to-orange-50 px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-rose-500 uppercase">
                <Star className="size-3.5" />
                Role Model Node
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                {primaryRoleModel.currentNodeLabel}
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <GitBranch className="size-3.5" />
                <span className="truncate">
                  {primaryRoleModel.roleModelBranchFrom}
                </span>
                <ArrowRight className="size-3.5 shrink-0" />
                <span className="truncate">
                  {primaryRoleModel.roleModelBranchTo}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-indigo-200/80 bg-indigo-50/85 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-indigo-950">
                  ホームで次の一手を聞く
                </div>
                <div className="mt-1 text-xs leading-relaxed text-indigo-900/70">
                  自分の木と {primaryRoleModel.name}
                  さんの木を比較して、今取りやすい行動を AI にまとめさせます。
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateAdvice}
                disabled={isGeneratingAdvice}
                className="w-full gap-2 sm:w-auto"
              >
                {isGeneratingAdvice ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                AIアドバイス
              </Button>
            </div>
          </div>

          {advice ? <AdviceSection advice={advice} /> : null}

          {error ? (
            <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </>
      </CardContent>
    </Card>
  )
}
