// ─── 共有スクロール状態（GSAPとR3Fで参照） ──────────────────────────────────────

export const scrollState = { progress: 0 }
export const skyState    = { progress: 0 }
export const spaceState  = { t: 1.0 }  // 1=宇宙, 0=海面

// 800vh: hero 200 + about 150 + work 200 + contact 250
// 0→0.25: 宇宙→夜明け  / 0.25→0.56: 黄金時間帯  / 0.56→1.0: 夕暮れ
export function skyFromScroll(p: number): number {
  if (p < 0.25) return (p / 0.25) * 0.20
  if (p < 0.56) return 0.20
  return 0.20 + ((p - 0.56) / 0.44) * 0.55
}

export const PROJECTS = [
  {
    id: 'kyoka',
    title: '鏡花水月城',
    titleEn: 'KYOKA SUIGETSU-JO',
    desc: '架空の城。\n水面に映る月のように、\n存在と幻の境界を探る。',
    year: '2024',
  },
]
