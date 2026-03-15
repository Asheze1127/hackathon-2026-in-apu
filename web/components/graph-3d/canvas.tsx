"use client"
import { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { GraphScene } from "./scene"
import { use3DGraphState } from "@/hooks/use-3d-graph-state"
import { useDeviceOrientation } from "@/hooks/use-device-orientation"

export function Graph3DCanvas() {
  const { nodes, edges, handleHover } = use3DGraphState()
  const { deltaQRef, supported, permissionGranted, requestPermission } =
    useDeviceOrientation()
  const [gyroActive, setGyroActive] = useState(false)

  async function handleGyroButton() {
    if (!permissionGranted) {
      await requestPermission()
      setGyroActive(true)
    } else {
      setGyroActive((v) => !v)
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 50, position: [0, 0, 14] }}
        frameloop="always"
        style={{ background: "#0a0a0f", width: "100%", height: "100%" }}
      >
        <GraphScene
          nodes={nodes}
          edges={edges}
          onHover={handleHover}
          deltaQRef={deltaQRef}
          gyroActive={gyroActive}
        />
      </Canvas>

      {/* HTTP warning — gyroscope requires HTTPS on iOS */}
      {supported &&
        typeof window !== "undefined" &&
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost" && (
          <div
            style={{
              position: "absolute",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(220,38,38,0.85)",
              color: "#fff",
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "8px",
              whiteSpace: "nowrap",
            }}
          >
            ⚠️ Gyro requires HTTPS
          </div>
        )}

      {/* Gyro button — only shown on devices that support DeviceOrientationEvent */}
      {supported && (
        <button
          onClick={handleGyroButton}
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: gyroActive
              ? "rgba(251,191,36,0.15)"
              : "rgba(10,10,15,0.75)",
            border: `1px solid ${gyroActive ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.15)"}`,
            color: gyroActive ? "#fbbf24" : "#d1d5db",
            fontSize: "14px",
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: "24px",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
            boxShadow: gyroActive ? "0 0 16px rgba(251,191,36,0.3)" : "none",
            letterSpacing: "0.02em",
          }}
        >
          {gyroActive ? "🔄 Gyro ON" : "📱 Enable gyro"}
        </button>
      )}
    </div>
  )
}
