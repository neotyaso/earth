'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { skyState, spaceState } from '../../state'

export function NightMoon() {
  const meshRef  = useRef<THREE.Mesh>(null)
  const matRef   = useRef<THREE.MeshStandardMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const p = skyState.progress
    const intensity = THREE.MathUtils.smoothstep(p, 0.55, 0.88)
    if (matRef.current)   matRef.current.emissiveIntensity = intensity * 1.2
    if (lightRef.current) lightRef.current.intensity       = intensity * 0.8
    if (meshRef.current)  meshRef.current.visible          = spaceState.t < 0.05 && p > 0.4
  })

  return (
    <group position={[-18, 14, -22]}>
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[1.8, 24, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color="#e8eeff"
          emissive="#c8d8ff"
          emissiveIntensity={0}
          roughness={0.9}
        />
      </mesh>
      <pointLight ref={lightRef} color="#b0c8ff" intensity={0} distance={80} />
    </group>
  )
}
