import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { Car } from './Car';

export function PoliceCar() {
  const lightBarRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (lightBarRef.current) {
      const time = state.clock.getElapsedTime();
      const speed = 15;
      
      // Flash logic
      const isRedOn = Math.sin(time * speed) > 0;
      
      lightBarRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
           const material = child.material as THREE.MeshStandardMaterial;
           if (index === 0) { // Red light
             material.emissiveIntensity = isRedOn ? 20 : 0;
           } else if (index === 1) { // Blue light
             material.emissiveIntensity = !isRedOn ? 20 : 0;
           }
        }
      });
    }
  });

  return (
    <group position={[0, 0, 8]} rotation={[0, 0, 0]}>
      {/* Fallback to Car component (White) since external GLTF failed */}
      <group rotation={[0, Math.PI, 0]}>
          <Car color="#ffffff" finish="gloss" moving={true} />
      </group>
      
      {/* RCMP Decals - Adjusted for Car model */}
      <group position={[0, 0.8, 0]}>
        {/* Side Text Left */}
        <Text
          position={[1.05, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.3}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          RCMP
        </Text>
        <Text
          position={[1.05, -0.2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.1}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          POLICE
        </Text>

        {/* Side Text Right */}
        <Text
          position={[-1.05, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.3}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          RCMP
        </Text>
        <Text
          position={[-1.05, -0.2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.1}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          POLICE
        </Text>
        
        {/* Hood Text */}
        <Text
          position={[0, 0.1, 1.5]}
          rotation={[-Math.PI / 2.5, 0, 0]}
          fontSize={0.25}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          RCMP
        </Text>
      </group>

      {/* Light Bar */}
      <group ref={lightBarRef} position={[0, 1.45, 0]}>
        {/* Bar Mount */}
        <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[1.0, 0.05, 0.15]} />
            <meshStandardMaterial color="#111" />
        </mesh>
        
        {/* Red Light */}
        <mesh position={[-0.35, 0, 0]}>
          <boxGeometry args={[0.4, 0.1, 0.15]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0} toneMapped={false} />
        </mesh>
        
        {/* Blue Light */}
        <mesh position={[0.35, 0, 0]}>
          <boxGeometry args={[0.4, 0.1, 0.15]} />
          <meshStandardMaterial color="#0000ff" emissive="#0000ff" emissiveIntensity={0} toneMapped={false} />
        </mesh>
      </group>
      
      {/* Headlights */}
      <spotLight 
        position={[0.6, 0.8, 2]} 
        angle={0.5} 
        penumbra={0.5} 
        intensity={200} 
        color="#ffffff" 
        target-position={[0.6, 0, 10]}
        castShadow
      />
      <spotLight 
        position={[-0.6, 0.8, 2]} 
        angle={0.5} 
        penumbra={0.5} 
        intensity={200} 
        color="#ffffff" 
        target-position={[-0.6, 0, 10]}
        castShadow
      />
    </group>
  );
}
