'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { spaceState } from '../../state'

export function Stars() {
  const pointsRef = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 8000
    const pos   = new Float32Array(count * 3)
    const col   = new Float32Array(count * 3)
    const colors = [
      [0.85, 0.90, 1.00],  // 青白
      [1.00, 0.95, 0.80],  // 黄白
      [1.00, 0.80, 0.70],  // 赤みがかり
      [0.80, 0.85, 1.00],  // 青
    ]
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 400 + Math.random() * 60
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      const c = colors[Math.floor(Math.random() * colors.length)]
      col[i * 3]     = c[0]
      col[i * 3 + 1] = c[1]
      col[i * 3 + 2] = c[2]
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    return geo
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const mat = pointsRef.current.material as THREE.PointsMaterial
    // 宇宙フェーズのみ表示。大気圏突入前（spaceState.t 1.0→0.70）でフェードアウト
    mat.opacity = THREE.MathUtils.smoothstep(spaceState.t, 0.70, 1.0)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={2.0}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation={false}
      />
    </points>
  )
}

export function SpaceMoon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.visible = spaceState.t > 0.05
  })
  return (
    <group ref={ref} position={[32, 212, -52]}>
      {/* 月本体: 金色 */}
      <mesh>
        <sphereGeometry args={[22, 64, 64]} />
        <meshStandardMaterial
          color="#d4a53a"
          roughness={0.85}
          metalness={0.08}
          emissive="#c49020"
          emissiveIntensity={0.22}
        />
      </mesh>
      {/* 薄いグロー */}
      <mesh>
        <sphereGeometry args={[24, 32, 32]} />
        <meshBasicMaterial color="#e8c040" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* 点光源 */}
      <pointLight color="#ffe090" intensity={3.5} distance={280} decay={1.8} />
    </group>
  )
}

// ─── Atmosphere shader (rim glow) ─────────────────────────────────────────────

const atmVert = /* glsl */`
  varying vec3 v_norm;
  varying vec3 v_pos;
  void main() {
    v_norm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    v_pos  = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmFrag = /* glsl */`
  varying vec3 v_norm;
  varying vec3 v_pos;
  void main() {
    vec3 vd = normalize(cameraPosition - v_pos);
    float rim = 1.0 - abs(dot(normalize(v_norm), vd));
    rim = pow(rim, 1.6);
    gl_FragColor = vec4(vec3(0.88, 0.91, 0.95), rim * 0.45);
  }
`

// シード固定の擬似乱数
function makePRNG(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

// 骨格セグメントに沿ってランダムな曲線を大量生成
function buildOrganicLines(
  bones: { a: THREE.Vector3; b: THREE.Vector3; count: number; spread: number }[],
  rng: () => number,
  out: number[],
  pts = 10,
) {
  for (const { a, b, count, spread } of bones) {
    for (let i = 0; i < count; i++) {
      const segs = 3 + Math.floor(rng() * 3)
      const ctrl: THREE.Vector3[] = []
      for (let j = 0; j <= segs; j++) {
        const t = j / segs
        const base = new THREE.Vector3().lerpVectors(a, b, t)
        ctrl.push(new THREE.Vector3(
          base.x + (rng() - 0.5) * spread,
          base.y + (rng() - 0.5) * spread * 0.6,
          base.z + (rng() - 0.5) * spread * 1.2,
        ))
      }
      const curve = new THREE.CatmullRomCurve3(ctrl)
      const cp = curve.getPoints(pts)
      for (let k = 0; k < cp.length - 1; k++) {
        out.push(cp[k].x, cp[k].y, cp[k].z, cp[k+1].x, cp[k+1].y, cp[k+1].z)
      }
    }
  }
}

export function WireArms() {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (ref.current) ref.current.visible = spaceState.t > 0.04
  })

  const geometry = useMemo(() => {
    const rng = makePRNG(55577)

    // グループ原点 = 地球中心 world(0,-150,-320)
    // 腕は後方(-Z)から伸び、掌が地球左右側面に来て指が前方(+Z)へ巻きつく

    // ── 左腕（左側面から握る） ──
    const L_ELB  = new THREE.Vector3(-240,  -20, -190)
    const L_WRI  = new THREE.Vector3(-145,  -20,  -55)
    const L_PALM = new THREE.Vector3(-122,  -15,   10)
    // 各指: 第一関節(1) → 第二関節(2) → 先端(3) の3関節
    // 2はちょうど1と3の中間点 → 形は変わらずカーブが滑らかに
    const L_T1   = new THREE.Vector3( -93,  -55,  -12) // 親指・第一関節
    const L_T2   = new THREE.Vector3( -93,  -70,   -2) // 親指・第二関節
    const L_T3   = new THREE.Vector3( -67,  -97,   10) // 親指・先端
    const L_I1   = new THREE.Vector3(-107,   55,   28) // 人差し指・第一関節
    const L_I2   = new THREE.Vector3(-109,   77,   57) // 人差し指・第二関節
    const L_I3   = new THREE.Vector3( -85,  100,   87) // 人差し指・先端
    const L_M1   = new THREE.Vector3(-107,   38,   45) // 中指・第一関節
    const L_M2   = new THREE.Vector3(-105,   62,   77) // 中指・第二関節
    const L_M3   = new THREE.Vector3( -77,   86,  109) // 中指・先端（最長）
    const L_R1   = new THREE.Vector3(-107,   18,   58) // 薬指・第一関節
    const L_R2   = new THREE.Vector3(-109,   40,   87) // 薬指・第二関節
    const L_R3   = new THREE.Vector3( -85,   62,  116) // 薬指・先端
    const L_P1   = new THREE.Vector3(-107,   -2,   68) // 小指・第一関節
    const L_P2   = new THREE.Vector3(-111,   16,   92) // 小指・第二関節
    const L_P3   = new THREE.Vector3( -89,   34,  116) // 小指・先端

    // ── 右腕（左の鏡像） ──
    const R_ELB  = new THREE.Vector3( 240,  -20, -190)
    const R_WRI  = new THREE.Vector3( 145,  -20,  -55)
    const R_PALM = new THREE.Vector3( 122,  -15,   10)
    // 各指: 第一関節(1) → 第二関節(2) → 先端(3) の3関節
    // 2はちょうど1と3の中間点 → 形は変わらずカーブが滑らかに
    const R_T1   = new THREE.Vector3(  93,  -55,  -12)
    const R_T2   = new THREE.Vector3(  93,  -70,   -2)
    const R_T3   = new THREE.Vector3(  67,  -97,   10)
    const R_I1   = new THREE.Vector3( 107,   55,   28)
    const R_I2   = new THREE.Vector3( 109,   77,   57)
    const R_I3   = new THREE.Vector3(  85,  100,   87)
    const R_M1   = new THREE.Vector3( 107,   38,   45)
    const R_M2   = new THREE.Vector3( 105,   62,   77)
    const R_M3   = new THREE.Vector3(  77,   86,  109)
    const R_R1   = new THREE.Vector3( 107,   18,   58)
    const R_R2   = new THREE.Vector3( 109,   40,   87)
    const R_R3   = new THREE.Vector3(  85,   62,  116)
    const R_P1   = new THREE.Vector3( 107,   -2,   68)
    const R_P2   = new THREE.Vector3( 111,   16,   92)
    const R_P3   = new THREE.Vector3(  89,   34,  116)

    const bones = [
      // 左腕
      { a: L_ELB,  b: L_WRI,  count: 100, spread: 50 },
      { a: L_WRI,  b: L_PALM, count: 96, spread: 30 },
      // 左5本指（3関節）
      { a: L_PALM, b: L_T1,   count: 22, spread: 14 },
      { a: L_T1,   b: L_T2,   count: 16, spread:  9 },
      { a: L_T2,   b: L_T3,   count: 14, spread:  7 },
      { a: L_PALM, b: L_I1,   count: 22, spread: 13 },
      { a: L_I1,   b: L_I2,   count: 26, spread:  12 },
      { a: L_I2,   b: L_I3,   count: 23, spread:  9 },
      { a: L_PALM, b: L_M1,   count: 22, spread: 13 },
      { a: L_M1,   b: L_M2,   count: 16, spread:  9 },
      { a: L_M2,   b: L_M3,   count: 14, spread:  7 },
      { a: L_PALM, b: L_R1,   count: 20, spread: 12 },
      { a: L_R1,   b: L_R2,   count: 15, spread:  8 },
      { a: L_R2,   b: L_R3,   count: 13, spread:  6 },
      { a: L_PALM, b: L_P1,   count: 18, spread: 11 },
      { a: L_P1,   b: L_P2,   count: 13, spread:  7 },
      { a: L_P2,   b: L_P3,   count: 11, spread:  5 },
      // 右腕
      { a: R_ELB,  b: R_WRI,  count: 100, spread: 50 },
      { a: R_WRI,  b: R_PALM, count: 96, spread: 30 },
      // 右5本指（3関節）
      { a: R_PALM, b: R_T1,   count: 22, spread: 14 },
      { a: R_T1,   b: R_T2,   count: 16, spread:  9 },
      { a: R_T2,   b: R_T3,   count: 14, spread:  7 },
      { a: R_PALM, b: R_I1,   count: 22, spread: 13 },
      { a: R_I1,   b: R_I2,   count: 16, spread:  9 },
      { a: R_I2,   b: R_I3,   count: 14, spread:  7 },
      { a: R_PALM, b: R_M1,   count: 22, spread: 13 },
      { a: R_M1,   b: R_M2,   count: 16, spread:  9 },
      { a: R_M2,   b: R_M3,   count: 14, spread:  7 },
      { a: R_PALM, b: R_R1,   count: 20, spread: 12 },
      { a: R_R1,   b: R_R2,   count: 15, spread:  8 },
      { a: R_R2,   b: R_R3,   count: 13, spread:  6 },
      { a: R_PALM, b: R_P1,   count: 18, spread: 11 },
      { a: R_P1,   b: R_P2,   count: 13, spread:  7 },
      { a: R_P2,   b: R_P3,   count: 11, spread:  5 },
    ]

    const positions: number[] = []
    buildOrganicLines(bones, rng, positions, 12)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  const mat = useMemo(() => new THREE.LineBasicMaterial({
    color: new THREE.Color('#ffffff'),
    transparent: true,
    opacity: 0.80,
  }), [])

  return (
    <group ref={ref} position={[0, -150, -320]}>
      <lineSegments geometry={geometry} material={mat} />
    </group>
  )
}

export function Earth() {
  const groupRef  = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmMat    = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmVert,
    fragmentShader: atmFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [])

  const [dayMap, specMap, nightMap] = useTexture([
    '/textures/earth/earth_day.jpg',
    '/textures/earth/earth_specular.jpg',
    '/textures/earth/earth_night.png',
  ])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.018
      groupRef.current.visible    = spaceState.t > 0.04
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.024
    }
  })

  return (
    <group ref={groupRef} position={[0, -150, -320]}>
      {/* Earth専用の太陽光（シーンのライトと独立） */}
      <directionalLight position={[300, 200, 400]} intensity={9.0} color="#fff8f0" />
      <ambientLight intensity={0.18} />
      {/* 地表 */}
      <mesh>
        <sphereGeometry args={[120, 72, 72]} />
        <meshPhongMaterial
          map={dayMap}
          specularMap={specMap}
          specular={new THREE.Color(0x336688)}
          shininess={40}
          emissiveMap={nightMap}
          emissive={new THREE.Color(0xffaa40)}
          emissiveIntensity={0.9}
        />
      </mesh>
      {/* 雲レイヤー（白い半透明球） */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[122, 48, 48]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      {/* 大気圏リムグロー */}
      <mesh>
        <sphereGeometry args={[126, 36, 36]} />
        <primitive object={atmMat} attach="material" />
      </mesh>
    </group>
  )
}
