import Link from "next/link"

import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"

const Page = () => {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          ありがとうございます 🎉
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          オンボーディングが完了しました。さっそくあなたのツリーを見てみましょう。
        </p>
      </div>
      <div className="flex justify-end">
        <Button asChild size="lg">
          <Link href="/">ツリーを見る →</Link>
        </Button>
      </div>
    </PageLayout>
  )
}

export default Page
