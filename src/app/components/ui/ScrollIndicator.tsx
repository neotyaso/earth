'use client'

import { useRef, useEffect } from 'react'
import { scrollState } from '../../state'

export function ScrollIndicator() {
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
