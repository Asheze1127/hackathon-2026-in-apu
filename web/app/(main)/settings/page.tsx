import { LogoutButton } from "@/components/auth/logout-button"
import { GraphTabBar } from "@/components/graph-tabbar"

const Page = () => {
  return (
    <div className="">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center py-6">
        <LogoutButton />
      </div>
      <GraphTabBar />
    </div>
  )
}

export default Page
