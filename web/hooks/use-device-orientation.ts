"use client"
import { useState, useEffect, useRef } from "react"
import { Euler, Quaternion, MathUtils } from "three"

// Returns a ref that holds the delta quaternion from the moment gyro was activated.
// This makes phone rotation feel relative (not compass-absolute).
export function useDeviceOrientation() {
  const deltaQRef = useRef<Quaternion>(new Quaternion())
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [supported] = useState(
    () => typeof window !== "undefined" && "DeviceOrientationEvent" in window
  )

  const requestPermission = async () => {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">
    }
    if (typeof DOE.requestPermission === "function") {
      const result = await DOE.requestPermission()
      if (result === "granted") setPermissionGranted(true)
    } else {
      // Android — no permission prompt needed
      setPermissionGranted(true)
    }
  }

  useEffect(() => {
    if (!permissionGranted) return

    let referenceQ: Quaternion | null = null

    const toQ = (alpha: number, beta: number, gamma: number): Quaternion => {
      const e = new Euler(
        MathUtils.degToRad(beta - 90),
        MathUtils.degToRad(alpha),
        MathUtils.degToRad(-gamma),
        "YXZ"
      )
      return new Quaternion().setFromEuler(e)
    }

    const handler = (e: DeviceOrientationEvent) => {
      const a = e.alpha ?? 0
      const b = e.beta ?? 0
      const g = e.gamma ?? 0
      const currentQ = toQ(a, b, g)

      if (!referenceQ) {
        // Capture the very first reading as the reference (zero-point)
        referenceQ = currentQ.clone()
      }

      // Delta = reference^-1 * current
      // This gives rotation relative to where the user started
      deltaQRef.current = referenceQ.clone().invert().multiply(currentQ)
    }

    window.addEventListener("deviceorientation", handler, true)
    return () => window.removeEventListener("deviceorientation", handler, true)
  }, [permissionGranted])

  return { deltaQRef, supported, permissionGranted, requestPermission }
}
