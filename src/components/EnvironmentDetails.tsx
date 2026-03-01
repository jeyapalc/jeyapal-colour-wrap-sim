import { Instance, Instances, Sparkles } from '@react-three/drei';
import { useMemo } from 'react';

export function MoonDust() {
  return (
    <Sparkles 
      count={500} 
      scale={[30, 10, 30]} 
      size={2} 
      speed={0.2} 
      opacity={0.5} 
      color="#aaa"
      position={[0, 2, 0]}
    />
  );
}

export function MoonCraters() {
  // Simple crater rims using Torus
  const craters = useMemo(() => {
    return new Array(20).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 60,
      scale: 1 + Math.random() * 3,
    })).filter(c => Math.abs(c.x) > 6 || Math.abs(c.z) > 6); // Keep clear of car
  }, []);

  return (
    <group>
      {craters.map((c, i) => (
        <group key={i} position={[c.x, -0.1, c.z]} rotation={[-Math.PI/2, 0, 0]}>
          {/* Crater Rim */}
          <mesh receiveShadow castShadow>
            <torusGeometry args={[c.scale, c.scale * 0.15, 16, 32]} />
            <meshStandardMaterial color="#444" roughness={0.9} />
          </mesh>
          {/* Crater Bottom */}
          <mesh position={[0, 0, -0.2]} receiveShadow>
            <circleGeometry args={[c.scale]} />
            <meshStandardMaterial color="#111" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DesertDust() {
  return (
    <Sparkles 
      count={1000} 
      scale={[40, 15, 40]} 
      size={5} 
      speed={0.4} 
      opacity={0.4} 
      color="#e6c288"
      position={[0, 2, 0]}
      noise={1}
    />
  );
}

export function Rocks() {
  const rocks = useMemo(() => {
    return new Array(30).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 60,
      scale: 0.5 + Math.random(),
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    })).filter(r => Math.abs(r.x) > 6 || Math.abs(r.z) > 6);
  }, []);

  return (
    <Instances range={30}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#A0522D" roughness={0.9} />
      {rocks.map((data, i) => (
        <Instance
          key={i}
          position={[data.x, 0.3, data.z]}
          scale={[data.scale, data.scale * 0.7, data.scale]}
          rotation={data.rotation as any}
        />
      ))}
    </Instances>
  );
}

export function SaltFlatsWater() {
  const puddles = useMemo(() => {
    // Reduced count from 5 to 2 for "less water pools"
    return new Array(2).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 50,
      scaleX: 3 + Math.random() * 4,
      scaleZ: 3 + Math.random() * 4,
      rotation: Math.random() * Math.PI,
    })).filter(p => Math.abs(p.x) > 8 || Math.abs(p.z) > 8); // Keep away from center
  }, []);

  return (
    <group>
      {puddles.map((p, i) => (
        <mesh 
          key={i} 
          position={[p.x, 0.01, p.z]} // Slightly higher to sit on top of crust
          rotation={[-Math.PI / 2, 0, p.rotation]}
          scale={[p.scaleX, p.scaleZ, 1]}
        >
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial 
            color="#87CEEB" 
            transparent 
            opacity={0.5} 
            roughness={0.05} 
            metalness={0.9} 
          />
        </mesh>
      ))}
    </group>
  );
}

export function SaltCrust() {
  const hexes = useMemo(() => {
    const items = [];
    const radius = 2; // Size of salt tiles
    const width = Math.sqrt(3) * radius;
    const height = 2 * radius;
    const gap = 0.15; // Width of fissures

    // Generate hex grid
    for (let x = -12; x < 12; x++) {
      for (let z = -12; z < 12; z++) {
        const xPos = (x * (width + gap)) + (z % 2 === 0 ? 0 : width / 2);
        const zPos = z * (height * 0.75 + gap);
        
        // Randomize slightly to look natural
        const jitterX = (Math.random() - 0.5) * 0.2;
        const jitterZ = (Math.random() - 0.5) * 0.2;

        // Skip very center but keep close enough to see
        if (Math.sqrt(xPos * xPos + zPos * zPos) > 60) continue;

        items.push({
          x: xPos + jitterX,
          z: zPos + jitterZ,
          rotation: Math.random() * 0.05, // Slight rotation variance
          height: 0.1 + Math.random() * 0.05, // Varying thickness
        });
      }
    }
    return items;
  }, []);

  return (
    <Instances range={hexes.length}>
      <cylinderGeometry args={[2, 2, 1, 6]} />
      <meshStandardMaterial 
        color="#f5f5f5" 
        roughness={0.9} 
        bumpScale={0.1}
      />
      {hexes.map((data, i) => (
        <Instance
          key={i}
          position={[data.x, -0.5, data.z]} // Sunk into ground
          scale={[1, data.height, 1]}
          rotation={[0, Math.PI / 6 + data.rotation, 0]} 
        />
      ))}
    </Instances>
  );
}

export function SaltChunks() {
  const chunks = useMemo(() => {
    return new Array(50).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 60,
      scale: 0.1 + Math.random() * 0.2,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    })).filter(c => Math.abs(c.x) > 4 || Math.abs(c.z) > 4);
  }, []);

  return (
    <Instances range={50}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
      {chunks.map((data, i) => (
        <Instance
          key={i}
          position={[data.x, 0.1, data.z]}
          scale={[data.scale, data.scale * 0.5, data.scale]}
          rotation={data.rotation as any}
        />
      ))}
    </Instances>
  );
}

export function Cactus() {
    const cacti = useMemo(() => {
    return new Array(12).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 50,
      scale: 0.8 + Math.random() * 0.5,
      rot: Math.random() * Math.PI
    })).filter(c => Math.abs(c.x) > 8 || Math.abs(c.z) > 8);
  }, []);

  return (
    <group>
        {cacti.map((c, i) => (
            <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]} scale={c.scale}>
                {/* Main Stem */}
                <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                    <capsuleGeometry args={[0.25, 3, 8, 16]} />
                    <meshStandardMaterial color="#556B2F" roughness={0.8} />
                </mesh>
                {/* Arm 1 */}
                <group position={[0.25, 1.5, 0]} rotation={[0, 0, -Math.PI/3]}>
                     <mesh position={[0, 0.5, 0]} castShadow>
                        <capsuleGeometry args={[0.2, 1, 8, 16]} />
                        <meshStandardMaterial color="#556B2F" roughness={0.8} />
                    </mesh>
                </group>
                 {/* Arm 2 */}
                <group position={[-0.25, 2, 0]} rotation={[0, 0, Math.PI/3]}>
                     <mesh position={[0, 0.5, 0]} castShadow>
                        <capsuleGeometry args={[0.18, 0.8, 8, 16]} />
                        <meshStandardMaterial color="#556B2F" roughness={0.8} />
                    </mesh>
                </group>
            </group>
        ))}
    </group>
  )
}
