"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

/* ================= DEVIL MODEL ================= */

function DevilModel() {
  const ref = useRef<any>();
  const { scene } = useGLTF("/devil.glb");

  useFrame(({ mouse }) => {
    if (ref.current) {
      ref.current.rotation.y = mouse.x * 0.5;
      ref.current.rotation.x = mouse.y * 0.2;
    }
  });

  return <primitive ref={ref} object={scene} scale={2} />;
}

/* ================= FIRE SHADER ================= */

const FireShader = {
  uniforms: {
    time: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float time;

    float noise(vec2 p){
      return sin(p.x*10.0+time)*sin(p.y*10.0+time);
    }

    void main(){
      float n = noise(vUv*5.0);
      vec3 col = mix(vec3(1.0,0.0,0.0), vec3(1.0,0.5,0.0), n);
      gl_FragColor = vec4(col,1.0);
    }
  `
};

function FirePlane() {
  const mat = useRef<any>();

  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.time.value = clock.getElapsedTime();
  });

  return (
    <mesh position={[0, -2, -3]}>
      <planeGeometry args={[20, 20]} />
      <shaderMaterial ref={mat} attach="material" args={[FireShader]} />
    </mesh>
  );
}

/* ================= SCENE ================= */

export default function HellScene({ onReady }: { onReady: () => void }) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const audio = new Audio("/hell-voice.mp3");

    setTimeout(() => {
      audio.play().catch(() => {});
      setStarted(true);
      onReady();
    }, 2000);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 6] }}>
      
      {/* LIGHTS */}
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={2} color="red" />

      {/* FIRE FLOOR */}
      <FirePlane />

      {/* DEVIL */}
      {started && <DevilModel />}

      {/* CAMERA CONTROLS */}
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}

useGLTF.preload("/devil.glb");