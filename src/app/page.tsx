'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField, ChromaticAberration } from '@react-three/postprocessing'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import * as THREE from 'three'

import { scrollState, skyState, spaceState, skyFromScroll } from './state'
import { DynamicSky }       from './components/scene/Sky'
import { DynamicAtmosphere, DynamicLights } from './components/scene/Atmosphere'
import { Stars, Earth, WireArms } from './components/scene/Space'
import { Ocean }            from './components/scene/Ocean'
import { CameraRig }        from './components/scene/CameraRig'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const handleLoadComplete = useCallback(() => setLoaded(true), [])
  const burnRef = useRef<HTMLDivElement>(null)

  // 大気圏突入燃焼オーバーレイ
  useEffect(() => {
    let raf: number
    function update() {
      if (burnRef.current) {
        const p = scrollState.progress
        // scroll 0.38→0.65 でベル曲線 (ピーク 0.515)
        let intensity = 0
        if (p >= 0.38 && p <= 0.65) {
          const t = (p - 0.38) / 0.27
          intensity = Math.sin(t * Math.PI)
        }
        burnRef.current.style.opacity = String(intensity)
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      history.scrollRestoration = 'manual'
      window.scrollTo(0, 0)
    }
  }, [])

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollState.progress = self.progress
        spaceState.t = Math.max(0, Math.min(1, (0.55 - self.progress) / 0.13))
        skyState.progress = skyFromScroll(self.progress)
      },
    })
    ScrollTrigger.refresh()
    return () => trigger.kill()
  }, [])

  return (
    <main>
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 200, 5], fov: 60 }}
            gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            onCreated={() => handleLoadComplete()}
          >
            <DynamicAtmosphere />
            <DynamicSky />
            <Stars />
            <WireArms />
            <Earth />
            <DynamicLights />
            <CameraRig />
            <Environment preset="night" background={false} />
            <Ocean />
            <EffectComposer>
              <ChromaticAberration offset={new THREE.Vector2(0.0014, 0.0014)} />
              <DepthOfField focusDistance={0.009} focalLength={0.018} bokehScale={0.3} />
              <Bloom intensity={0.25} luminanceThreshold={0.65} luminanceSmoothing={0.85} />
              <Noise opacity={0.032} />
              <Vignette eskil={false} offset={0.16} darkness={0.40} />
            </EffectComposer>
          </Canvas>
        </div>

        {/* 大気圏燃焼オーバーレイ */}
        <div ref={burnRef} style={{
          position: 'fixed', inset: 0, zIndex: 3,
          pointerEvents: 'none', opacity: 0,
          mixBlendMode: 'screen',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,140,20,0.55) 0%, rgba(220,60,0,0.40) 35%, rgba(160,20,0,0.20) 65%, transparent 85%)',
          boxShadow: 'inset 0 0 180px rgba(255,90,0,0.50), inset 0 0 60px rgba(255,200,0,0.25)',
        }} />

        <div id="scroll-container" style={{ position: 'relative', zIndex: 2, height: '800vh' }} />
      </div>
    </main>
  )
}
