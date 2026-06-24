@AGENTS.md

# 江の島プロジェクト

没入型WebGLポートフォリオサイト。江の島をテーマに、スクロールで昼→夜へ遷移する3D体験。

## 技術スタック
- Next.js 16 / React 19 / TypeScript
- Three.js + @react-three/fiber + @react-three/drei
- GSAP + ScrollTrigger + Lenis
- @react-three/postprocessing

## 重要な設計
- `scrollState.progress`（モジュールレベル）でGSAPとR3Fのスクロール状態を共有
- Oceanの波はGPU側（`onBeforeCompile`）で計算
- 3DモデルはすべてプリミティブのMVP。後でLuma AI NeRF（.glb）に差し替え予定
- フォント: Cormorant（英字display）/ Noto Serif JP（日本語）

## 残タスク（優先順）
1. 江の島撮影 → Luma AI NeRF → .glb差し替え（台風明け）
2. Blockade Labs AIスカイボックス
3. 水面シェーダー強化（フレネル反射）
4. スポット紹介セクション（カメラズームイン体験）
5. サウンドデザイン / モバイル対応
