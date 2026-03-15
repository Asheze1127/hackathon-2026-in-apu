import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"

const Page = () => {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">
          ロールモデルを探す
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          別の道を選んだ人のキャリアから、新しい視点を見つけよう
        </p>
      </div>
      <GraphTabBar />
    </PageLayout>
  )
}

export default Page
