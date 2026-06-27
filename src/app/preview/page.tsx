"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Grid } from "@react-three/drei";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/preview-model.glb");
  const ref = useRef<THREE.Group>(null);

  return <primitive ref={ref} object={scene} />;
}

export default function PreviewPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -2, -5]} intensity={0.5} color="#8888ff" />
        <Suspense fallback={null}>
          <Model />
          <Environment preset="city" />
        </Suspense>
        <Grid
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={3}
          sectionThickness={1}
          fadeDistance={20}
          position={[0, -1, 0]}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={20}
        />
      </Canvas>
      <div style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        color: "#888", fontSize: 12, fontFamily: "monospace",
        background: "rgba(0,0,0,0.5)", padding: "6px 12px", borderRadius: 4
      }}>
        ドラッグ: 回転 / スクロール: ズーム / 右ドラッグ: 移動
      </div>
    </div>
  );
}
