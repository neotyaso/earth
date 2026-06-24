import type { Metadata, Viewport } from 'next'
import { Cormorant, Noto_Serif_JP } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
})

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ENOSHIMA — 江の島',
  description: '光と影が交わる島へ。An immersive WebGL journey through Enoshima, Kanagawa.',
  openGraph: {
    title: 'ENOSHIMA — 江の島',
    description: '光と影が交わる島へ。',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ENOSHIMA — 江の島',
    description: '光と影が交わる島へ。',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${cormorant.variable} ${notoSerifJP.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
