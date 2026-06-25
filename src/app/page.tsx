'use client'

import { useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField, ChromaticAberration } from '@react-three/postprocessing'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import * as THREE from 'three'

import { scrollState, skyState, spaceState, skyFromScroll } from './state'
import { DynamicSky }       from './components/scene/Sky'
import { DynamicAtmosphere, DynamicLights } from './components/scene/Atmosphere'
import { Stars, Earth }                      from './components/scene/Space'
import { Ocean }            from './components/scene/Ocean'
import { CameraRig }        from './components/scene/CameraRig'
import { OceanAudio }       from './components/scene/OceanAudio'
import { CustomCursor }     from './components/ui/CustomCursor'
import { ScrollIndicator }  from './components/ui/ScrollIndicator'
import { HeroSection }      from './components/sections/HeroSection'
import { AboutSection }     from './components/sections/AboutSection'
import { WorkSection }      from './components/sections/WorkSection'
import { ContactSection }   from './components/sections/ContactSection'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const handleLoadComplete = useCallback(() => setLoaded(true), [])

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
        spaceState.t         = Math.max(0, 1 - self.progress / 0.22)
        skyState.progress    = skyFromScroll(self.progress)
      },
    })
    ScrollTrigger.refresh()
    return () => trigger.kill()
  }, [])

  return (
    <main>
      <OceanAudio />
      <CustomCursor />
      <ScrollIndicator />

      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 200, 5], fov: 60 }}
            gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
            onCreated={() => handleLoadComplete()}
          >
            <DynamicAtmosphere />
            <DynamicSky />
            <Stars />
            <Earth />
            <DynamicLights />
            <CameraRig />
            <Environment preset="dawn" background={false} />
            <Ocean />
            <EffectComposer>
              <ChromaticAberration offset={new THREE.Vector2(0.0014, 0.0014)} />
              <DepthOfField focusDistance={0.009} focalLength={0.018} bokehScale={0.3} />
              <Bloom intensity={0.55} luminanceThreshold={0.40} luminanceSmoothing={0.9} />
              <Noise opacity={0.032} />
              <Vignette eskil={false} offset={0.16} darkness={0.65} />
            </EffectComposer>
          </Canvas>
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '50vh',
          background: 'linear-gradient(to top, rgba(4,8,20,0.55) 0%, transparent 100%)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        {/* スクロール 800vh */}
        <div id="scroll-container" style={{ position: 'relative', zIndex: 2, height: '800vh' }}>
          <div style={{ height: '200vh' }}><HeroSection loaded={loaded} /></div>
          <div style={{ height: '150vh' }}><AboutSection loaded={loaded} /></div>
          <div style={{ height: '200vh' }}><WorkSection loaded={loaded} /></div>
          <div style={{ height: '250vh' }}><ContactSection loaded={loaded} /></div>
        </div>
      </div>
    </main>
  )
}
