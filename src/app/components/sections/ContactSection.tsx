'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function ContactSection({ loaded }: { loaded: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loaded) return
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, scrollTrigger: { trigger: '#sec-contact', start: 'top 60%', end: 'top 10%', scrub: 0.9 } }
      )
    })
    return () => ctx.revert()
  }, [loaded])

  return (
    <section id="sec-contact" style={{
      height: '250vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div ref={ref} style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(0.5rem, 0.9vw, 0.65rem)',
          letterSpacing: '0.6em', color: '#c9a84c',
          marginBottom: '2.5rem',
        }}>
          GET IN TOUCH
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(2.5rem, 8vw, 7rem)',
          letterSpacing: '0.15em', color: '#fff', lineHeight: 0.9,
          textShadow: '0 0 80px rgba(255,255,255,0.06)',
        }}>
          KOKI
        </h2>
        <div style={{
          width: 1, height: 56,
          background: 'linear-gradient(to bottom, rgba(201,168,76,0.5), transparent)',
          margin: '2.5rem auto',
        }} />
        <p style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(0.6rem, 1.1vw, 0.8rem)',
          letterSpacing: '0.4em', color: 'rgba(245,240,232,0.4)',
        }}>
          nakakou0123456789@gmail.com
        </p>
      </div>
    </section>
  )
}
