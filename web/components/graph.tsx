"use client"
import { useState } from "react"
import dynamic from "next/dynamic"
import Graph2D from "@/components/graph-2d"

const Graph3DCanvas = dynamic(
  () => import("@/components/graph-3d/canvas").then((m) => m.Graph3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f9fafb]">
        <span className="text-sm text-muted-foreground">読み込み中...</span>
      </div>
    ),
  }
)

export default function Graph() {
  const [is3D, setIs3D] = useState(false)

  return (
    <div className="fixed inset-0">
      {is3D ? <Graph3DCanvas /> : <Graph2D />}

      <button
        onClick={() => setIs3D((v) => !v)}
        className="absolute top-4 left-4 z-10 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
      >
        {is3D ? "2D" : "3D"}
      </button>
    </div>
  )
}
