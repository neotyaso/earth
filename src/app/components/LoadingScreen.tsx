'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []

    function createParticle(): Particle {
      return {
        x: Math.random() * canvas!.width,
        y: canvas!.height + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 1.5 + 0.5),
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.2,
        life: 0,
        maxLife: Math.random() * 120 + 80,
      }
    }

    for (let i = 0; i < 80; i++) {
      const p = createParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particles.push(p)
    }

    let rafId: number
    let frameCount = 0

    function drawIsland(progress: number) {
      const cx = canvas!.width / 2
      const cy = canvas!.height * 0.52
      const w = Math.min(canvas!.width * 0.38, 280)
      const h = w * 0.55

      ctx!.save()

      // 海面ライン
      ctx!.strokeStyle = `rgba(74, 144, 217, ${progress * 0.35})`
      ctx!.lineWidth = 1
      ctx!.shadowColor = 'rgba(74, 144, 217, 0.4)'
      ctx!.shadowBlur = 6
      ctx!.beginPath()
      ctx!.moveTo(cx - w * 1.3, cy + 2)
      ctx!.lineTo(cx + w * 1.3, cy + 2)
      ctx!.stroke()

      // 島のシルエット（丘）
      ctx!.strokeStyle = `rgba(201, 168, 76, ${progress * 0.55})`
      ctx!.lineWidth = 1.5
      ctx!.shadowColor = 'rgba(201, 168, 76, 0.5)'
      ctx!.shadowBlur = 10
      ctx!.beginPath()
      ctx!.moveTo(cx - w, cy)
      ctx!.bezierCurveTo(cx - w * 0.55, cy, cx - w * 0.25, cy - h, cx, cy - h)
      ctx!.bezierCurveTo(cx + w * 0.25, cy - h, cx + w * 0.55, cy, cx + w, cy)
      ctx!.stroke()

      // 鳥居
      const tx = cx
      const ty = cy - h * 0.48
      const tw = w * 0.18
      const th = h * 0.32

      ctx!.strokeStyle = `rgba(201, 168, 76, ${progress * 0.5})`
      ctx!.shadowColor = 'rgba(201, 168, 76, 0.4)'
      ctx!.shadowBlur = 8
      ctx!.lineWidth = 1.5

      // 柱
      ctx!.beginPath()
      ctx!.moveTo(tx - tw / 2, ty + th)
      ctx!.lineTo(tx - tw / 2, ty)
      ctx!.stroke()
      ctx!.beginPath()
      ctx!.moveTo(tx + tw / 2, ty + th)
      ctx!.lineTo(tx + tw / 2, ty)
      ctx!.stroke()
      // 笠木（上の横棒）
      ctx!.beginPath()
      ctx!.moveTo(tx - tw * 0.72, ty)
      ctx!.lineTo(tx + tw * 0.72, ty)
      ctx!.stroke()
      // 貫（中の横棒）
      ctx!.beginPath()
      ctx!.moveTo(tx - tw * 0.5, ty + th * 0.38)
      ctx!.lineTo(tx + tw * 0.5, ty + th * 0.38)
      ctx!.stroke()

      ctx!.restore()
    }

    function animate() {
      rafId = requestAnimationFrame(animate)
      frameCount++

      ctx!.fillStyle = 'rgba(10, 22, 40, 0.18)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      if (frameCount % 3 === 0 && particles.length < 150) {
        particles.push(createParticle())
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++
        const lifeRatio = p.life / p.maxLife
        const alpha = p.opacity * (1 - lifeRatio)
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(201, 168, 76, ${alpha})`
        ctx!.fill()
        if (p.life >= p.maxLife) particles.splice(i, 1)
      }

      const silProgress = Math.min(frameCount / 80, 1)
      drawIsland(silProgress)
    }

    animate()

    const tl = gsap.timeline({ delay: 1.0 })
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.4,
      ease: 'power3.out',
    })
    tl.to({}, { duration: 1.8 })
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => {
        setVisible(false)
        onComplete()
      },
    })

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#0a1628',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      <div
        ref={titleRef}
        style={{
          position: 'absolute',
          bottom: '28%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: 0,
          transform: 'translateY(24px)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
            fontWeight: 300,
            letterSpacing: '0.35em',
            color: '#f5f0e8',
            lineHeight: 1,
          }}
        >
          ENOSHIMA
        </p>
        <p
          style={{
            fontFamily: 'var(--font-ja)',
            fontSize: 'clamp(0.7rem, 1.8vw, 0.95rem)',
            letterSpacing: '0.6em',
            color: '#c9a84c',
            marginTop: '1rem',
            fontWeight: 300,
          }}
        >
          江の島
        </p>
      </div>
    </div>
  )
}
