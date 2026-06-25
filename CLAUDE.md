@AGENTS.md

# 宇宙スカイダイビング・ポートフォリオ

**コンセプト**: 宇宙からのスカイダイビング。スクロールで宇宙→大気圏突入（燃焼）→雲層→海面へと落下する一人称体験型ポートフォリオ。KOKIのポートフォリオサイト。

## 体験フロー
1. **宇宙**（scroll 0）: 暗黒の宇宙空間、地球を見下ろす
2. **落下**（scroll 0→45%）: 地球へ向かって一直線に加速
3. **大気圏突入**（scroll 42→55%）: 画面端から燃焼エフェクト、空が黒→オレンジ→青へ
4. **雲層突入**（scroll 45→50%）: 雲の中まで限界まで接近
5. **海面着水**（scroll 55→70%）: 空が広がり海面が現れる
6. **海面ドリフト**（scroll 70%〜）: Gerstner波の海を漂う

## 技術スタック
- Next.js 16 / React 19 / TypeScript
- Three.js + @react-three/fiber + @react-three/drei
- GSAP + ScrollTrigger
- @react-three/postprocessing（Bloom / DepthOfField / ChromaticAberration / Noise / Vignette）

## 重要な設計
- `scrollState.progress` / `spaceState.t` / `skyState.progress`（モジュールレベル）でGSAPとR3Fの状態を共有
- `spaceState.t`: 1=宇宙, 0=海面。scroll 0.42→0.55で遷移
- Earth: プロシージャルシェーダー（陸・海・雲2層）。中心(0,-150,-320) radius=120
- カメラ経路: (0,200,5) → (0,-80,-255)[雲層内部] → (0,4.8,10.5)[海面]
- Oceanの波はGPU側（`onBeforeCompile`）で計算
- 大気圏燃焼: DOMオーバーレイ（mixBlendMode:screen）+ Skyシェーダーのre-entryグロー

## ファイル構成
```
src/app/
  state.ts                  ← 共有state
  page.tsx                  ← エントリ（燃焼オーバーレイ含む）
  components/
    scene/
      Sky.tsx               ← 空シェーダー（u_spaceで宇宙←→空ブレンド）
      Space.tsx             ← Stars + Earth（プロシージャル雲付き）
      Atmosphere.tsx        ← FogExp2 + ライト
      Ocean.tsx             ← Gerstner波シェーダー
      CameraRig.tsx         ← 落下カメラ経路
      OceanAudio.tsx        ← Web Audio波音
    sections/               ← テキストセクション（現在非表示）
    ui/                     ← CustomCursor / ScrollIndicator（現在非表示）
```

## 残タスク
1. テキストUI復活（ポートフォリオコンテンツ）
2. FPSハンド（右手モデル）
3. 水面シェーダー強化（フレネル反射）
4. モバイル対応 / サウンドデザイン
