import Graph from "@/components/graph"
import { GraphTabBar } from "@/components/nav/tabbar"
import { SHOULD_USE_MOCK_GRAPH_DATA } from "@/lib/graph-config"
import { createClient } from "@/lib/supabase/server"
import { buildGraphTreeData, listUserTreeNodes } from "@/lib/user-tree"

export default async function Page() {
  let initialGraphData = null

  if (!SHOULD_USE_MOCK_GRAPH_DATA) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const treeNodes = await listUserTreeNodes(user.id)
      initialGraphData = buildGraphTreeData(treeNodes)
    }
  }

  return (
    <div className="relative h-svh w-full">
      <Graph initialGraphData={initialGraphData} />
      <GraphTabBar />
    </div>
  )
}
