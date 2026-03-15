"use client"
import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { CatmullRomCurve3, Vector3 } from "three"
import type { Mesh } from "three"
import type { Edge3D, Node3D } from "@/lib/graph-3d"

const PARTICLE_COUNT = 4
const PARTICLE_SPEED = 0.25

function edgeSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++)
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return (h >>> 0) / 0xffffffff - 0.5
}

type ParticleProps = {
  curve: CatmullRomCurve3
  offset: number // 0..1 initial t offset
}

function Particle({ curve, offset }: ParticleProps) {
  const meshRef = useRef<Mesh>(null)
  const tRef = useRef(offset)

  useFrame((_, delta) => {
    tRef.current = (tRef.current + delta * PARTICLE_SPEED) % 1
    const pos = curve.getPoint(tRef.current)
    if (meshRef.current) {
      meshRef.current.position.set(pos.x, pos.y, pos.z)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#f59e0b"
        emissiveIntensity={1.2}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

type Props = {
  edge: Edge3D
  nodesById: Map<string, Node3D>
}

export function EdgeParticles({ edge, nodesById }: Props) {
  const source = nodesById.get(edge.sourceId)
  const target = nodesById.get(edge.targetId)

  const curve = useMemo(() => {
    if (!source || !target) return null
    const bow = edgeSeed(edge.id) * 0.5
    const start = new Vector3(source.x, source.y, 0)
    const end = new Vector3(target.x, target.y, 0)
    const mid = new Vector3(
      (source.x + target.x) / 2 + bow,
      (source.y + target.y) / 2,
      Math.abs(bow) * 0.6 + 0.1
    )
    return new CatmullRomCurve3([start, mid, end])
  }, [source, target, edge.id])

  if (!curve) return null

  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <Particle key={i} curve={curve} offset={i / PARTICLE_COUNT} />
      ))}
    </>
  )
}
