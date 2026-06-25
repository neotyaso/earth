'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from '../../state'

gsap.registerPlugin(ScrollTrigger)

export function WorkSection({ loaded }: { loaded: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loaded) return
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, scrollTrigger: { trigger: '#sec-work', start: 'top 65%', end: 'top 20%', scrub: 0.8 } }
      )
      gsap.to(ref.current, {
        opacity: 0,
        scrollTrigger: { trigger: '#sec-work', start: 'bottom 55%', end: 'bottom 5%', scrub: 0.8 }
      })
    })
    return () => ctx.revert()
  }, [loaded])

  return (
    <section id="sec-work" style={{
      height: '200vh',
      display: 'flex', alignItems: 'center',
      padding: '0 7vw',
    }}>
      <div ref={ref} style={{ width: '100%' }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(0.5rem, 0.9vw, 0.65rem)',
          letterSpacing: '0.6em', color: '#c9a84c',
          marginBottom: '3rem',
        }}>
          SELECTED WORK
        </p>

        {PROJECTS.map((p) => (
          <div key={p.id} style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '2.5rem', paddingBottom: '2.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', marginBottom: '1.2rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-ja)', fontWeight: 300,
                fontSize: 'clamp(1.8rem, 5vw, 4rem)',
                color: '#fff', letterSpacing: '0.06em', lineHeight: 1,
                textShadow: '0 0 40px rgba(255,255,255,0.05)',
              }}>
                {p.title}
              </h2>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 300,
                fontSize: 'clamp(0.5rem, 0.85vw, 0.62rem)',
                letterSpacing: '0.4em', color: 'rgba(255,255,255,0.25)',
                paddingBottom: '0.5rem',
              }}>
                {p.titleEn}
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-ja)', fontWeight: 300,
              fontSize: 'clamp(0.75rem, 1.4vw, 0.9rem)',
              letterSpacing: '0.08em', lineHeight: 2.4,
              color: 'rgba(245,240,232,0.50)',
              whiteSpace: 'pre-line', maxWidth: '340px',
            }}>
              {p.desc}
            </p>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 300,
              fontSize: 'clamp(0.48rem, 0.8vw, 0.6rem)',
              letterSpacing: '0.4em', color: '#c9a84c',
              marginTop: '1.5rem',
            }}>
              {p.year}
            </p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
      </div>
    </section>
  )
}
