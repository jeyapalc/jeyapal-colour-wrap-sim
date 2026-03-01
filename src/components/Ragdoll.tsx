import { useBox, useSphere, useConeTwistConstraint } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const BodyPart = ({ config, children, render }: any) => {
  const [ref] = config.shape === 'sphere' 
    ? useSphere(() => config) 
    : useBox(() => config);
    
  return (
    <mesh ref={ref} castShadow receiveShadow>
      {render}
      {children}
    </mesh>
  );
};

const Constraint = ({ parent, child, config }: any) => {
  useConeTwistConstraint(parent, child, config);
  return null;
};

export function Ragdoll({ position = [0, 0, 0], color = '#facc15', velocity = [0, 0, 0] }: { position?: [number, number, number], color?: string, velocity?: [number, number, number] }) {
  const [x, y, z] = position;
  
  // Torso
  const [torsoRef, torsoApi] = useBox(() => ({
    mass: 15,
    position: [x, y + 1, z],
    args: [0.3, 0.4, 0.15],
    velocity
  }));

  // Head
  const [headRef, headApi] = useSphere(() => ({
    mass: 3,
    position: [x, y + 1.4, z],
    args: [0.15],
    velocity
  }));

  // Arms
  const [leftArmRef, leftArmApi] = useBox(() => ({
    mass: 1,
    position: [x - 0.25, y + 1.1, z],
    args: [0.1, 0.3, 0.1],
    velocity
  }));
  
  const [rightArmRef, rightArmApi] = useBox(() => ({
    mass: 1,
    position: [x + 0.25, y + 1.1, z],
    args: [0.1, 0.3, 0.1],
    velocity
  }));

  // Legs
  const [leftLegRef, leftLegApi] = useBox(() => ({
    mass: 1,
    position: [x - 0.1, y + 0.6, z],
    args: [0.1, 0.4, 0.1],
    velocity
  }));

  const [rightLegRef, rightLegApi] = useBox(() => ({
    mass: 1,
    position: [x + 0.1, y + 0.6, z],
    args: [0.1, 0.4, 0.1],
    velocity
  }));

  // Constraints
  useConeTwistConstraint(torsoRef, headRef, {
    pivotA: [0, 0.25, 0],
    pivotB: [0, -0.15, 0],
    axisA: [0, 1, 0],
    axisB: [0, 1, 0],
    angle: Math.PI / 2, // More head movement
    twistAngle: 0,
  });

  useConeTwistConstraint(torsoRef, leftArmRef, {
    pivotA: [-0.2, 0.15, 0],
    pivotB: [0, 0.15, 0],
    axisA: [1, 0, 0],
    axisB: [1, 0, 0],
    angle: Math.PI, // Full arm rotation
  });

  useConeTwistConstraint(torsoRef, rightArmRef, {
    pivotA: [0.2, 0.15, 0],
    pivotB: [0, 0.15, 0],
    axisA: [1, 0, 0],
    axisB: [1, 0, 0],
    angle: Math.PI, // Full arm rotation
  });

  useConeTwistConstraint(torsoRef, leftLegRef, {
    pivotA: [-0.1, -0.25, 0],
    pivotB: [0, 0.25, 0],
    axisA: [0, 1, 0],
    axisB: [0, 1, 0],
    angle: Math.PI / 2, // More leg movement
  });

  useConeTwistConstraint(torsoRef, rightLegRef, {
    pivotA: [0.1, -0.25, 0],
    pivotB: [0, 0.25, 0],
    axisA: [0, 1, 0],
    axisB: [0, 1, 0],
    angle: Math.PI / 2, // More leg movement
  });

  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), [color]);

  return (
    <group>
      <mesh ref={torsoRef} material={material}>
        <boxGeometry args={[0.3, 0.4, 0.15]} />
        {/* Dummy Logo */}
        <mesh position={[0, 0, 0.08]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color="black" />
            <mesh position={[0, 0, 0.01]}>
                <circleGeometry args={[0.06, 32]} />
                <meshBasicMaterial color={color} />
                <mesh position={[0, 0, 0.01]}>
                    <ringGeometry args={[0.02, 0.06, 4]} />
                    <meshBasicMaterial color="black" />
                </mesh>
            </mesh>
        </mesh>
      </mesh>
      
      <mesh ref={headRef} material={material}>
        <sphereGeometry args={[0.15]} />
        {/* Face */}
        <mesh position={[0.05, 0.02, 0.13]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[-0.05, 0.02, 0.13]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0, -0.05, 0.13]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.03, 0.01, 16, 32, Math.PI]} />
            <meshBasicMaterial color="black" />
        </mesh>
      </mesh>
      
      <mesh ref={leftArmRef} material={material}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
      </mesh>
      
      <mesh ref={rightArmRef} material={material}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
      </mesh>
      
      <mesh ref={leftLegRef} material={material}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
      </mesh>
      
      <mesh ref={rightLegRef} material={material}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
      </mesh>
    </group>
  );
}
