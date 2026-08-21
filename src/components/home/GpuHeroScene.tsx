'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const ACCENT_RED = '#ef3b46';
const FIN_COUNT = 9;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Rotates the whole rig toward the pointer for a parallax-tilt feel, plus a
// near-imperceptible idle yaw so the scene never looks frozen.
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = ref.current;
    if (!group) return;
    const targetY = state.pointer.x * 0.35;
    const targetX = -state.pointer.y * 0.16;
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetY, 0.04);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, 0.04);
  });

  return <group ref={ref}>{children}</group>;
}

// A single heatsink fin. Grows into place on mount (staggered by index) to
// read as hardware "stacking" itself together, then settles into a faint idle bob.
function Fin({
  index,
  x,
  reducedMotion,
}: {
  index: number;
  x: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = 0.15;

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const delay = 0.2 + index * 0.06;
    const progress = reducedMotion ? 1 : THREE.MathUtils.clamp((t - delay) / 0.6, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    mesh.scale.y = Math.max(eased, 0.001);
    let y = baseY - (1 - eased) * 0.45;
    if (progress >= 1 && !reducedMotion) {
      y += Math.sin(t * 1.4 + index * 0.7) * 0.015;
    }
    mesh.position.y = y;
  });

  return (
    <mesh ref={ref} position={[x, baseY, 0]} scale={[1, 0.001, 1]} castShadow>
      <boxGeometry args={[0.2, 0.7, 1.3]} />
      <meshStandardMaterial
        color={index % 4 === 0 ? '#a3a6ac' : '#6c6f75'}
        metalness={0.95}
        roughness={0.2}
      />
    </mesh>
  );
}

function GpuStack({ reducedMotion }: { reducedMotion: boolean }) {
  const fins = Array.from({ length: FIN_COUNT }, (_, i) => -1.4 + i * 0.35);

  return (
    <group position={[0, -0.25, 0]} rotation={[0.14, -0.55, 0]}>
      {/* PCB / card body */}
      <RoundedBox args={[3.3, 0.16, 1.6]} radius={0.05} smoothness={4} position={[0, -0.35, 0]} castShadow>
        <meshStandardMaterial color="#28282c" metalness={0.6} roughness={0.4} />
      </RoundedBox>

      {/* Brand-red edge accent, restrained to a single thin strip */}
      <RoundedBox args={[3.3, 0.035, 0.05]} radius={0.015} smoothness={4} position={[0, -0.35, 0.85]}>
        <meshStandardMaterial
          color={ACCENT_RED}
          emissive={ACCENT_RED}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </RoundedBox>

      {fins.map((x, i) => (
        <Fin key={i} index={i} x={x} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.5} />
      <pointLight position={[-3, -1, 2.5]} intensity={10} color={ACCENT_RED} distance={9} />
      <pointLight position={[3, 2, -2]} intensity={5} color={ACCENT_RED} distance={10} />
      <Environment preset="studio" background={false} />

      <Rig>
        <GpuStack reducedMotion={reducedMotion} />

        <Float
          speed={reducedMotion ? 0 : 1.1}
          rotationIntensity={reducedMotion ? 0 : 0.4}
          floatIntensity={reducedMotion ? 0 : 0.6}
        >
          <RoundedBox args={[1.3, 0.06, 0.9]} radius={0.04} position={[-2.5, 1, -1.3]} rotation={[0.3, 0.6, 0.1]}>
            <meshStandardMaterial color="#4c4c52" metalness={0.9} roughness={0.22} />
          </RoundedBox>
        </Float>

        <Float
          speed={reducedMotion ? 0 : 0.9}
          rotationIntensity={reducedMotion ? 0 : 0.3}
          floatIntensity={reducedMotion ? 0 : 0.5}
        >
          <RoundedBox args={[1.05, 0.05, 0.7]} radius={0.04} position={[2.6, -0.7, -0.9]} rotation={[-0.2, -0.5, 0.15]}>
            <meshStandardMaterial color="#38383d" metalness={0.9} roughness={0.28} />
          </RoundedBox>
        </Float>
      </Rig>

      {!reducedMotion && (
        <Sparkles count={40} scale={7} size={1.4} speed={0.2} opacity={0.35} color={ACCENT_RED} />
      )}
    </>
  );
}

export function GpuHeroScene() {
  const reducedMotion = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.5, 5.4], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Scene reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}
