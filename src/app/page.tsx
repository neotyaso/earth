'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { LoadingScreen } from './components/LoadingScreen'

gsap.registerPlugin(ScrollTrigger)

const scrollState = { progress: 0 }

// ─── Sky Shader ───────────────────────────────────────────────────────────────

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
    gl_FragColor = vec4(col, 1.0);
  }
`

// ─── 3D Components ────────────────────────────────────────────────────────────

function DynamicSky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    uniforms: { u_progress: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
  }), [])
  useFrame(() => { mat.uniforms.u_progress.value = scrollState.progress })
  return (
    <mesh scale={80}>
      <sphereGeometry args={[1, 32, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function Stars() {
  const pointsRef = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 1800
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(Math.random())
      const r     = 68 + Math.random() * 6
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [])
  useFrame(() => {
    if (!pointsRef.current) return
    ;(pointsRef.current.material as THREE.PointsMaterial).opacity =
      THREE.MathUtils.smoothstep(scrollState.progress, 0.5, 0.9)
  })
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.16} color="#dde8ff" transparent opacity={0} sizeAttenuation />
    </points>
  )
}

// 月（夜に出現）
function Moon() {
  const meshRef  = useRef<THREE.Mesh>(null)
  const matRef   = useRef<THREE.MeshStandardMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const p = scrollState.progress
    const intensity = THREE.MathUtils.smoothstep(p, 0.55, 0.88)
    if (matRef.current)   matRef.current.emissiveIntensity = intensity * 1.2
    if (lightRef.current) lightRef.current.intensity = intensity * 0.8
    if (meshRef.current)  meshRef.current.visible = p > 0.4
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

function DynamicLights() {
  const sunRef  = useRef<THREE.DirectionalLight>(null)
  const moonRef = useRef<THREE.DirectionalLight>(null)
  const ambRef  = useRef<THREE.AmbientLight>(null)
  const { scene } = useThree()
  const fogDay   = useMemo(() => new THREE.Color('#b8d8f0'), [])
  const fogNight = useMemo(() => new THREE.Color('#0a1628'), [])
  useFrame(() => {
    const p = scrollState.progress
    if (sunRef.current)  sunRef.current.intensity  = THREE.MathUtils.lerp(1.4, 0.0, p)
    if (moonRef.current) moonRef.current.intensity = THREE.MathUtils.lerp(0.0, 0.5, p)
    if (ambRef.current)  ambRef.current.intensity  = THREE.MathUtils.lerp(0.65, 0.08, p)
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.lerpColors(fogDay, fogNight, p)
      scene.fog.near = THREE.MathUtils.lerp(14, 8, p)
      scene.fog.far  = THREE.MathUtils.lerp(36, 24, p)
    }
  })
  return (
    <>
      <ambientLight ref={ambRef} intensity={0.65} />
      <directionalLight ref={sunRef}  position={[8, 10, 6]}  intensity={1.4} color="#fff6e0" />
      <directionalLight ref={moonRef} position={[-5, 8, -3]} intensity={0}   color="#b0c8e8" />
    </>
  )
}

// Ocean — GPU波シェーダー（onBeforeCompile）
function Ocean() {
  const meshRef   = useRef<THREE.Mesh>(null)
  const shaderRef = useRef<{ uniforms: Record<string, { value: unknown }> } | null>(null)
  const dayCol    = useMemo(() => new THREE.Color('#3a7bc8'), [])
  const nightCol  = useMemo(() => new THREE.Color('#0d1f3a'), [])

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#3a7bc8', roughness: 0.08, metalness: 0.55 })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.u_time = { value: 0 }
      shaderRef.current = shader
      shader.vertexShader = 'uniform float u_time;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float wA = sin(position.x * 0.50 + u_time * 0.9) * 0.07;
        float wB = sin(position.y * 0.35 + u_time * 0.6) * 0.05;
        float wC = sin(position.x * 0.80 + position.y * 0.4 + u_time * 1.2) * 0.02;
        transformed.z += wA + wB + wC;`
      )
    }
    mat.customProgramCacheKey = () => 'enoshima-ocean'
    return mat
  }, [])

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.u_time.value = state.clock.getElapsedTime()
    }
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      const p = scrollState.progress
      mat.color.lerpColors(dayCol, nightCol, p)
      mat.metalness = THREE.MathUtils.lerp(0.55, 0.92, p)
    }
  })

  return (
    <mesh ref={meshRef} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
      <planeGeometry args={[50, 50, 100, 100]} />
    </mesh>
  )
}

// 鳥居（夜に自発光）
function ToriiGate() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const sharedMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#b83228', roughness: 0.5, metalness: 0.15,
    emissive: new THREE.Color('#b83228'), emissiveIntensity: 0,
  }), [])

  useFrame(() => {
    if (!matRef.current) return
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(0, 0.5, scrollState.progress)
  })

  return (
    <group position={[0, 0.6, 1.25]}>
      {[-0.22, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} material={sharedMat}>
          <cylinderGeometry args={[0.03, 0.036, 0.65, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.35, 0]} material={sharedMat}>
        <boxGeometry args={[0.58, 0.055, 0.065]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={sharedMat}>
        <boxGeometry args={[0.46, 0.038, 0.05]} />
      </mesh>
      {/* matRefをsharedMatに接続するためのダミーmesh */}
      <primitive object={sharedMat} ref={matRef} attach={undefined} />
    </group>
  )
}

function Island() {
  const groupRef = useRef<THREE.Group>(null)
  useEffect(() => {
    if (!groupRef.current) return
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.terrain) {
        const geo = child.geometry, pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i,
            pos.getX(i) + (Math.random() - 0.5) * 0.12,
            pos.getY(i) + (Math.random() - 0.5) * 0.08,
            pos.getZ(i) + (Math.random() - 0.5) * 0.12,
          )
        }
        geo.computeVertexNormals()
      }
    })
  }, [])
  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.1, 0]} userData={{ terrain: true }}>
        <coneGeometry args={[2.6, 1.3, 16, 6]} />
        <meshStandardMaterial color="#6b8c4a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.52, 0]} userData={{ terrain: true }}>
        <coneGeometry args={[1.7, 1.0, 14, 5]} />
        <meshStandardMaterial color="#4a7a35" roughness={0.9} />
      </mesh>
      <mesh position={[0.9, -0.18, 0.6]} userData={{ terrain: true }}>
        <coneGeometry args={[0.65, 0.55, 8, 3]} />
        <meshStandardMaterial color="#7a6b5a" roughness={1.0} />
      </mesh>
      <mesh position={[-0.8, -0.25, -0.5]} userData={{ terrain: true }}>
        <coneGeometry args={[0.45, 0.4, 7, 3]} />
        <meshStandardMaterial color="#6e6258" roughness={1.0} />
      </mesh>
      {([[-0.3, 1.0, 0.35], [0.45, 0.78, -0.3], [-0.52, 0.68, -0.18]] as [number,number,number][]).map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh><cylinderGeometry args={[0.035, 0.055, 0.42, 6]} /><meshStandardMaterial color="#5a3a1a" roughness={1} /></mesh>
          <mesh position={[0, 0.3, 0]}><coneGeometry args={[0.2, 0.42, 6]} /><meshStandardMaterial color="#2d5a20" roughness={0.9} /></mesh>
        </group>
      ))}
      <ToriiGate />
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const mouse  = useRef({ x: 0, y: 0 })
  const lerped = useRef({ x: 0, y: 0 })
  useEffect(() => {
    camera.position.set(5, 3, 5)
    camera.lookAt(0, 0, 0)
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [camera])
  useFrame(() => {
    lerped.current.x += (mouse.current.x - lerped.current.x) * 0.04
    lerped.current.y += (mouse.current.y - lerped.current.y) * 0.04
    const p = scrollState.progress
    camera.position.x = THREE.MathUtils.lerp(5, -4, p) + lerped.current.x * 0.6
    camera.position.y = THREE.MathUtils.lerp(3, 2.2, p) + lerped.current.y * -0.3
    camera.position.z = THREE.MathUtils.lerp(5, 3.8, p)
    camera.lookAt(0, 0.3, 0)
  })
  return null
}

// ─── UI Overlays ──────────────────────────────────────────────────────────────

function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pos    = { x: -100, y: -100 }
    const lerped = { x: -100, y: -100 }
    let raf: number

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
    }
    const loop = () => {
      lerped.x += (pos.x - lerped.x) * 0.1
      lerped.y += (pos.y - lerped.y) * 0.1
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${lerped.x - 18}px, ${lerped.y - 18}px)`
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.x - 3}px, ${pos.y - 3}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
        width: 36, height: 36, borderRadius: '50%',
        border: '1px solid rgba(201,168,76,0.6)',
        pointerEvents: 'none', mixBlendMode: 'screen',
        transition: 'width 0.2s, height 0.2s',
      }} />
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
        width: 6, height: 6, borderRadius: '50%',
        background: '#c9a84c', pointerEvents: 'none',
      }} />
    </>
  )
}

function ScrollIndicator() {
  const fillRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf: number
    const loop = () => {
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${scrollState.progress})`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div style={{
      position: 'fixed', right: '2rem', top: '50%',
      transform: 'translateY(-50%)',
      height: 72, width: 1,
      background: 'rgba(201,168,76,0.18)',
      zIndex: 10, pointerEvents: 'none',
    }}>
      <div ref={fillRef} style={{
        width: '100%', height: '100%',
        background: '#c9a84c', transformOrigin: 'top',
        transform: 'scaleY(0)',
      }} />
    </div>
  )
}

// ─── Story Overlay ────────────────────────────────────────────────────────────

function StoryOverlay({ loaded }: { loaded: boolean }) {
  const heroLabelRef = useRef<HTMLParagraphElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubRef   = useRef<HTMLParagraphElement>(null)
  const sec2Ref      = useRef<HTMLDivElement>(null)
  const sec3Ref      = useRef<HTMLDivElement>(null)
  const outroRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loaded) return
    const tl = gsap.timeline({ delay: 0.2 })
    tl.fromTo(heroLabelRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
    )
    tl.fromTo(heroTitleRef.current,
      { opacity: 0, y: 50, skewY: 2 },
      { opacity: 1, y: 0, skewY: 0, duration: 1.1, ease: 'power3.out' },
      '-=0.3'
    )
    tl.fromTo(heroSubRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.4'
    )
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    const ctx = gsap.context(() => {
      gsap.fromTo(sec2Ref.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, scrollTrigger: { trigger: '#sec2', start: 'top 70%', end: 'top 20%', scrub: 0.6 } }
      )
      gsap.to(sec2Ref.current, {
        opacity: 0, y: -30,
        scrollTrigger: { trigger: '#sec2', start: 'bottom 60%', end: 'bottom 10%', scrub: 0.6 }
      })
      gsap.fromTo(sec3Ref.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, scrollTrigger: { trigger: '#sec3', start: 'top 70%', end: 'top 25%', scrub: 0.6 } }
      )
      gsap.to(sec3Ref.current, {
        opacity: 0, y: -30,
        scrollTrigger: { trigger: '#sec3', start: 'bottom 65%', end: 'bottom 15%', scrub: 0.6 }
      })
      gsap.fromTo(outroRef.current,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, scrollTrigger: { trigger: '#sec4', start: 'top 60%', end: 'top 10%', scrub: 0.8 } }
      )
    })
    return () => ctx.revert()
  }, [loaded])

  const ja: React.CSSProperties = { fontFamily: 'var(--font-ja)', fontWeight: 300, letterSpacing: '0.1em', lineHeight: 2.4, textShadow: '0 2px 24px rgba(0,0,0,0.9)' }
  const en: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 300, letterSpacing: '0.3em', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }

  return (
    <>
      <section style={{ height: '120vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 6vw 9vh' }}>
        <p ref={heroLabelRef} style={{ ...en, fontSize: 'clamp(0.55rem, 1.1vw, 0.75rem)', color: '#c9a84c', marginBottom: '1rem', opacity: 0 }}>
          KANAGAWA, JAPAN
        </p>
        <h1 ref={heroTitleRef} style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.8rem, 11vw, 10rem)', fontWeight: 300, letterSpacing: '0.04em', color: '#fff', lineHeight: 0.88, opacity: 0 }}>
          ENOSHIMA
        </h1>
        <p ref={heroSubRef} style={{ ...ja, fontSize: 'clamp(0.75rem, 1.6vw, 0.95rem)', letterSpacing: '0.45em', color: 'rgba(245,240,232,0.7)', marginTop: '1.2rem', opacity: 0 }}>
          海と光が交わる島へ
        </p>
      </section>

      <section id="sec2" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6vw' }}>
        <div ref={sec2Ref} style={{ maxWidth: '380px', textAlign: 'right' }}>
          <p style={{ ...ja, fontSize: 'clamp(1rem, 2.2vw, 1.3rem)', color: 'rgba(245,240,232,0.92)' }}>
            海と光と、島のけはい。<br />
            波音とともに、旅がはじまる。
          </p>
          <p style={{ ...en, fontSize: 'clamp(0.55rem, 1vw, 0.7rem)', color: '#c9a84c', marginTop: '1.5rem', letterSpacing: '0.4em' }}>
            THE JOURNEY BEGINS
          </p>
        </div>
      </section>

      <section id="sec3" style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 6vw' }}>
        <div ref={sec3Ref} style={{ maxWidth: '400px' }}>
          <p style={{ ...en, fontSize: 'clamp(0.55rem, 1vw, 0.7rem)', color: '#c9a84c', letterSpacing: '0.4em', marginBottom: '1.2rem' }}>
            NIGHTFALL
          </p>
          <p style={{ ...ja, fontSize: 'clamp(1rem, 2.2vw, 1.3rem)', color: 'rgba(245,240,232,0.88)' }}>
            夜が深まるにつれ、<br />
            島は別の顔を見せはじめる。
          </p>
        </div>
      </section>

      <section id="sec4" style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={outroRef} style={{ textAlign: 'center' }}>
          <p style={{ ...en, fontSize: 'clamp(3rem, 8vw, 7rem)', color: '#fff', letterSpacing: '0.25em', lineHeight: 1 }}>
            ENOSHIMA
          </p>
          <p style={{ fontFamily: 'var(--font-ja)', fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)', color: '#c9a84c', letterSpacing: '0.6em', marginTop: '1.2rem', fontWeight: 300 }}>
            光と影が交わる場所
          </p>
          <div style={{ width: 1, height: 48, background: 'rgba(201,168,76,0.4)', margin: '2rem auto 0' }} />
        </div>
      </section>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const handleLoadComplete = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { scrollState.progress = self.progress },
    })
    return () => trigger.kill()
  }, [])

  return (
    <main>
      <LoadingScreen onComplete={handleLoadComplete} />
      <CustomCursor />
      <ScrollIndicator />

      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1s ease' }}>
        {/* 3Dキャンバス — dprを1.5に制限してRetina負荷を削減 */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <Canvas dpr={[1, 1.5]} camera={{ position: [5, 3, 5], fov: 55 }}>
            <fog attach="fog" args={['#b8d8f0', 14, 36]} />
            <DynamicSky />
            <Stars />
            <Moon />
            <DynamicLights />
            <CameraRig />
            <Ocean />
            <Island />
            <EffectComposer>
              <Bloom intensity={0.45} luminanceThreshold={0.45} luminanceSmoothing={0.9} />
              <Noise opacity={0.028} />
              <Vignette eskil={false} offset={0.18} darkness={0.55} />
            </EffectComposer>
          </Canvas>
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '45vh',
          background: 'linear-gradient(to top, rgba(10,22,40,0.6) 0%, transparent 100%)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        <div id="scroll-container" style={{ position: 'relative', zIndex: 2, height: '400vh' }}>
          <StoryOverlay loaded={loaded} />
        </div>
      </div>
    </main>
  )
}
