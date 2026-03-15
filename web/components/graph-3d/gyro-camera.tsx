"use client"
import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Quaternion } from "three"

type Props = {
  deltaQRef: React.RefObject<Quaternion>
  active: boolean
}

export function GyroCamera({ deltaQRef, active }: Props) {
  const { camera } = useThree()
  // Capture camera orientation at the moment gyro activates
  const baseQ = useRef(new Quaternion())
  const smoothQ = useRef(new Quaternion())

  useEffect(() => {
    if (active) {
      // Snapshot the current camera quaternion as the base
      baseQ.current.copy(camera.quaternion)
      smoothQ.current.copy(camera.quaternion)
    }
  }, [active, camera])

  useFrame(() => {
    if (!active) return
    // target = base orientation * delta from gyro
    const target = baseQ.current.clone().multiply(deltaQRef.current)
    // Smooth interpolation to avoid jitter
    smoothQ.current.slerp(target, 0.15)
    camera.quaternion.copy(smoothQ.current)
  })

  return null
}
