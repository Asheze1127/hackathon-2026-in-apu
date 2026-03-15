"use client"

import Link from "next/link"
import { useDeferredValue, useState } from "react"
import { ArrowRight, GitBranch, Search } from "lucide-react"

import type { RoleModelSummary } from "@/lib/rolemodels"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export function RoleModelDirectory({
  roleModels,
}: {
  roleModels: RoleModelSummary[]
}) {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const filteredRoleModels = roleModels.filter((roleModel) => {
    if (deferredSearch === "") {
      return true
    }

    return [
      roleModel.name,
      roleModel.role,
      roleModel.branch,
      ...roleModel.tags,
    ].some((value) => value.toLowerCase().includes(deferredSearch))
  })

  return (
    <div className="flex flex-col gap-6">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>
            <Search size={16} />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
          }}
          placeholder="名前・職業・キーワードで検索…"
        />
      </InputGroup>

      {filteredRoleModels.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/30">
          <CardHeader>
            <p className="text-base font-semibold">
              該当するロールモデルがいません
            </p>
            <p className="text-sm text-muted-foreground">
              別のキーワードで検索するか、プロフィール入力が増えるのを待ってみてください。
            </p>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredRoleModels.map((roleModel) => (
            <Card key={roleModel.id} size="sm">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">{roleModel.avatarText}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold md:text-xl">
                      {roleModel.name}
                    </div>
                    {roleModel.isPrimary ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        選択中
                      </span>
                    ) : roleModel.isSaved ? (
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        保存済み
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {roleModel.role}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitBranch size={11} />
                    {roleModel.branch}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {roleModel.tags.map((tag) => (
                      <span
                        key={`${roleModel.id}-${tag}`}
                        className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end pt-0">
                <Link href={`/profile/${roleModel.id}`}>
                  <Button size="sm" variant="outline">
                    詳細を見る <ArrowRight size={13} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
