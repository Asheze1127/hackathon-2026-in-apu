"use client"
import { useMemo } from "react"
import { CatmullRomCurve3, Vector3 } from "three"
import type { Edge3D, Node3D } from "@/lib/graph-3d"

type Props = {
  edge: Edge3D
  nodesById: Map<string, Node3D>
}

// Stable per-edge bow offset — seeded by edge id chars so it doesn't change on re-render
function edgeSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++)
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return (h >>> 0) / 0xffffffff - 0.5
}

export function EdgeLine({ edge, nodesById }: Props) {
  const source = nodesById.get(edge.sourceId)
  const target = nodesById.get(edge.targetId)

  const curve = useMemo(() => {
    if (!source || !target) return null
    // Stem (selected/main path) runs straight; branches bow out naturally
    const bow = edge.isSelected ? 0 : edgeSeed(edge.id) * 0.6
    const start = new Vector3(source.x, source.y, 0)
    const end = new Vector3(target.x, target.y, 0)
    const mid = new Vector3(
      (source.x + target.x) / 2 + bow,
      (source.y + target.y) / 2,
      edge.isSelected ? 0 : Math.abs(bow) * 0.5 + 0.08
    )
    return new CatmullRomCurve3([start, mid, end])
  }, [source, target, edge.id, edge.isSelected])

  if (!curve) return null

  // Stem: thick bark trunk. Branch: thinner wood limb. Dashed future: teal tendril.
  const isStem = edge.isSelected
  const radius = edge.isDashed ? 0.014 : isStem ? 0.07 : 0.022
  const radialSeg = isStem ? 10 : 6
  const tubeSeg = isStem ? 20 : 12

  const color = edge.isDashed ? "#5eead4" : isStem ? "#92400e" : "#c49a6c"
  const emissive = edge.isDashed ? "#14b8a6" : isStem ? "#b45309" : "#78502a"
  const emissiveIntensity = edge.isDashed ? 1.0 : isStem ? 0.4 : 0.25
  const opacity = edge.isDashed ? 0.9 : 1
  const roughness = isStem ? 0.9 : 0.8

  return (
    <mesh>
      <tubeGeometry args={[curve, tubeSeg, radius, radialSeg, false]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={roughness}
        metalness={0}
      />
    </mesh>
  )
}
