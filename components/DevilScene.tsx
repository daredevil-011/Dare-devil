"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";

function Devil() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff0000" />
      </mesh>
    </Float>
  );
}

export default function DevilScene() {
  return (
    <div style={{ height: "100vh", width: "100%", position: "absolute" }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#ff0000" />
        <Devil />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}