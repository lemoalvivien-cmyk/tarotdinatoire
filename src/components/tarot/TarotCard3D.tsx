/**
 * TarotCard3D — WebGL card using react-three-fiber
 *
 * Features:
 *  - Idle levitation (sine-wave Y offset)
 *  - Mouse / gyroscope parallax tilt
 *  - Custom GLSL shader: iridescent metallic edge sheen on flip
 *  - CSS fallback via `<TarotCardCSS>` when WebGL is unavailable
 *
 * Usage: drop-in replacement for the stacked deck in AnimatedDeck.tsx
 * The business logic (deck, selection, phases) is NEVER touched here.
 */

import {
  Suspense,
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
} from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { useTexture, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { CARD_BACK_URL } from '@/constants/tarotAssets';

// ─── Custom iridescent metallic shader ────────────────────────────────────────
// Visible primarily on the card edges during the flip transition.
const metallicVert = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv      = uv;
    vNormal  = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const metallicFrag = /* glsl */`
  uniform sampler2D uMap;
  uniform float     uFlipProgress; // 0 → 1 during flip
  uniform float     uTime;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  // HSL → RGB helper
  vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    if (h < 1.0/6.0) return vec3(c,x,0) + m;
    if (h < 2.0/6.0) return vec3(x,c,0) + m;
    if (h < 3.0/6.0) return vec3(0,c,x) + m;
    if (h < 4.0/6.0) return vec3(0,x,c) + m;
    if (h < 5.0/6.0) return vec3(x,0,c) + m;
    return vec3(c,0,x) + m;
  }

  void main() {
    vec4 texColor = texture2D(uMap, vUv);

    // Fresnel term — stronger on grazing angles (edges)
    float fresnel = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 3.0);

    // Iridescent hue shifts with time + flip
    float hue = mod(vUv.x * 0.6 + vUv.y * 0.4 + uTime * 0.12 + uFlipProgress * 0.5, 1.0);
    vec3  sheen = hsl2rgb(hue, 0.9, 0.65);

    // Edge mask — highlight the card border
    float edge = smoothstep(0.04, 0.0, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    float sheenIntensity = mix(fresnel * 0.35, fresnel * 0.9, uFlipProgress) + edge * 0.6;

    vec3 finalColor = mix(texColor.rgb, sheen, sheenIntensity * 0.55);
    gl_FragColor    = vec4(finalColor, texColor.a);
  }
`;

// ─── ShaderMaterial extension (drei pattern) ──────────────────────────────────
class TarotShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader:   metallicVert,
      fragmentShader: metallicFrag,
      uniforms: {
        uMap:          { value: null },
        uFlipProgress: { value: 0 },
        uTime:         { value: 0 },
      },
      transparent: true,
    });
  }
}
extend({ TarotShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    tarotShaderMaterial: THREE.ShaderMaterial & {
      uMap?: THREE.Texture;
      uFlipProgress?: number;
      uTime?: number;
    };
  }
}

// ─── Individual 3D Card Mesh ───────────────────────────────────────────────────
interface Card3DMeshProps {
  imageUrl: string;
  backUrl:  string;
  isFlipped: boolean;
  mouseX: number; // normalized -1 → +1
  mouseY: number;
  index?: number;  // stack offset
}

function Card3DMesh({ imageUrl, backUrl, isFlipped, mouseX, mouseY, index = 0 }: Card3DMeshProps) {
  const groupRef   = useRef<THREE.Group>(null!);
  const matFrontRef = useRef<TarotShaderMaterial>(null!);
  const matBackRef  = useRef<TarotShaderMaterial>(null!);

  const [frontTex, backTex] = useTexture([imageUrl, backUrl]);

  // assign texture to material once loaded
  useEffect(() => {
    if (matFrontRef.current && frontTex) matFrontRef.current.uniforms.uMap.value = frontTex;
  }, [frontTex]);
  useEffect(() => {
    if (matBackRef.current && backTex) matBackRef.current.uniforms.uMap.value = backTex;
  }, [backTex]);

  // Flip target
  const targetFlipY = isFlipped ? Math.PI : 0;
  const currentFlip = useRef(0);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // ── Idle levitation ─────────────────────────────────────────────────
    const levY = Math.sin(t * 1.4 + index * 0.8) * 0.04;
    const levZ = Math.sin(t * 0.9 + index) * 0.01;

    // ── Parallax tilt from cursor/gyro ──────────────────────────────────
    const tiltX = mouseY * 0.18;   // pitch
    const tiltZ = -mouseX * 0.12;  // roll

    // ── Smooth flip ─────────────────────────────────────────────────────
    currentFlip.current += (targetFlipY - currentFlip.current) * 0.08;
    const flipProgress = Math.abs(Math.sin(currentFlip.current * 0.5));

    groupRef.current.position.y    = levY + index * 0.003;
    groupRef.current.position.z    = levZ + index * 0.002;
    groupRef.current.rotation.x    = tiltX;
    groupRef.current.rotation.y    = currentFlip.current;
    groupRef.current.rotation.z    = tiltZ;

    // ── Update shader uniforms ───────────────────────────────────────────
    if (matFrontRef.current) {
      matFrontRef.current.uniforms.uTime.value         = t;
      matFrontRef.current.uniforms.uFlipProgress.value = flipProgress;
    }
    if (matBackRef.current) {
      matBackRef.current.uniforms.uTime.value          = t;
      matBackRef.current.uniforms.uFlipProgress.value  = flipProgress;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Front face */}
      <RoundedBox args={[1.4, 2.1, 0.01]} radius={0.05} smoothness={4} position={[0, 0, 0.005]}>
        {/* @ts-expect-error — custom material via extend (react-three-fiber JSX extension) */}
        <tarotShaderMaterial ref={matFrontRef} side={THREE.FrontSide} />
      </RoundedBox>

      {/* Back face */}
      <RoundedBox args={[1.4, 2.1, 0.01]} radius={0.05} smoothness={4} position={[0, 0, -0.005]}>
        {/* @ts-expect-error — custom material via extend (react-three-fiber JSX extension) */}
        <tarotShaderMaterial ref={matBackRef} side={THREE.BackSide} />
      </RoundedBox>

      {/* Card body (thin, dark) */}
      <RoundedBox args={[1.4, 2.1, 0.02]} radius={0.05} smoothness={4}>
        <meshStandardMaterial color="#1a1025" roughness={0.4} metalness={0.6} />
      </RoundedBox>
    </group>
  );
}

// ─── Scene with lighting ───────────────────────────────────────────────────────
interface SceneProps {
  imageUrl: string;
  isFlipped: boolean;
  mouseX: number;
  mouseY: number;
  cardCount?: number;
}

function Scene({ imageUrl, isFlipped, mouseX, mouseY, cardCount = 1 }: SceneProps) {
  return (
    <>
      {/* Ambient + directional lighting for metallic sheen */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 5]}  intensity={1.2} color="#ede9fe" />
      <directionalLight position={[-3, 2, 3]} intensity={0.5} color="#fde68a" />
      <pointLight       position={[0, 0, 4]}  intensity={0.4} color="#c4b5fd" />

      <Suspense fallback={null}>
        {Array.from({ length: Math.min(cardCount, 3) }).map((_, i) => (
          <Card3DMesh
            key={i}
            imageUrl={imageUrl}
            backUrl={CARD_BACK_URL}
            isFlipped={isFlipped}
            mouseX={mouseX}
            mouseY={mouseY}
            index={i}
          />
        ))}
      </Suspense>
    </>
  );
}

// ─── Cursor / Gyroscope hook ──────────────────────────────────────────────────
function usePointer() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Desktop: mouse move on document
    const onMouse = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth)  * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    // Mobile: device orientation (gyroscope)
    const onGyro = (e: DeviceOrientationEvent) => {
      const beta  = e.beta  ?? 0; // pitch -180 → 180
      const gamma = e.gamma ?? 0; // roll  -90  → 90
      setPos({
        x: Math.max(-1, Math.min(1, gamma / 45)),
        y: Math.max(-1, Math.min(1, (beta - 45) / 45)),
      });
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('deviceorientation', onGyro, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('deviceorientation', onGyro);
    };
  }, []);

  return pos;
}

// ─── WebGL capability detection ───────────────────────────────────────────────
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

// ─── CSS Fallback (unchanged logic) ──────────────────────────────────────────
function TarotCardCSS({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative w-[180px] h-[270px] rounded-xl overflow-hidden border-2',
        'border-mp-brand-gold/30 shadow-mp-card',
        'bg-mp-bg-900',
        'animate-[float_3s_ease-in-out_infinite]',
        className
      )}
    >
      <img src={CARD_BACK_URL} alt="Dos de carte" className="w-full h-full object-cover" loading="lazy" />
    </div>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────
export interface TarotCard3DProps {
  /** URL of the card face texture (front). Falls back to CARD_BACK_URL if omitted. */
  imageUrl?: string;
  /** Whether the card is currently flipped to show the front face */
  isFlipped?: boolean;
  /** Number of stacked ghost cards behind the main card (1–3) */
  stackCount?: number;
  className?: string;
}

export const TarotCard3D = memo(function TarotCard3D({
  imageUrl,
  isFlipped   = false,
  stackCount  = 1,
  className,
}: TarotCard3DProps) {
  const { x: mouseX, y: mouseY } = usePointer();
  const [webglOk] = useState(() => detectWebGL());

  const texUrl = imageUrl ?? CARD_BACK_URL;

  if (!webglOk) {
    return <TarotCardCSS className={className} />;
  }

  return (
    <div
      className={cn('relative', className)}
      style={{ width: 200, height: 300 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 42 }}
        dpr={[1, 1.5]}           // cap DPR to preserve perf on mobile
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene
          imageUrl={texUrl}
          isFlipped={isFlipped}
          mouseX={mouseX}
          mouseY={mouseY}
          cardCount={stackCount}
        />
      </Canvas>
    </div>
  );
});

export default TarotCard3D;
