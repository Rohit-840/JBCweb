import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial } from "@react-three/drei";
import { useRef } from "react";

// generated once at module load — moving out of render scope satisfies the
// react compiler's purity rule (math.random is impure inside useMemo).
const PARTICLE_POSITIONS = (() => {
  const arr = new Float32Array(5000 * 3);
  for (let i = 0; i < 5000; i++) {
    arr[i * 3]     = (Math.random() - 0.5) * 20;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  return arr;
})();

// particle background
function Particles() {
  const positions = PARTICLE_POSITIONS;

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial size={0.02} color="#00ffff" />
    </Points>
  );
}

function GridFloor() {
  return (
    <gridHelper args={[20, 40, "#d4af37", "#333333"]} position={[0, -3, 0]} />
  );
}

// main animated object
function CoreObject({ mouse }) {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003 + mouse.x * 0.01;
      ref.current.rotation.x += mouse.y * 0.01;
    }
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2.5, 2]} />
      <meshStandardMaterial
        color="#00ffff"
        metalness={1}
        roughness={0}
      />
    </mesh>
  );
}

// scene wrapper
export default function ThreeScene({ mouse }) {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2} />

      <Particles />
      <CoreObject mouse={mouse} />
      <GridFloor />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}