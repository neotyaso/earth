'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../state'

export function CameraRig() {
  const { camera } = useThree()
  const mouse  = useRef({ x: 0, y: 0 })
  const lerped = useRef({ x: 0, y: 0 })

  useEffect(() => {
    camera.position.set(0, 200, 5)
    camera.lookAt(0, -150, -320)  // 宇宙から地球を見下ろす
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [camera])

  useFrame(() => {
    lerped.current.x += (mouse.current.x - lerped.current.x) * 0.018
    lerped.current.y += (mouse.current.y - lerped.current.y) * 0.018

    const rp  = Math.min(1, scrollState.progress / 0.25)
    const rps = rp * rp * (3 - 2 * rp)

    // 位置: 宇宙(0,200,5) → 海面(0,4.8,10.5)
    const mx = lerped.current.x * THREE.MathUtils.lerp(0.06, 0.45, rps)
    const my = lerped.current.y * THREE.MathUtils.lerp(-0.4, -0.28, rps)
    const px = THREE.MathUtils.lerp(0,   0,    rps) + mx
    const py = THREE.MathUtils.lerp(200, 4.8,  rps) + my
    const pz = THREE.MathUtils.lerp(5,  10.5,  rps)

    // LookAt:
    //   rps 0→0.65: 地球(0,-150,-320)を追う
    //   rps 0.65→1: 水平線(0,1.2,0)へ遷移
    let lx: number, ly: number, lz: number
    if (rps < 0.65) {
      lx = 0; ly = -150; lz = -320
    } else {
      const t = THREE.MathUtils.smoothstep((rps - 0.65) / 0.35, 0, 1)
      lx = THREE.MathUtils.lerp(0,    lerped.current.x * 0.08, t)
      ly = THREE.MathUtils.lerp(-150, 1.2,  t)
      lz = THREE.MathUtils.lerp(-320, 0,    t)
    }

    camera.position.set(px, py, pz)
    camera.lookAt(lx, ly, lz)
  })

  return null
}
