import { LogoutButton } from "@/components/auth/logout-button"
import { GraphTabBar } from "@/components/nav/tabbar"
import { PageLayout } from "@/components/shared/page-layout"
import { Separator } from "@/components/ui/separator"

const Page = () => {
  return (
    <PageLayout className="">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">設定</h1>
      </div>
      <Separator className="my-4" />
      <LogoutButton />

      <GraphTabBar />
    </PageLayout>
  )
}

export default Page
