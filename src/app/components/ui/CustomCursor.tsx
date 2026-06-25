'use client'

import { useRef, useEffect } from 'react'

export function CustomCursor() {
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
