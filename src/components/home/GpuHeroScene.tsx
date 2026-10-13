'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Html, RoundedBox, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { MotionValue } from 'framer-motion';
import * as THREE from 'three';

const RED = '#ff2d45';
const AMBER = '#ff9a3c';
const BLUE = '#5b7cff';
const FAN_X = [-1.3, 0, 1.3];
const FIN_COUNT = 30;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type SceneProps = {
  /** 0 → assembled, 1 → fully exploded. Driven by page scroll on desktop. */
  progress?: MotionValue<number>;
  reducedMotion: boolean;
};

// Shared per-frame "explode" amount: the intro assembly animation on load,
// then whatever the scroll position asks for.
function useExplode(progress: MotionValue<number> | undefined, reducedMotion: boolean) {
  const value = useRef(reducedMotion ? 0 : 1);
  useFrame((state) => {
    const intro = reducedMotion ? 0 : 1 - easeOutCubic(THREE.MathUtils.clamp((state.clock.elapsedTime - 0.3) / 1.8, 0, 1));
    const scroll = progress ? easeOutCubic(THREE.MathUtils.clamp(progress.get() * 1.4, 0, 1)) : 0;
    const target = Math.max(intro, scroll);
    value.current = THREE.MathUtils.lerp(value.current, target, intro > 0 ? 1 : 0.12);
  });
  return value;
}

// Animated molten gradient for the light bars — rendered above 1.0 so the
// bloom pass picks it up.
const LIGHT_BAR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LIGHT_BAR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec3 red = vec3(1.0, 0.12, 0.22);
    vec3 amber = vec3(1.0, 0.56, 0.16);
    float wave = 0.5 + 0.5 * sin(vUv.x * 9.0 - uTime * 2.2);
    vec3 color = mix(red, amber, wave) * (2.4 + wave * 1.6);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function LightBarMaterial() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const [uniforms] = useState(() => ({ uTime: { value: 0 } }));
  useFrame((state) => {
    if (ref.current) ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      vertexShader={LIGHT_BAR_VERTEX}
      fragmentShader={LIGHT_BAR_FRAGMENT}
      toneMapped={false}
    />
  );
}

function Fan({ x, index, spin }: { x: number; index: number; spin: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const color = index === 1 ? '#ff5a3a' : index === 0 ? RED : AMBER;

  useFrame((state, delta) => {
    if (rotor.current && spin) rotor.current.rotation.y -= delta * (7 + index * 0.6);
    if (ring.current) {
      ring.current.emissiveIntensity = 3 + Math.sin(state.clock.elapsedTime * 2 + index * 1.3) * 1.2;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      {/* Recessed well the fan sits in */}
      <mesh position={[0, -0.015, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.02, 48]} />
        <meshStandardMaterial color="#060608" metalness={0.4} roughness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.016, 12, 64]} />
        <meshStandardMaterial ref={ring} color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <group ref={rotor}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.11, 0.05, 32]} />
          <meshStandardMaterial color="#1b1b20" metalness={0.9} roughness={0.25} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} rotation={[0, (i / 9) * Math.PI * 2, 0]}>
            <mesh position={[0.26, 0, 0]} rotation={[0.45, 0, 0.08]}>
              <boxGeometry args={[0.3, 0.012, 0.13]} />
              <meshStandardMaterial color="#26262c" metalness={0.6} roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Label({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <Html center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className="whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 6}px)` }}
      >
        {children}
      </div>
    </Html>
  );
}

function GpuModel({ progress, reducedMotion, showLabels }: SceneProps & { showLabels: boolean }) {
  const explode = useExplode(progress, reducedMotion);

  const backplate = useRef<THREE.Group>(null);
  const pcb = useRef<THREE.Group>(null);
  const heatsink = useRef<THREE.Group>(null);
  const shroud = useRef<THREE.Group>(null);
  const fans = useRef<THREE.Group>(null);
  const bracket = useRef<THREE.Group>(null);
  const [labelsOn, setLabelsOn] = useState(false);

  useFrame(() => {
    const e = explode.current;
    if (backplate.current) backplate.current.position.y = -0.24 - e * 0.55;
    if (pcb.current) pcb.current.position.y = -0.16 - e * 0.18;
    if (heatsink.current) heatsink.current.position.y = 0.08 + e * 0.38;
    if (shroud.current) shroud.current.position.y = 0.3 + e * 0.9;
    if (fans.current) fans.current.position.y = 0.37 + e * 1.35;
    if (bracket.current) bracket.current.position.x = -2.14 - e * 0.65;

    const on = showLabels && e > 0.55;
    if (on !== labelsOn) setLabelsOn(on);
  });

  const fins = Array.from({ length: FIN_COUNT }, (_, i) => -1.95 + (i * 3.9) / (FIN_COUNT - 1));
  const vram = [
    [-0.62, -0.32], [-0.62, 0], [-0.62, 0.32],
    [0.62, -0.32], [0.62, 0], [0.62, 0.32],
    [-0.24, -0.58], [0.24, -0.58],
  ];

  return (
    <group>
      {/* Backplate */}
      <group ref={backplate} position={[0, -0.24, 0]}>
        <RoundedBox args={[4.2, 0.05, 1.6]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#2a2a30" metalness={0.92} roughness={0.32} />
        </RoundedBox>
        <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.4, 0.02]} />
          <LightBarMaterial />
        </mesh>
      </group>

      {/* PCB with die, VRAM and PCIe fingers */}
      <group ref={pcb} position={[0, -0.16, 0]}>
        <mesh>
          <boxGeometry args={[4.1, 0.05, 1.5]} />
          <meshStandardMaterial color="#0d1512" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.72, 0.04, 0.72]} />
          <meshStandardMaterial color="#1c1c22" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.46, 0.012, 0.46]} />
          <meshStandardMaterial color="#d8d9de" metalness={1} roughness={0.12} emissive={RED} emissiveIntensity={0.25} />
        </mesh>
        {vram.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.04, z]}>
            <boxGeometry args={[0.2, 0.025, 0.16]} />
            <meshStandardMaterial color="#141418" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[-0.55, 0, 0.78]}>
          <boxGeometry args={[1.7, 0.03, 0.08]} />
          <meshStandardMaterial color="#d9ac4f" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[1.7, 0.08, -0.55]}>
          <boxGeometry args={[0.36, 0.12, 0.18]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.6} />
        </mesh>
        {showLabels && (
          <group position={[0.2, 0.25, 0.9]}>
            <Label visible={labelsOn}>GPU die · VRAM</Label>
          </group>
        )}
      </group>

      {/* Heatsink: fin stack + copper heat pipes */}
      <group ref={heatsink} position={[0, 0.08, 0]}>
        {fins.map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[0.025, 0.3, 1.42]} />
            <meshStandardMaterial color={i % 6 === 0 ? '#b9bcc4' : '#8a8d95'} metalness={0.95} roughness={0.22} />
          </mesh>
        ))}
        {[-0.45, -0.15, 0.15, 0.45].map((z) => (
          <mesh key={z} position={[0, -0.06, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 4.0, 16]} />
            <meshStandardMaterial color="#c87533" metalness={1} roughness={0.22} />
          </mesh>
        ))}
        {showLabels && (
          <group position={[-0.9, 0.1, 0.95]}>
            <Label visible={labelsOn}>Heat pipes · fin stack</Label>
          </group>
        )}
      </group>

      {/* Shroud with molten light bar */}
      <group ref={shroud} position={[0, 0.3, 0]}>
        <RoundedBox args={[4.24, 0.1, 1.62]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#1a1a1f" metalness={0.85} roughness={0.28} />
        </RoundedBox>
        <mesh position={[0, 0, 0.812]}>
          <planeGeometry args={[3.8, 0.028]} />
          <LightBarMaterial />
        </mesh>
        <RoundedBox args={[4.24, 0.02, 0.12]} radius={0.008} smoothness={2} position={[0, 0.055, -0.75]}>
          <meshStandardMaterial color="#3a3a42" metalness={1} roughness={0.15} />
        </RoundedBox>
      </group>

      {/* Fans */}
      <group ref={fans} position={[0, 0.37, 0]}>
        {FAN_X.map((x, i) => (
          <Fan key={x} x={x} index={i} spin={!reducedMotion} />
        ))}
        {showLabels && (
          <group position={[1.3, 0.25, 0.7]}>
            <Label visible={labelsOn}>Triple-fan cooler</Label>
          </group>
        )}
      </group>

      {/* IO bracket */}
      <group ref={bracket} position={[-2.14, 0.02, 0]}>
        <mesh>
          <boxGeometry args={[0.04, 0.62, 1.64]} />
          <meshStandardMaterial color="#c4c6cc" metalness={1} roughness={0.25} />
        </mesh>
        {[-0.45, -0.15, 0.15, 0.45].map((z) => (
          <mesh key={z} position={[-0.025, 0.05, z]}>
            <boxGeometry args={[0.01, 0.12, 0.2]} />
            <meshStandardMaterial color="#050506" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Tilts the rig toward the pointer, opens up the angle as the card explodes,
// and adds a slow idle drift so the scene never looks frozen.
function Rig({ progress, reducedMotion, children }: SceneProps & { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = ref.current;
    if (!group) return;
    const p = progress?.get() ?? 0;
    const t = state.clock.elapsedTime;
    const idle = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.08;
    const targetY = -0.62 + p * 0.9 + state.pointer.x * 0.3 + idle;
    const targetX = 0.38 + p * 0.22 - state.pointer.y * 0.12;
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetY, 0.05);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, 0.05);
    // Drop and shrink slightly as the card opens up so every layer stays in frame.
    group.position.y = -p * 0.45 + (reducedMotion ? 0 : Math.sin(t * 0.9) * 0.06);
    group.scale.setScalar(1 - p * 0.14);
  });

  return <group ref={ref}>{children}</group>;
}

export function GpuHeroScene({
  progress,
  reducedMotion,
  showLabels = true,
  postprocessing = true,
}: SceneProps & { showLabels?: boolean; postprocessing?: boolean }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Stop rendering entirely once the hero scrolls out of view.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 0.5, 8.6], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <directionalLight position={[5, 6, 4]} intensity={1.6} />
          <pointLight position={[-4, 1, -2]} intensity={40} color={RED} distance={14} />
          <pointLight position={[4, -1, 3]} intensity={22} color={AMBER} distance={12} />
          <pointLight position={[0, 4, -4]} intensity={26} color={BLUE} distance={12} />
          {/* Reflections stream in from a CDN — never block the card on them. */}
          <Suspense fallback={null}>
            <Environment preset="city" background={false} environmentIntensity={0.6} />
          </Suspense>

          <Rig progress={progress} reducedMotion={reducedMotion}>
            <GpuModel progress={progress} reducedMotion={reducedMotion} showLabels={showLabels} />
          </Rig>

          {!reducedMotion && (
            <>
              <Sparkles count={50} scale={[9, 5, 4]} size={2.2} speed={0.3} opacity={0.6} color={RED} />
              <Sparkles count={35} scale={[9, 5, 4]} size={1.6} speed={0.25} opacity={0.5} color={AMBER} />
            </>
          )}

          {postprocessing && (
            <EffectComposer multisampling={4}>
              <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={1.15} radius={0.75} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
