'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function AboutSection({ loaded }: { loaded: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loaded) return
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, scrollTrigger: { trigger: '#sec-about', start: 'top 65%', end: 'top 25%', scrub: 0.8 } }
      )
      gsap.to(ref.current, {
        opacity: 0, y: -40,
        scrollTrigger: { trigger: '#sec-about', start: 'bottom 60%', end: 'bottom 10%', scrub: 0.8 }
      })
    })
    return () => ctx.revert()
  }, [loaded])

  return (
    <section id="sec-about" style={{
      height: '150vh',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 7vw',
    }}>
      <div ref={ref} style={{ maxWidth: '420px', textAlign: 'right' }}>
        <p style={{
          fontFamily: 'var(--font-ja)', fontWeight: 300,
          fontSize: 'clamp(1rem, 2.4vw, 1.4rem)',
          letterSpacing: '0.08em', lineHeight: 2.5,
          color: 'rgba(245,240,232,0.88)',
          textShadow: '0 2px 24px rgba(0,0,0,0.9)',
        }}>
          境界を作る。<br />
          見えないものを、形にする。
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(0.5rem, 0.9vw, 0.65rem)',
          letterSpacing: '0.5em', color: '#c9a84c',
          marginTop: '1.8rem',
        }}>
          CREATIVE DEVELOPER / TOKYO
        </p>
      </div>
    </section>
  )
}
