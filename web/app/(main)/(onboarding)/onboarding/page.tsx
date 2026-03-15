import Link from "next/link"

import { PageLayout } from "@/components/shared/page-layout"
import { Button } from "@/components/ui/button"

const Page = () => {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">ステップ 1 / 2</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          はじめましょう 👋
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          まずはあなたのことを少し教えてください。名前は必須ですが、プロフィール写真や住んでいる場所はあとで設定しても大丈夫です。
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
