import Link from "next/link"

import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const currentStep = 1

const Page = () => {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                "size-2 rounded-full transition-colors",
                n === currentStep
                  ? "bg-foreground"
                  : n < currentStep
                    ? "bg-foreground/40"
                    : "bg-border"
              )}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            ステップ {currentStep} / 3
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          はじめましょう 👋
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          まずは2つの質問に答えて、そのあと名前とプロフィールを設定します。プロフィール写真や住んでいる場所は任意です。
        </p>
      </div>
      <div className="flex justify-end">
        <Button asChild size="lg">
          <Link href="/onboarding/form">続ける →</Link>
        </Button>
      </div>
    </PageLayout>
  )
}

export default Page
