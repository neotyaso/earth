'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { skyState, spaceState } from '../../state'

const skyVert = /* glsl */`
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const skyFrag = /* glsl */`
  uniform float u_progress;
  uniform float u_space;
  varying vec3 vWorldPos;
  void main() {
    float h = normalize(vWorldPos).y;
    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
    vec3 dayTop   = vec3(0.28, 0.58, 0.92);
    vec3 dayBot   = vec3(0.72, 0.88, 1.0);
    vec3 duskTop  = vec3(0.08, 0.12, 0.38);
    vec3 duskBot  = vec3(0.90, 0.30, 0.06);
    vec3 nightTop = vec3(0.02, 0.04, 0.13);
    vec3 nightBot = vec3(0.04, 0.07, 0.18);
    float p1 = smoothstep(0.0, 0.55, u_progress);
    float p2 = smoothstep(0.45, 1.0, u_progress);
    vec3 top = mix(mix(dayTop, duskTop, p1), nightTop, p2);
    vec3 bot = mix(mix(dayBot, duskBot, p1), nightBot, p2);
    vec3 col = mix(bot, top, t);
    float glow = exp(-12.0 * abs(h)) * (1.0 - p2) * p1 * 0.6;
    col += vec3(1.0, 0.45, 0.1) * glow;

    // 宇宙フェーズ: 黒へブレンド
    col = mix(col, vec3(0.0, 0.0, 0.01), u_space * 0.96);

    // 大気圏突入グロー (u_space 0.75→0.15 の区間)
    float reentry = smoothstep(0.75, 0.45, u_space) * smoothstep(0.15, 0.45, u_space);
    col += vec3(0.95, 0.32, 0.04) * exp(-abs(h + 0.1) * 4.5) * reentry * 2.2;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function DynamicSky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    uniforms: { u_progress: { value: 0 }, u_space: { value: 1.0 } },
    side: THREE.BackSide,
    depthWrite: false,
  }), [])

  useFrame(() => {
    mat.uniforms.u_progress.value = skyState.progress
    mat.uniforms.u_space.value    = spaceState.t
  })

  return (
    <mesh scale={500}>
      <sphereGeometry args={[1, 32, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
