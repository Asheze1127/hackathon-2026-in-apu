import Link from "next/link"

import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"

const Page = () => {
  return (
    <PageLayout className="max-w-2xl">
      <div className="flex flex-col items-center gap-8 py-12 text-center">
        <p className="text-5xl">🎉</p>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            ありがとうございます！
          </h1>
          <p className="leading-relaxed text-muted-foreground">
            オンボーディングが完了しました。さっそくあなたのツリーを見てみましょう。
          </p>
        </div>
        <div className="h-px w-16 rounded-full bg-border" />
        <Button asChild size="lg">
          <Link href="/">ツリーを見る →</Link>
        </Button>
      </div>
    </PageLayout>
  )
}

export default Page
