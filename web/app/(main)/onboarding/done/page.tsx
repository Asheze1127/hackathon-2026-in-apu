import Link from "next/link"

import { Button } from "@/components/ui/button"

const Page = () => {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">
          ありがとうございます 🎉
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          プロフィールが登録されました。さっそくあなたのツリーを見てみましょう！
        </p>
      </div>
      <div className="flex justify-end">
        <Button asChild size="lg">
          <Link href="/">ツリーを見る →</Link>
        </Button>
      </div>
    </div>
  )
}

export default Page
