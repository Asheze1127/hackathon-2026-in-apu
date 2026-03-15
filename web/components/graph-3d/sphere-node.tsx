"use client"
import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { Mesh } from "three"
import type { Node3D } from "@/lib/graph-3d"

const pulseOffsets = new Map<string, number>()
function getPulseOffset(id: string): number {
  if (!pulseOffsets.has(id)) pulseOffsets.set(id, Math.random() * Math.PI * 2)
  return pulseOffsets.get(id)!
}

// Wood-knot orb config for main-path/unselected nodes; leaf config for future nodes
const STATE = {
  default: {
    color: "#f4c06a",
    emissive: "#d97706",
    emissiveIntensity: 0.6,
    opacity: 1,
    radius: 0.3,
    pointLight: false,
  },
  unselected: {
    color: "#d4cfc8",
    emissive: "#a09890",
    emissiveIntensity: 0.3,
    opacity: 0.9,
    radius: 0.22,
    pointLight: false,
  },
  current: {
    color: "#fde68a",
    emissive: "#f59e0b",
    emissiveIntensity: 2.0,
    opacity: 1,
    radius: 0.38,
    pointLight: true,
  },
  future: {
    color: "#86efac",
    emissive: "#22c55e",
    emissiveIntensity: 1.2,
    opacity: 0.95,
    radius: 0.28,
    pointLight: false,
  },
} as const

type Props = {
  node: Node3D
  onHover: (id: string | null) => void
  onClickNode: (node: Node3D) => void
}

export function SphereNode({ node, onHover, onClickNode }: Props) {
  const meshRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const pulseRef = useRef(getPulseOffset(node.id)) // stagger pulse per node
  const cfg = STATE[node.state]
  const isLeaf = node.state === "future"

  useFrame((_, delta) => {
    if (isLeaf) {
      pulseRef.current += delta * 1.6
      const s = 1 + Math.sin(pulseRef.current) * 0.08
      meshRef.current?.scale.setScalar(s)
      glowRef.current?.scale.setScalar(s * 1.3)
    }
    if (node.state === "current") {
      pulseRef.current += delta * 1.2
      const s = 1 + Math.sin(pulseRef.current) * 0.04
      glowRef.current?.scale.setScalar(s * 1.4)
    }
  })

  const hoverScale = hovered ? 1.25 : 1

  const pointerHandlers = {
    onPointerEnter: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHovered(true)
      onHover(node.id)
      document.body.style.cursor = "pointer"
    },
    onPointerLeave: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHovered(false)
      onHover(null)
      document.body.style.cursor = "default"
    },
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onClickNode(node)
    },
  }

  return (
    <group position={[node.x, node.y, node.z]}>
      {cfg.pointLight && (
        <pointLight
          color={node.state === "current" ? "#c47a10" : "#16a34a"}
          intensity={node.state === "current" ? 2.0 : 1.2}
          distance={2.5}
          decay={2}
        />
      )}

      {isLeaf ? (
        // ── Leaf shape: flat ellipsoid, green ──
        <>
          {/* Outer glow */}
          <mesh
            ref={glowRef}
            scale={hoverScale * 1.3}
            rotation={[0.3, 0.2, 0.5]}
          >
            <sphereGeometry args={[cfg.radius, 12, 8]} />
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={cfg.emissiveIntensity * 0.35}
              transparent
              opacity={0.15}
              depthWrite={false}
            />
          </mesh>
          {/* Leaf ellipsoid — wide, short, very thin on Z */}
          <mesh
            ref={meshRef}
            scale={[hoverScale * 1.5, hoverScale * 0.9, hoverScale * 0.15]}
            rotation={[0.3, 0.2, 0.5]}
            {...pointerHandlers}
          >
            <sphereGeometry args={[cfg.radius, 20, 14]} />
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={
                hovered ? cfg.emissiveIntensity * 1.4 : cfg.emissiveIntensity
              }
              transparent
              opacity={cfg.opacity}
              roughness={0.6}
              metalness={0}
            />
          </mesh>
        </>
      ) : (
        // ── Wood-knot orb for main path / unselected nodes ──
        <>
          {/* Outer glow shell */}
          <mesh ref={glowRef} scale={hoverScale * 1.35}>
            <sphereGeometry args={[cfg.radius, 16, 16]} />
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={cfg.emissiveIntensity * 0.4}
              transparent
              opacity={cfg.opacity * 0.18}
              depthWrite={false}
            />
          </mesh>

          {/* Inner orb */}
          <mesh ref={meshRef} scale={hoverScale} {...pointerHandlers}>
            <sphereGeometry args={[cfg.radius, 32, 32]} />
            <meshStandardMaterial
              color={cfg.color}
              emissive={cfg.emissive}
              emissiveIntensity={
                hovered ? cfg.emissiveIntensity * 1.5 : cfg.emissiveIntensity
              }
              transparent={cfg.opacity < 1}
              opacity={cfg.opacity}
              roughness={0.85}
              metalness={0}
            />
          </mesh>
        </>
      )}

      {/* Label — always visible */}
      <Html center distanceFactor={7} style={{ pointerEvents: "none" }}>
        <div
          style={{
            color:
              node.state === "unselected"
                ? "#b0aba8"
                : isLeaf
                  ? "#bbf7d0"
                  : "#fef3c7",
            fontSize: node.state === "unselected" ? "9px" : "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            textShadow:
              node.state === "unselected"
                ? "0 1px 3px rgba(0,0,0,0.8)"
                : isLeaf
                  ? "0 0 8px rgba(74,222,128,0.5), 0 1px 3px rgba(0,0,0,0.9)"
                  : "0 0 8px rgba(232,184,75,0.5), 0 1px 3px rgba(0,0,0,0.9)",
            marginTop: `${cfg.radius * 60 + 6}px`,
          }}
        >
          {node.label}
        </div>
      </Html>
    </group>
  )
}
