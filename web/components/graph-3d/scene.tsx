"use client"
import { useEffect, useMemo, useRef } from "react"
import { CameraControls } from "@react-three/drei"
import { SphereNode } from "./sphere-node"
import { EdgeLine } from "./edge-line"
import { EdgeParticles } from "./edge-particles"
import { GyroCamera } from "./gyro-camera"
import type { Node3D, Edge3D } from "@/lib/graph-3d"
import type { RefObject } from "react"
import type { Quaternion } from "three"

type Props = {
  nodes: Node3D[]
  edges: Edge3D[]
  onHover: (id: string | null) => void
  deltaQRef: RefObject<Quaternion>
  gyroActive: boolean
}

export function GraphScene({
  nodes,
  edges,
  onHover,
  deltaQRef,
  gyroActive,
}: Props) {
  const cameraControlsRef = useRef<CameraControls>(null)

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const { center, minY, maxY } = useMemo(() => {
    if (nodes.length === 0)
      return {
        center: [0, 0, 0] as [number, number, number],
        minY: 0,
        maxY: 10,
      }
    const xs = nodes.map((n) => n.x)
    const ys = nodes.map((n) => n.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    return {
      center: [cx, cy, 0] as [number, number, number],
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }, [nodes])

  const treeHeight = maxY - minY
  // Dagre y+ = down: minY = root (生まれ), maxY = leaves
  const rootY = minY

  // Set initial camera: in front of the tree, looking up
  const cameraInitialized = useRef(false)
  useEffect(() => {
    if (
      !cameraControlsRef.current ||
      nodes.length === 0 ||
      cameraInitialized.current
    )
      return
    cameraInitialized.current = true
    cameraControlsRef.current.setLookAt(
      center[0],
      rootY - 1,
      treeHeight * 1.0, // in front, near ground level
      center[0],
      rootY + treeHeight * 0.5,
      0, // look at mid-trunk
      false
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length])

  function handleClickNode(node: Node3D) {
    cameraControlsRef.current?.setLookAt(
      node.x,
      node.y - 0.5,
      node.z + 4,
      node.x,
      node.y,
      node.z,
      true
    )
  }

  const selectedEdges = edges.filter((e) => e.isSelected)

  return (
    <>
      {/* Fog for depth */}
      <fog attach="fog" args={["#0a0a0f", 15, 45]} />

      <GyroCamera deltaQRef={deltaQRef} active={gyroActive} />

      {!gyroActive && (
        <CameraControls
          ref={cameraControlsRef}
          minDistance={2}
          maxDistance={35}
          makeDefault
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.7} color="#f5e9d0" />
      {/* Main warm uplight from root base — shines down through the tree */}
      <spotLight
        position={[center[0], minY - 2, 3]}
        target-position={[center[0], maxY, 0]}
        angle={0.7}
        penumbra={0.5}
        intensity={12}
        color="#f59e0b"
        distance={35}
        decay={1.0}
      />
      {/* Left spotlight — cool blue sweep across branches */}
      <spotLight
        position={[center[0] - 6, center[1] + 2, 5]}
        target-position={[center[0], center[1], 0]}
        angle={0.5}
        penumbra={0.7}
        intensity={6}
        color="#7dd3fc"
        distance={30}
        decay={1.2}
      />
      {/* Right spotlight — warm side fill */}
      <spotLight
        position={[center[0] + 6, center[1] + 2, 4]}
        target-position={[center[0], center[1], 0]}
        angle={0.5}
        penumbra={0.7}
        intensity={5}
        color="#fde68a"
        distance={30}
        decay={1.2}
      />
      {/* Top backlight from sky */}
      <directionalLight
        position={[center[0], maxY + 6, 8]}
        intensity={1.5}
        color="#bfdbfe"
      />
      {/* Green rim for leaf canopy */}
      <spotLight
        position={[center[0], maxY + 3, -4]}
        target-position={[center[0], maxY - 2, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={4}
        color="#86efac"
        distance={20}
        decay={1.5}
      />

      {/* Floor — under 生まれ (root = minY in Dagre coords) */}
      <mesh
        position={[center[0], minY - 0.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial
          color="#1a1208"
          emissive="#3d2a08"
          emissiveIntensity={0.15}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Root glow halo */}
      <mesh
        position={[center[0], minY - 0.58, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[2.5, 48]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.8}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Branches (edges) */}
      {edges.map((edge) => (
        <EdgeLine key={edge.id} edge={edge} nodesById={nodesById} />
      ))}

      {/* Particles only on selected path */}
      {selectedEdges.map((edge) => (
        <EdgeParticles key={`p-${edge.id}`} edge={edge} nodesById={nodesById} />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <SphereNode
          key={node.id}
          node={node}
          onHover={onHover}
          onClickNode={handleClickNode}
        />
      ))}
    </>
  )
}
