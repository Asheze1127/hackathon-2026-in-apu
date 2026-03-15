import Graph from "@/components/graph"
import { GraphTabBar } from "@/components/nav/tabbar"

export default async function Page() {
  return (
    <div className="relative h-svh w-full">
      <Graph />
      <GraphTabBar />
    </div>
  )
}
