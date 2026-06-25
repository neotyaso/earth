'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
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

// ─── Earth shaders ────────────────────────────────────────────────────────────

const earthVert = /* glsl */`
  varying vec3 v_norm;
  varying vec3 v_pos;
  void main() {
    v_norm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    v_pos  = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const earthFrag = /* glsl */`
  uniform float u_time;
  varying vec3 v_norm;

  float _h(vec2 p){p=fract(p*vec2(0.1031,0.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
  float _n(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(_h(i),_h(i+vec2(1,0)),f.x),mix(_h(i+vec2(0,1)),_h(i+vec2(1,1)),f.x),f.y);}
  float _fbm(vec2 p){float v=0.;float a=0.5;for(int i=0;i<5;i++){v+=a*_n(p);p*=2.1;a*=0.5;}return v;}

  void main() {
    vec3 n = normalize(v_norm);
    vec2 uv = vec2(atan(n.z, n.x) / 6.28318 + 0.5, n.y * 0.5 + 0.5);

    float land = _fbm(uv * 4.0 + vec2(1.7, 0.5)) * 1.7 - 0.38;
    vec3 ocean   = vec3(0.04, 0.13, 0.40);
    vec3 shallow = vec3(0.06, 0.22, 0.52);
    vec3 grass   = vec3(0.13, 0.28, 0.07);
    vec3 desert  = vec3(0.52, 0.40, 0.20);
    vec3 snow    = vec3(0.90, 0.93, 0.96);
    float dN = _fbm(uv * 6.0 + vec2(5.3, 2.1));
    vec3 landCol = mix(grass, desert, smoothstep(0.3, 0.7, dN));
    landCol = mix(landCol, snow, smoothstep(0.72, 0.90, abs(n.y)));
    vec3 waterCol = mix(ocean, shallow, smoothstep(0.32, 0.45, land) * 0.4);
    vec3 col = mix(waterCol, landCol, smoothstep(0.40, 0.54, land));

    // 2層の雲（速度と方向が違う）
    float cloud1 = _fbm(uv * 4.5 + vec2(u_time * 0.038, u_time * 0.018)) * 1.4 - 0.22;
    float cloud2 = _fbm(uv * 7.0 - vec2(u_time * 0.025, u_time * 0.042)) * 1.2 - 0.30;
    float cloud  = max(cloud1, cloud2 * 0.7);
    col = mix(col, vec3(0.96, 0.97, 1.00), smoothstep(0.50, 0.72, cloud) * 0.88);

    float diff = max(0.0, dot(n, normalize(vec3(0.8, 0.5, 0.6))));
    col *= 0.12 + diff * 0.88;
    col += vec3(0.01, 0.04, 0.14) * max(0., -dot(n, normalize(vec3(0.8,0.5,0.6)))) * 0.5;

    gl_FragColor = vec4(col, 1.0);
  }
`

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

export function Earth() {
  const groupRef   = useRef<THREE.Group>(null)
  const surfaceMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: earthVert,
    fragmentShader: earthFrag,
    uniforms: { u_time: { value: 0 } },
    side: THREE.DoubleSide,
  }), [])
  const atmMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmVert,
    fragmentShader: atmFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.018
      groupRef.current.visible    = spaceState.t > 0.04
    }
    surfaceMat.uniforms.u_time.value = state.clock.getElapsedTime()
  })

  return (
    <group ref={groupRef} position={[0, -150, -320]}>
      <mesh>
        <sphereGeometry args={[120, 72, 72]} />
        <primitive object={surfaceMat} attach="material" />
      </mesh>
      <mesh>
        <sphereGeometry args={[126, 36, 36]} />
        <primitive object={atmMat} attach="material" />
      </mesh>
    </group>
  )
}
