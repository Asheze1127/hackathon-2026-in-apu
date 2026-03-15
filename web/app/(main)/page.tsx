import Graph from "@/components/graph"
import { GraphTabBar } from "@/components/graph-tabbar"

export default async function Page() {
  return (
    <div className="relative h-svh w-full">
      <Graph />
      <GraphTabBar />
    </div>
  )
}
