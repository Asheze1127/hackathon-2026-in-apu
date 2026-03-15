"use client"

import Link from "next/link"
import {
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  MapPin,
  PencilLine,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface OwnProfileOverviewProps {
  age: number | null
  avatarUrl: string | null
  currentOccupation: string | null
  displayName: string | null
  email: string | null
  location: string | null
}

function getAvatarFallback(
  displayName: string | null,
  email: string | null,
  occupation: string | null
) {
  const source =
    displayName?.trim() || occupation?.trim() || email?.trim() || "P"
  return source.slice(0, 1).toUpperCase()
}

function getDisplayValue(value: string | number | null) {
  if (value == null) {
    return {
      muted: true,
      text: "未設定",
    }
  }

  if (typeof value === "string" && value.trim() === "") {
    return {
      muted: true,
      text: "未設定",
    }
  }

  return {
    muted: false,
    text: String(value),
  }
}

export function OwnProfileOverview({
  age,
  avatarUrl,
  currentOccupation,
  displayName,
  email,
  location,
}: OwnProfileOverviewProps) {
  const avatarFallback = getAvatarFallback(
    displayName,
    email,
    currentOccupation
  )
  const displayNameDisplay = getDisplayValue(displayName)
  const occupation = getDisplayValue(currentOccupation)
  const ageDisplay = getDisplayValue(age == null ? null : `${age}歳`)
  const locationDisplay = getDisplayValue(location)

  const detailItems = [
    {
      Icon: UserRound,
      label: "名前",
      value: displayNameDisplay,
    },
    {
      Icon: BriefcaseBusiness,
      label: "現在の職業",
      value: occupation,
    },
    {
      Icon: CalendarDays,
      label: "年齢",
      value: ageDisplay,
    },
    {
      Icon: MapPin,
      label: "住んでいるところ",
      value: locationDisplay,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>自分のプロフィール</CardTitle>
        <CardDescription>
          ほかの画面から見える基本情報です。まずは今の登録内容を確認できます。
        </CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link href="/profile/edit">
              <PencilLine className="size-4" />
              編集する
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-5 rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,rgba(246,248,251,0.95),rgba(255,255,255,1))] p-5 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-sm">
            {avatarUrl ? (
              <div
                aria-label="プロフィール画像"
                role="img"
                className="size-full bg-cover bg-center"
                style={{
                  backgroundImage: `url("${avatarUrl}")`,
                }}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_top,#dce9ff,transparent_60%),linear-gradient(135deg,#f7f8fb,#eef1f6)]">
                <span className="text-3xl font-semibold text-foreground/80">
                  {avatarFallback}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                あなたの公開プロフィール
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {displayNameDisplay.muted
                  ? "名前を設定してください"
                  : displayNameDisplay.text}
              </h2>
              <p className="text-sm text-muted-foreground">
                {occupation.muted ? "現在の職業は未設定です" : occupation.text}
              </p>
            </div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/80 bg-white/90 px-3 py-1.5 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{email ?? "email not available"}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {detailItems.map(({ Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card px-4 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p
                    className={
                      value.muted
                        ? "text-sm text-muted-foreground"
                        : "text-sm text-foreground"
                    }
                  >
                    {value.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
