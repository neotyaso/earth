'use client'

import { useEffect } from 'react'

export function OceanAudio() {
  useEffect(() => {
    const ctxRef  = { current: null as AudioContext | null }
    const started = { current: false }

    const start = () => {
      if (started.current) return
      started.current = true

      const ctx = new AudioContext()
      ctxRef.current = ctx

      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

      const noise = ctx.createBufferSource()
      noise.buffer = buf
      noise.loop = true

      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 480
      lp.Q.value = 0.9

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.11
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.032

      const master = ctx.createGain()
      master.gain.value = 0
      master.gain.setTargetAtTime(0.10, ctx.currentTime, 2.0)

      noise.connect(lp)
      lp.connect(master)
      lfo.connect(lfoGain)
      lfoGain.connect(master.gain)
      master.connect(ctx.destination)

      noise.start()
      lfo.start()
    }

    window.addEventListener('scroll', start, { once: true })
    window.addEventListener('click',  start, { once: true })
    return () => {
      window.removeEventListener('scroll', start)
      window.removeEventListener('click',  start)
      ctxRef.current?.close()
    }
  }, [])

  return null
}
