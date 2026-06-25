'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export function HeroSection({ loaded }: { loaded: boolean }) {
  const nameRef = useRef<HTMLHeadingElement>(null)
  const roleRef = useRef<HTMLParagraphElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loaded) return
    const tl = gsap.timeline({ delay: 0.6 })
    tl.fromTo(nameRef.current,
      { opacity: 0, skewX: -10, x: -40 },
      { opacity: 1, skewX: 0, x: 0, duration: 0.9, ease: 'power4.out' }
    )
    tl.to(nameRef.current, { skewX: 8,  x:  12, duration: 0.06, ease: 'none' })
    tl.to(nameRef.current, { skewX: -5, x:  -6, duration: 0.06, ease: 'none' })
    tl.to(nameRef.current, { skewX: 0,  x:   0, duration: 0.12, ease: 'power2.out' })
    tl.fromTo(roleRef.current,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }, '-=0.1'
    )
    tl.fromTo(lineRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: 'power3.inOut', transformOrigin: 'left' }, '-=0.3'
    )
  }, [loaded])

  return (
    <section style={{
      height: '200vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 7vw 22vh',
    }}>
      <p ref={roleRef} style={{
        fontFamily: 'var(--font-display)', fontWeight: 300,
        fontSize: 'clamp(0.55rem, 1.1vw, 0.75rem)',
        letterSpacing: '0.65em', color: '#c9a84c',
        marginBottom: '1.2rem', opacity: 0,
        textShadow: '0 0 20px rgba(201,168,76,0.4)',
      }}>
        DEVELOPER
      </p>
      <h1 ref={nameRef} style={{
        fontFamily: 'var(--font-display)', fontWeight: 300,
        fontSize: 'clamp(5rem, 20vw, 18rem)',
        letterSpacing: '0.08em', color: '#fff',
        lineHeight: 0.85, opacity: 0,
        textShadow: '0 0 60px rgba(255,255,255,0.08)',
      }}>
        KOKI
      </h1>
      <div ref={lineRef} style={{
        width: '100%', height: 1,
        background: 'linear-gradient(to right, rgba(201,168,76,0.6), transparent)',
        marginTop: '2.5rem', transformOrigin: 'left',
      }} />
    </section>
  )
}
