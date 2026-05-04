/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, Preload } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Vector3,
} from "three";

const GOLD = "#f5c542";
const SOFT_GOLD = "#d4af37";
const BRIGHT_GOLD = "#ffd66b";
const BLACK = "#030303";

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function makeFloatingParticles(count = 1150) {
  const random = seededRandom(94);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const edgeBias = random() < 0.86;
    const side = random() < 0.5 ? -1 : 1;
    const lowerBand = random() < 0.62;

    positions[i * 3] = edgeBias
      ? side * (4.55 + random() * 4.9)
      : side * (2.25 + random() * 2.2);
    positions[i * 3 + 1] = lowerBand
      ? -1.78 + random() * 2.15
      : 0.15 + random() * 3.6;
    positions[i * 3 + 2] = -7.8 + random() * 8.5;
  }

  return positions;
}

function makeSideDots(countPerSide = 850) {
  const random = seededRandom(331);
  const positions = new Float32Array(countPerSide * 2 * 3);
  let cursor = 0;

  [-1, 1].forEach((side) => {
    for (let i = 0; i < countPerSide; i += 1) {
      const column = Math.floor(random() * 24);
      const row = Math.floor(random() * 42);
      const heightFade = row / 42;

      positions[cursor] = side * (5.45 + column * 0.12 + random() * 0.028);
      positions[cursor + 1] = -1.45 + row * 0.105 + random() * 0.018;
      positions[cursor + 2] = -5.9 + random() * 6.8 - heightFade * 0.8;
      cursor += 3;
    }
  });

  return positions;
}

function makeGridGeometry(size = 22, divisions = 26) {
  const half = size / 2;
  const step = size / divisions;
  const positions = [];

  for (let i = 0; i <= divisions; i += 1) {
    const p = -half + i * step;
    positions.push(-half, 0, p, half, 0, p);
    positions.push(p, 0, -half, p, 0, half);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
}

const FLOATING_PARTICLES = makeFloatingParticles();
const SIDE_DOTS = makeSideDots();
const GRID_GEOMETRY = makeGridGeometry();

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return undefined;

    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function CameraRig({ reducedMotion, loading, mode }) {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(0, -0.72, -1.2), []);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    camera.position.set(0, 1.15, 7.2);
    camera.fov = 46;
    camera.near = 0.1;
    camera.far = 42;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, target]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const handlePointer = (event) => {
      pointerRef.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerRef.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, [reducedMotion]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;

    const t = clock.elapsedTime;
    const pointerWeight = mode === "front" ? 0.11 : 0.065;
    const sway = loading ? 0.075 : mode === "front" ? 0.038 : 0.024;
    camera.position.x = Math.sin(t * 0.16) * sway + pointerRef.current.x * pointerWeight;
    camera.position.y = 1.15 + Math.sin(t * 0.11) * sway * 0.35 - pointerRef.current.y * pointerWeight * 0.2;
    camera.lookAt(target);
  });

  return null;
}

function DarkEnvironment({ loading, mode }) {
  const dashboard = mode === "dashboard";

  return (
    <>
      {loading && <color attach="background" args={[BLACK]} />}
      <fog attach="fog" args={["#050505", loading ? 8.4 : dashboard ? 5.6 : 5.2, loading ? 20 : 15]} />
      <ambientLight intensity={loading ? 0.42 : dashboard ? 0.13 : 0.16} color="#d4af37" />
      <pointLight position={[-6.1, -0.72, -2.45]} intensity={loading ? 42 : dashboard ? 9 : 13} color={GOLD} distance={loading ? 9.5 : 6.4} />
      <pointLight position={[6.1, -0.72, -2.45]} intensity={loading ? 42 : dashboard ? 9 : 13} color={GOLD} distance={loading ? 9.5 : 6.4} />
      <pointLight position={[0, -1.2, -3.8]} intensity={loading ? 9 : dashboard ? 1.1 : 1.8} color="#8d6c18" distance={loading ? 11 : 6.8} />
    </>
  );
}

function PerspectiveGridFloor({ reducedMotion, loading }) {
  const groupRef = useRef(null);
  const materialRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return;
    const speed = loading ? 0.46 : 0.18;
    groupRef.current.position.z = -1.2 + (clock.elapsedTime * speed) % 0.82;
    if (materialRef.current) {
      materialRef.current.opacity = (loading ? 0.42 : 0.18) + Math.sin(clock.elapsedTime * 0.7) * (loading ? 0.045 : 0.02);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.72, -1.2]}>
      <lineSegments geometry={GRID_GEOMETRY} frustumCulled={false}>
        <lineBasicMaterial
          ref={materialRef}
          color={SOFT_GOLD}
          transparent
          opacity={loading ? 0.42 : 0.18}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
      <Line
        points={[[-10.8, 0.006, 0], [10.8, 0.006, 0]]}
        color={BRIGHT_GOLD}
        lineWidth={0.35}
        transparent
        opacity={loading ? 0.46 : 0.2}
      />
      <Line
        points={[[0, 0.006, -10.8], [0, 0.006, 10.8]]}
        color={BRIGHT_GOLD}
        lineWidth={0.3}
        transparent
        opacity={loading ? 0.34 : 0.095}
      />
    </group>
  );
}

function makeTrail(points) {
  return new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
}

function TrailPulse({ curve, offset, speed, loading, reducedMotion, intensity = 1 }) {
  const materialRef = useRef(null);
  const attributeRef = useRef(null);
  const positions = useMemo(() => new Float32Array(25 * 3), []);
  const color = useMemo(() => new Color(BRIGHT_GOLD), []);

  useFrame(({ clock }) => {
    const time = reducedMotion ? offset : (clock.elapsedTime * speed + offset) % 1;
    const span = loading ? 0.14 : 0.12;

    for (let i = 0; i < 25; i += 1) {
      const u = (time - span * 0.52 + (i / 24) * span + 1) % 1;
      const point = curve.getPointAt(u);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    if (attributeRef.current) {
      attributeRef.current.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.opacity = (loading ? 0.98 : 0.74) * intensity;
    }
  });

  return (
    <line frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={attributeRef} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={(loading ? 0.98 : 0.74) * intensity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </line>
  );
}

function GoldTrail({ points, offsets, speed, loading, reducedMotion, intensity = 1 }) {
  const curve = useMemo(() => makeTrail(points), [points]);
  const samples = useMemo(() => curve.getPoints(120), [curve]);

  return (
    <group>
      <Line
        points={samples}
        color={SOFT_GOLD}
        lineWidth={(loading ? 1.15 : 0.72) * intensity}
        transparent
        opacity={(loading ? 0.48 : 0.26) * intensity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
      <Line
        points={samples}
        color={GOLD}
        lineWidth={(loading ? 0.34 : 0.22) * intensity}
        transparent
        opacity={(loading ? 0.72 : 0.36) * intensity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
      {offsets.map((offset) => (
        <TrailPulse
          key={offset}
          curve={curve}
          offset={offset}
          speed={speed}
          loading={loading}
          reducedMotion={reducedMotion}
          intensity={intensity}
        />
      ))}
    </group>
  );
}

function GoldLightTrails({ loading, reducedMotion }) {
  const trails = useMemo(() => ([
    {
      points: [[-8.9, -1.58, 2.35], [-7.0, -1.45, 0.6], [-5.35, -1.24, -1.55], [-3.25, -0.95, -4.85]],
      offsets: [0.08, 0.38, 0.68],
      speed: loading ? 0.48 : 0.22,
      intensity: loading ? 1.22 : 1.38,
    },
    {
      points: [[8.9, -1.58, 2.35], [7.0, -1.45, 0.6], [5.35, -1.24, -1.55], [3.25, -0.95, -4.85]],
      offsets: [0.22, 0.52, 0.82],
      speed: loading ? 0.45 : 0.21,
      intensity: loading ? 1.22 : 1.38,
    },
    {
      points: [[-8.8, -1.68, 2.0], [-4.8, -1.62, 0.45], [0, -1.58, -1.55], [4.8, -1.62, 0.45], [8.8, -1.68, 2.0]],
      offsets: [0.02, 0.34, 0.66],
      speed: loading ? 0.31 : 0.18,
      intensity: loading ? 0.95 : 1.0,
    },
    {
      points: [[-5.6, -1.62, 2.2], [-3.8, -1.48, 0.2], [-1.8, -1.2, -2.1], [-0.45, -1.02, -4.7]],
      offsets: [0.14, 0.58],
      speed: loading ? 0.36 : 0.2,
      intensity: loading ? 0.95 : 0.96,
    },
    {
      points: [[5.6, -1.62, 2.2], [3.8, -1.48, 0.2], [1.8, -1.2, -2.1], [0.45, -1.02, -4.7]],
      offsets: [0.34, 0.78],
      speed: loading ? 0.36 : 0.2,
      intensity: loading ? 0.95 : 0.96,
    },
  ]), [loading]);

  return (
    <>
      {trails.map((trail) => (
        <GoldTrail
          key={trail.points[0].join(",")}
          points={trail.points}
          offsets={trail.offsets}
          speed={trail.speed}
          loading={loading}
          reducedMotion={reducedMotion}
          intensity={trail.intensity}
        />
      ))}
    </>
  );
}

function DigitalSideDots({ loading, reducedMotion }) {
  const materialRef = useRef(null);

  useFrame(({ clock }) => {
    if (!materialRef.current || reducedMotion) return;
    materialRef.current.opacity = (loading ? 0.52 : 0.135) + Math.sin(clock.elapsedTime * 0.85) * (loading ? 0.075 : 0.018);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[SIDE_DOTS, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={loading ? 0.032 : 0.015}
        color={GOLD}
        transparent
        opacity={loading ? 0.52 : 0.135}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function FloatingParticles({ loading, reducedMotion }) {
  const pointsRef = useRef(null);
  const materialRef = useRef(null);

  useFrame(({ clock }) => {
    if (!pointsRef.current || reducedMotion) return;
    pointsRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.055) * 0.018;
    pointsRef.current.position.y = Math.sin(clock.elapsedTime * 0.22) * 0.025;
    if (materialRef.current) {
      materialRef.current.opacity = (loading ? 0.62 : 0.07) + Math.sin(clock.elapsedTime * 0.6) * (loading ? 0.07 : 0.01);
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[FLOATING_PARTICLES, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={loading ? 0.034 : 0.012}
        color={BRIGHT_GOLD}
        transparent
        opacity={loading ? 0.62 : 0.07}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function HazeLayer({ loading }) {
  return (
    <group>
      <mesh position={[0, 0.04, -5.6]} frustumCulled={false}>
        <planeGeometry args={[15, 7]} />
        <meshBasicMaterial color="#806018" transparent opacity={loading ? 0.105 : 0.01} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[-6.3, -0.65, -2.8]} rotation={[0, 0.18, 0]} frustumCulled={false}>
        <planeGeometry args={[4.4, 2.4]} />
        <meshBasicMaterial color={GOLD} transparent opacity={loading ? 0.12 : 0.026} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[6.3, -0.65, -2.8]} rotation={[0, -0.18, 0]} frustumCulled={false}>
        <planeGeometry args={[4.4, 2.4]} />
        <meshBasicMaterial color={GOLD} transparent opacity={loading ? 0.12 : 0.026} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

function SceneLayers({ mode, loading, reducedMotion }) {
  return (
    <>
      <DarkEnvironment loading={loading} mode={mode} />
      <CameraRig loading={loading} reducedMotion={reducedMotion} mode={mode} />
      {loading && <HazeLayer loading={loading} />}
      <PerspectiveGridFloor loading={loading} reducedMotion={reducedMotion} />
      <GoldLightTrails loading={loading} reducedMotion={reducedMotion} />
      {(loading || mode === "front") && <DigitalSideDots loading={loading} reducedMotion={reducedMotion} />}
      {(loading || mode === "front") && <FloatingParticles loading={loading} reducedMotion={reducedMotion} />}
      <Preload all />
    </>
  );
}

export default function ThreeScene({ mode = "dashboard", className = "" }) {
  const reducedMotion = usePrefersReducedMotion();
  const loading = mode === "loading";
  const frameloop = reducedMotion ? "demand" : "always";
  const dpr = loading ? [1, 1.5] : [0.8, 1.25];

  return (
    <div className={`three-scene three-scene--${mode} ${className}`} aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        fallback={<div className="three-scene__fallback" />}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 1.15, 7.2], fov: 46, near: 0.1, far: 42 }}
      >
        <SceneLayers mode={mode} loading={loading} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
