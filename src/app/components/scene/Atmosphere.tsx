'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { skyState, spaceState } from '../../state'

export function DynamicAtmosphere() {
  const { scene } = useThree()
  const dayCol   = useMemo(() => new THREE.Color(0xb8d8ea), [])
  const duskCol  = useMemo(() => new THREE.Color(0xe08050), [])
  const nightCol = useMemo(() => new THREE.Color(0x080e1c), [])
  const spaceCol = useMemo(() => new THREE.Color(0x000002), [])
  const tmp      = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000002, 0.0)
    return () => { scene.fog = null }
  }, [scene])

  useFrame(() => {
    const fog = scene.fog as THREE.FogExp2 | null
    if (!fog) return
    const p  = skyState.progress
    const st = spaceState.t
    if (p < 0.5) tmp.lerpColors(dayCol, duskCol, p * 2)
    else         tmp.lerpColors(duskCol, nightCol, (p - 0.5) * 2)
    fog.color.lerpColors(tmp, spaceCol, st)
    fog.density = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.014, 0.030, p), 0.003, st)
  })

  return null
}

export function DynamicLights() {
  const sunRef  = useRef<THREE.DirectionalLight>(null)
  const moonRef = useRef<THREE.DirectionalLight>(null)
  const ambRef  = useRef<THREE.AmbientLight>(null)

  useFrame(() => {
    const p = skyState.progress
    if (sunRef.current)  sunRef.current.intensity  = THREE.MathUtils.lerp(1.4, 0.0, p)
    if (moonRef.current) moonRef.current.intensity = THREE.MathUtils.lerp(0.0, 0.5, p)
    if (ambRef.current)  ambRef.current.intensity  = THREE.MathUtils.lerp(0.65, 0.08, p)
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.65} />
      <directionalLight ref={sunRef}  position={[8, 10, 6]}  intensity={1.4} color="#fff6e0" />
      <directionalLight ref={moonRef} position={[-5, 8, -3]} intensity={0}   color="#b0c8e8" />
    </>
  )
}
