"use client"
import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { useState } from "react"
import { ArrowRight, GitBranch, Search } from "lucide-react"
import Link from "next/link"

const roleModels = [
  {
    id: 1,
    avatarText: "田",
    name: "田中 誠",
    role: "フリーランスエンジニア",
    branch: "大学進学 → NO を選択",
    tags: ["IT", "独立"],
    uid: "tanaka",
  },
  {
    id: 2,
    avatarText: "佐",
    name: "佐藤 あかり",
    role: "プロダクトデザイナー",
    branch: "海外留学 → YES を選択",
    tags: ["デザイン", "海外"],
    uid: "sato",
  },
  {
    id: 3,
    avatarText: "鈴",
    name: "鈴木 健太",
    role: "スタートアップ CEO",
    branch: "就職 → NO、起業を選択",
    tags: ["起業", "CEO"],
    uid: "suzuki",
  },
]

const Page = () => {
  const [search, setSearch] = useState("")
  return (
    <PageLayout>
      <div className="flex flex-col gap-6 pb-24">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            ロールモデルを探す
          </h1>
          <p className="text-sm text-muted-foreground">
            別の道を選んだ人のキャリアから、新しい視点を見つけよう
          </p>
        </div>

        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>
              <Search size={16} />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="職業・業界・キーワードで検索…"
          />
        </InputGroup>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {roleModels.map((rm) => (
            <Card key={rm.id} size="sm">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">{rm.avatarText}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="text-lg font-semibold md:text-xl">
                    {rm.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{rm.role}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitBranch size={11} />
                    {rm.branch}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {rm.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end pt-0">
                <Link href={`/profile/${rm.uid}`}>
                  <Button size="sm" variant="outline">
                    詳細を見る <ArrowRight size={13} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <GraphTabBar />
    </PageLayout>
  )
}

export default Page
