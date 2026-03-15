import Graph from "@/components/graph"
import { GraphTabBar } from "@/components/nav/tabbar"
import { HomeRoleModelPanel } from "@/components/rolemodel/home-rolemodel-panel"
import { SHOULD_USE_MOCK_GRAPH_DATA } from "@/lib/graph-config"
import { getPrimaryRoleModelHomeCard } from "@/lib/rolemodels"
import { createClient } from "@/lib/supabase/server"
import { buildGraphTreeData, listUserTreeNodes } from "@/lib/user-tree"

export default async function Page() {
  let initialGraphData = null
  let primaryRoleModel = null
  let hasAuthenticatedUser = false

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    hasAuthenticatedUser = true
    const treeNodes = await listUserTreeNodes(user.id)

    if (!SHOULD_USE_MOCK_GRAPH_DATA) {
      initialGraphData = buildGraphTreeData(treeNodes)
    }

    primaryRoleModel = await getPrimaryRoleModelHomeCard(user.id, treeNodes)
  }

  return (
    <div className="relative h-svh w-full">
      <Graph initialGraphData={initialGraphData} />
      {hasAuthenticatedUser ? (
        <div className="pointer-events-none absolute top-4 left-4 z-20 right-4 md:top-6 md:left-6 md:right-auto">
          <HomeRoleModelPanel primaryRoleModel={primaryRoleModel} />
        </div>
      ) : null}
      <GraphTabBar />
    </div>
  )
}
