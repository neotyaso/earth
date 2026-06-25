'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../state'

const CAM_START  = new THREE.Vector3(0,  180,    5)
const CAM_CLOUD  = new THREE.Vector3(0, -113,  -286)
const CAM_OCEAN  = new THREE.Vector3(0,  4.8,  10.5)
const EARTH_CTR  = new THREE.Vector3(0, -150,  -320)
const HORIZON    = new THREE.Vector3(0,  1.2,    0)

function ss(t: number) { return t * t * (3 - 2 * t) }

export function CameraRig() {
  const { camera } = useThree()
  const mouse  = useRef({ x: 0, y: 0 })
  const lerped = useRef({ x: 0, y: 0 })

  useEffect(() => {
    camera.position.copy(CAM_START)
    camera.lookAt(EARTH_CTR)
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

    const p = scrollState.progress

    let pos: THREE.Vector3
    let lx: number, ly: number, lz: number

    if (p < 0.45) {
      const t = ss(Math.min(1, p / 0.45))
      pos = CAM_START.clone().lerp(CAM_CLOUD, t)
      lx = EARTH_CTR.x; ly = EARTH_CTR.y; lz = EARTH_CTR.z

    } else if (p < 0.65) {
      const t = ss((p - 0.45) / 0.20)
      pos = CAM_CLOUD.clone().lerp(CAM_OCEAN, t)
      lx = THREE.MathUtils.lerp(EARTH_CTR.x, HORIZON.x, t)
      ly = THREE.MathUtils.lerp(EARTH_CTR.y, HORIZON.y, t)
      lz = THREE.MathUtils.lerp(EARTH_CTR.z, HORIZON.z, t)

    } else {
      pos = CAM_OCEAN.clone()
      lx = HORIZON.x; ly = HORIZON.y; lz = HORIZON.z
    }

    const driftScale = p < 0.45 ? 0.06 : THREE.MathUtils.lerp(0.06, 0.45, (p - 0.45) / 0.20)
    pos.x += lerped.current.x * driftScale
    pos.y += lerped.current.y * (p < 0.45 ? -0.3 : -0.28)

    camera.position.copy(pos)
    camera.lookAt(lx + lerped.current.x * 0.04, ly, lz)

    // ─ 雲を抜けた後にくるくる回転 ─
    // scroll 0.45（雲突入）→ 0.65（海面）でロール
    if (p >= 0.45 && p < 0.65) {
      const t = (p - 0.45) / 0.20              // 0→1
      const roll = t * t * Math.PI * 2.5        // 加速しながら最大1.25回転
      camera.rotateZ(roll)
    }
  })

  return null
}
