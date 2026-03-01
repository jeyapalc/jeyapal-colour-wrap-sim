import { Physics, useBox, usePlane } from '@react-three/cannon';
import { Ragdoll } from './Ragdoll';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, MeshReflectorMaterial, Loader, Stars, Sky, Text, Html } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { Car } from './Car';
import { ErrorBoundary } from './ErrorBoundary';
import { motion } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { Settings, Sun, Moon, Share2, Info, RotateCcw, ZoomIn, ZoomOut, Cloud, Zap, Mountain, ChevronsUp, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';
import { MoonCraters, MoonDust, DesertDust, Rocks, Cactus, SaltFlatsWater, SaltChunks } from './EnvironmentDetails';



// Custom Icons
const TunnelIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 21h18" />
    <path d="M5 21V7a8 8 0 0 1 14 0v14" />
    <path d="M8 21v-5a4 4 0 0 1 8 0v5" />
    <path d="M12 3v3" />
  </svg>
);

const TransCanadaIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3z" fill="currentColor" stroke="none" opacity="0.5" />
  </svg>
);

const CopIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 10h16" />
    <path d="M6 10V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
    <path d="M9 4h6" />
    <path d="M6 10v5a6 6 0 0 0 12 0v-5" />
    <path d="M8 13h3.5l.5 1 .5-1H16" strokeWidth="3" />
  </svg>
);

import { CrashTestDummies } from './CrashTestDummies';

// SPS Components
function Ground() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, -0.01, 0],
    material: { friction: 0.0 } 
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#111" transparent opacity={0.0} />
    </mesh>
  );
}

function CarCollider({ rotation }: { rotation: [number, number, number] }) {
  const [ref] = useBox(() => ({ 
    mass: 1000, 
    position: [0, 0.75, 0], 
    rotation,
    args: [2.2, 1.6, 4.5], // Approximate car dimensions
    type: 'Kinematic',
    onCollide: (e) => {
        // console.log('Crash!', e);
    }
  }));

  return (
    <mesh ref={ref} visible={false}>
      <boxGeometry args={[1.8, 1.4, 4.5]} />
      <meshBasicMaterial color="red" wireframe />
    </mesh>
  );
}

const STANDARD_COLORS = [
  { name: 'Midnight Silver', value: '#2e2e2e' },
  { name: 'Pearl White', value: '#ffffff' },
  { name: 'Deep Blue', value: '#001f5b' },
  { name: 'Solid Black', value: '#000000' },
  { name: 'Red Multi-Coat', value: '#a11b1b' },
  { name: 'Ultra Red', value: '#D80818' },
  { name: 'Quicksilver', value: '#858992' },
  { name: 'Stealth Grey', value: '#3E4146' },
  { name: 'Custom Teal', value: '#008080' },
  { name: 'Matte Green', value: '#354a21' },
  { name: 'Satin Gold', value: '#cfb53b' },
  { name: 'Color Shift', value: '#4b0082' },
];

const FLUORESCENT_COLORS = [
  { name: 'Neon Lime', value: '#39FF14' },
  { name: 'Electric Orange', value: '#FF5F1F' },
  { name: 'Hot Pink', value: '#FF10F0' },
  { name: 'Cyan Punch', value: '#00FFFF' },
  { name: 'Bright Yellow', value: '#FFFF00' },
  { name: 'Vivid Purple', value: '#BF00FF' },
  { name: 'Radioactive Green', value: '#00FF00' },
  { name: 'Laser Blue', value: '#0066FF' },
];

const IRIDESCENT_COLORS = [
  { name: 'City Night', value: '#00008B', secondary: '#FFD700' }, // Dark Blue -> Gold (via Purple)
  { name: 'Nebula', value: '#0000FF', secondary: '#FF0000' }, // Blue -> Red (via Purple)
  { name: 'Royal Flamingo', value: '#FF69B4', secondary: '#008080' }, // Hot Pink -> Teal (via Gold/Green)
  { name: 'Black Widow', value: '#000000', secondary: '#FF00FF' }, // Black -> Magenta/Gold (via Red)
  { name: 'Inferno', value: '#FF0000', secondary: '#FFD700' }, // Red -> Gold (via Orange)
  { name: 'Mountain Sky', value: '#00FF00', secondary: '#0000FF' }, // Green -> Blue/Purple
  { name: 'Toxic Blaze', value: '#006400', secondary: '#FFA500' }, // Dark Green -> Orange (inferred)
  { name: 'Aztec Treasure', value: '#FFD700', secondary: '#008000' }, // Gold -> Green (inferred)
];

const FINISHES = [
  { id: 'gloss', name: 'Gloss' },
  { id: 'matte', name: 'Matte' },
  { id: 'satin', name: 'Satin' },
  { id: 'metallic', name: 'Metallic' },
  { id: 'fluorescent', name: 'Fluorescent' },
  { id: 'iridescent', name: 'Iridescent' },
  { id: 'lunacy', name: 'MHA_SEC.28' },
] as const;

const LUNACY_MATERIALS = [
  { id: 'cyber_hex', name: 'Cyber Hex', color: '#00ffcc' },
  { id: 'plasma', name: 'Plasma', color: '#ff00ff' },
  { id: 'liquid_gold', name: 'Liquid Gold', color: '#ffd700' },
  { id: 'damascus', name: 'Damascus', color: '#555555' },
  { id: 'matrix', name: 'The Matrix', color: '#00ff00' },
  { id: 'magma', name: 'Magma', color: '#ff4400' },
];

type FinishType = typeof FINISHES[number]['id'];

// Environment presets mapping
const ENVIRONMENTS = {
  'studio': { preset: 'city', name: 'Studio', icon: Settings, bg: '#f0f0f0' },
  'daylight': { preset: 'sunset', name: 'Daylight', icon: Sun, bg: '#87CEEB' },
  'night': { preset: 'city', name: 'Streetlight', icon: Moon, bg: '#050505' },
  'dawn': { preset: 'dawn', name: 'Dawn', icon: Cloud, bg: '#ffccaa' },
  'tunnel': { preset: 'city', name: 'Tunnel Run', icon: TunnelIcon, bg: '#000000' },
  'highway': { preset: 'city', name: 'Highway', icon: TransCanadaIcon, bg: '#050505' },
  'emergency': { preset: 'city', name: 'Chase', icon: CopIcon, bg: '#050505' },
} as const;

// Custom background environments
const SCENES = {
  'showroom': { name: 'Showroom', color: '#101010', floor: true },
  'photo_studio': { name: 'Photo Studio', color: '#e8e8e8', floor: true },
  'moon': { name: 'Moon Surface', color: '#0b0b0b', floor: false },
  'salt_flats': { name: 'Salt Flats', color: '#87CEEB', floor: false },
  'desert': { name: 'Desert', color: '#dcb183', floor: false },
} as const;

const MovingLight = ({ zStart, speed, x, color, intensity }: { zStart: number, speed: number, x: number, color: string, intensity: number }) => {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      // Move light along Z axis
      ref.current.position.z += speed * 20 * delta; 
      // Reset when it passes far enough
      if (ref.current.position.z > 20) {
        ref.current.position.z = -60; // Reset further back for better spacing
      }
    }
  });

  return (
    <spotLight 
      ref={ref} 
      position={[x, 1, zStart]} 
      angle={0.6} 
      penumbra={0.5} 
      intensity={intensity} 
      color={color} 
      distance={40}
      castShadow
      target-position={[0, 0.5, 0]}
    />
  );
};

const SirenLight = ({ zStart, speed, x, color, intensity, offset }: { zStart: number, speed: number, x: number, color: string, intensity: number, offset: number }) => {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      // Move light along Z axis
      ref.current.position.z += speed * 20 * delta; 
      // Reset when it passes far enough
      if (ref.current.position.z > 20) {
        ref.current.position.z = -100; // Sirens appear less frequently
      }
      
      // Flash effect
      const time = state.clock.getElapsedTime();
      const flash = Math.sin(time * 20 + offset) > 0 ? 1 : 0;
      ref.current.intensity = intensity * flash;
    }
  });

  return (
    <spotLight 
      ref={ref} 
      position={[x, 1, zStart]} 
      angle={0.6} 
      penumbra={0.5} 
      intensity={intensity} 
      color={color} 
      distance={50}
      castShadow
      target-position={[0, 0.5, 0]}
    />
  );
};

const TunnelLight = ({ zStart, speed, x }: { zStart: number, speed: number, x: number }) => {
    const ref = useRef<THREE.RectAreaLight>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            // Increased speed multiplier for high-speed effect
            ref.current.position.z += speed * 60 * delta;
            if (ref.current.position.z > 20) {
                ref.current.position.z = -100;
            }
        }
    });

    return (
        <rectAreaLight
            ref={ref}
            width={0.5} // Narrower width for "tube" look
            height={20} // Longer length
            color="#ffffff"
            intensity={80}
            position={[x, 6, zStart]}
            rotation={[-Math.PI / 2, 0, 0]}
        />
    );
};

const StreetLamp = ({ zStart, speed, x }: { zStart: number, speed: number, x: number }) => {
    const ref = useRef<THREE.SpotLight>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.z += speed * 20 * delta;
            if (ref.current.position.z > 20) {
                ref.current.position.z = -60;
            }
        }
    });

    return (
        <spotLight
            ref={ref}
            position={[x, 8, zStart]}
            angle={0.5}
            penumbra={0.5}
            intensity={100}
            color="#ffaa00"
            distance={30}
            castShadow
            shadow-bias={-0.0001}
            target-position={[x, 0, zStart]}
        />
    );
};

const ShadowCaster = ({ zStart, speed }: { zStart: number, speed: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.z += speed * 20 * delta;
      if (ref.current.position.z > 20) {
        ref.current.position.z = -60;
        // Randomize rotation slightly for variety
        ref.current.rotation.z = (Math.random() - 0.5) * 0.2;
      }
    }
  });

  return (
    <group ref={ref} position={[0, 0, zStart]}>
      {/* Powerlines - thin wires crossing overhead */}
      <mesh position={[0, 7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 25, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 7.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 25, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Tree Branch Overhang - creates complex shadows */}
      <group position={[5, 6, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.3, 7, 5]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 1.5, 1]} rotation={[0.5, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.15, 3.5, 4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, -1.5, -1]} rotation={[-0.5, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.15, 3.5, 4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
};

const ChaseStrobe = ({ x, z, color, speed, offset }: { x: number, z: number, color: string, speed: number, offset: number }) => {
  const ref = useRef<THREE.SpotLight>(null);
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      // Fast strobe effect
      const flash = Math.sin(time * speed + offset) > 0 ? 1 : 0; 
      ref.current.intensity = 800 * flash;
    }
  });

  return (
    <spotLight
      ref={ref}
      position={[x, 1.5, z]} 
      angle={0.6}
      penumbra={0.2}
      intensity={0}
      color={color}
      distance={30}
      castShadow
      target-position={[0, 0.5, 0]}
    />
  );
};

function SPSCamera({ active }: { active: boolean }) {
  useFrame((state) => {
    if (active) {
       // Driver side (-X), level with horizon (Y=1.5), looking at car (0,1,0)
       state.camera.position.lerp(new THREE.Vector3(-8, 1.5, 0), 0.1);
       state.camera.lookAt(0, 1, 0);
    }
  });
  return null;
}



export default function Scene() {
  const [finish, setFinish] = useState<FinishType>('gloss');
  
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isIdle) {
        idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
        }, 8000); // 8 seconds idle time
    }
  };

  // Setup idle timer listeners
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    const handleActivity = () => resetIdleTimer();

    events.forEach(e => window.addEventListener(e, handleActivity));
    resetIdleTimer(); // Start timer on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isIdle]); // Re-bind when isIdle changes to ensure logic holds
  
  const currentColors = useMemo(() => {
    if (finish === 'fluorescent') return FLUORESCENT_COLORS;
    if (finish === 'iridescent') return IRIDESCENT_COLORS;
    return STANDARD_COLORS;
  }, [finish]);
  
  const [color, setColor] = useState(STANDARD_COLORS[0].value);
  
  // Find secondary color if iridescent
  const secondaryColor = useMemo(() => {
    if (finish === 'iridescent') {
      const c = IRIDESCENT_COLORS.find(c => c.value === color);
      return c?.secondary || '#000000';
    }
    return undefined;
  }, [finish, color]);

  const [hexInput, setHexInput] = useState(color.replace('#', ''));
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lighting, setLighting] = useState<keyof typeof ENVIRONMENTS>('studio');
  const [sceneType, setSceneType] = useState<keyof typeof SCENES>('showroom');
  const [autoRotate, setAutoRotate] = useState(false);
  const [mobileTab, setMobileTab] = useState<'car' | 'env'>('car');
  const [lunacyMaterial, setLunacyMaterial] = useState('cyber_hex');
  const [customTextureUrl, setCustomTextureUrl] = useState('');
  const [spsMode, setSpsMode] = useState(false);
  const [viewMode, setViewMode] = useState<'exterior' | 'interior'>('exterior');
  
  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(color.replace('#', ''));
  }, [color]);

  // Switch to a default color when switching to/from fluorescent if current color is not in the new set
  useEffect(() => {
    const isCurrentColorInSet = currentColors.some(c => c.value === color);
    if (!isCurrentColorInSet) {
      setColor(currentColors[0].value);
    }
  }, [finish, currentColors]);

  // Camera controls ref
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // UI Refs for click-outside detection
  const headerRef = useRef<HTMLDivElement>(null);
  const rightControlsRef = useRef<HTMLDivElement>(null);
  const bottomControlsRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Click outside to toggle UI
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        const target = event.target as Node;

        // Check if click is inside any of the UI panels
        const isInsideHeader = headerRef.current?.contains(target);
        const isInsideRight = rightControlsRef.current?.contains(target);
        const isInsideBottom = bottomControlsRef.current?.contains(target);
        const isInsideToggle = toggleBtnRef.current?.contains(target);

        // If click is outside all UI panels and toggle button, toggle UI
        if (!isInsideHeader && !isInsideRight && !isInsideBottom && !isInsideToggle) {
            setIsIdle(prev => !prev);
            if (isIdle) resetIdleTimer();
        }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);

    return () => {
        window.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isIdle]);

  // Handle view mode changes
  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;

    if (viewMode === 'interior' && !spsMode) {
      controlsRef.current.minDistance = 0.01;
      controlsRef.current.maxDistance = 0.01;
      const rot = Math.PI / 1.2;
      
      // Tesla Model 3 driver seat approximate local position
      // X: -0.35 (left side), Y: 0.5 (head height from car origin), Z: -0.1 (slightly forward)
      const localPos = new THREE.Vector3(-0.35, 0.5, -0.1);
      const worldPos = localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      worldPos.y += 0.75; // Add car's Y offset
      
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      
      // Place camera at the head position, and target slightly in front to allow looking around
      cameraRef.current.position.copy(worldPos);
      controlsRef.current.target.copy(worldPos.clone().add(forward.multiplyScalar(0.1)));
      controlsRef.current.update();
    } else if (viewMode === 'exterior' && !spsMode) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.minDistance = 3;
      controlsRef.current.maxDistance = 15;
      // Always snap back to the default exterior position when exiting interior mode
      cameraRef.current.position.set(3, 2, 5);
      setAutoRotate(true); // Enable auto-rotate when snapping out
      controlsRef.current.update();
    }
  }, [viewMode, spsMode]);

  const handleZoom = (factor: number) => {
    if (cameraRef.current && controlsRef.current) {
      const currentPos = cameraRef.current.position;
      const targetDist = currentPos.length() * factor;
      
      if (targetDist < 3 || targetDist > 15) return;
      
      if (factor < 1) {
         cameraRef.current.position.lerp(new THREE.Vector3(2, 1.5, 3.5), 0.5);
      } else {
         cameraRef.current.position.lerp(new THREE.Vector3(3, 2, 5), 0.5);
      }
      controlsRef.current.update();
    }
  };

  const currentEnv = ENVIRONMENTS[lighting];
  const currentScene = SCENES[sceneType];

  return (
    <div className="relative w-full h-screen transition-colors duration-1000" style={{ backgroundColor: currentScene.color }}>
      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[3, 2, 5]} fov={50} ref={cameraRef} />
        <SPSCamera active={spsMode} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]} isPaused={false}>
            <Ground />
            {spsMode && <CrashTestDummies />}
            {spsMode && <CarCollider rotation={[0, spsMode ? Math.PI : Math.PI / 1.2, 0]} />}

          <ErrorBoundary fallback={
            <Html center>
              <div className="flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-red-500/20 text-center">
                <AlertTriangle className="text-red-500 mb-2" size={32} />
                <h3 className="text-white font-mono text-xs uppercase tracking-widest mb-1">Asset Error</h3>
                <p className="text-white/40 text-[10px] max-w-[150px]">Failed to initialize 3D vehicle. Please refresh.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-tighter rounded-full"
                >
                  Retry
                </button>
              </div>
            </Html>
          }>
            <Car 
              color={color} 
              secondaryColor={secondaryColor} 
              finish={finish} 
              lunacyMaterial={finish === 'lunacy' ? (customTextureUrl || lunacyMaterial) : undefined}
              moving={spsMode || lighting === 'tunnel' || lighting === 'highway' || lighting === 'emergency'} 
              spsMode={spsMode}
            />
          </ErrorBoundary>
          
          {/* Dynamic Tunnel Lights */}
          {lighting === 'tunnel' && (
             <group>
                {/* Left Tube Lights */}
                <TunnelLight zStart={-20} speed={4} x={-3} />
                <TunnelLight zStart={-50} speed={4} x={-3} />
                <TunnelLight zStart={-80} speed={4} x={-3} />
                <TunnelLight zStart={-110} speed={4} x={-3} />

                {/* Right Tube Lights */}
                <TunnelLight zStart={-20} speed={4} x={3} />
                <TunnelLight zStart={-50} speed={4} x={3} />
                <TunnelLight zStart={-80} speed={4} x={3} />
                <TunnelLight zStart={-110} speed={4} x={3} />
                
                {/* Side Wall Lights (simulated) */}
                <MovingLight zStart={-10} speed={3} x={-8} color="#ffffff" intensity={50} />
                <MovingLight zStart={-30} speed={3} x={8} color="#ffffff" intensity={50} />
             </group>
          )}

          {/* Dynamic Highway Lights */}
          {lighting === 'highway' && (
            <group>
              {/* Oncoming Traffic (White/Blue-ish) - Left side */}
              <MovingLight zStart={-20} speed={1.2} x={-5} color="#ffffff" intensity={200} />
              <MovingLight zStart={-50} speed={1.5} x={-6} color="#e0e0ff" intensity={150} />
              <MovingLight zStart={-80} speed={1.3} x={-4} color="#ffffff" intensity={180} />
              
              {/* Passing Traffic (Red Tail Lights) - Right side */}
              <MovingLight zStart={-10} speed={0.8} x={5} color="#ff0000" intensity={150} />
              <MovingLight zStart={-40} speed={0.9} x={6} color="#ff2200" intensity={120} />
              
              {/* Overhead Street Lamps */}
              <StreetLamp zStart={-15} speed={1.2} x={8} />
              <StreetLamp zStart={-45} speed={1.2} x={8} />
              <StreetLamp zStart={-75} speed={1.2} x={8} />
              
              {/* Shadows (Trees/Powerlines) - Sync speed with lamps */}
              <ShadowCaster zStart={-15} speed={1.2} />
              <ShadowCaster zStart={-45} speed={1.2} />
              <ShadowCaster zStart={-75} speed={1.2} />
            </group>
          )}
          
          {/* Emergency Chase - Strobes Only */}
          {lighting === 'emergency' && (
            <group>
               {/* Fast flashing strobes behind the car (z > 0) */}
               <ChaseStrobe x={-2} z={8} color="#ff0000" speed={30} offset={0} />
               <ChaseStrobe x={2} z={8} color="#0000ff" speed={30} offset={Math.PI} />
               {/* Add a second pair for more chaos */}
               <ChaseStrobe x={-1} z={8} color="#ffffff" speed={40} offset={Math.PI / 2} />
               <ChaseStrobe x={1} z={8} color="#ff0000" speed={40} offset={Math.PI * 1.5} />
            </group>
          )}

          {/* Dynamic Floor/Environment */}
          {(sceneType === 'showroom' || sceneType === 'photo_studio') && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
              <planeGeometry args={[20, 20]} />
              <MeshReflectorMaterial
                blur={sceneType === 'photo_studio' ? [500, 500] : [300, 100]}
                resolution={1024}
                mixBlur={1}
                mixStrength={sceneType === 'photo_studio' ? 8 : 40}
                roughness={sceneType === 'photo_studio' ? 0.8 : 1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color={sceneType === 'photo_studio' ? '#e8e8e8' : '#101010'}
                metalness={sceneType === 'photo_studio' ? 0.1 : 0.5}
                mirror={0}
                transparent={sceneType === 'photo_studio'}
                opacity={sceneType === 'photo_studio' ? 0.3 : 1}
              />
            </mesh>
          )}

          {sceneType === 'photo_studio' && (
             <fog attach="fog" args={['#e8e8e8', 5, 30]} />
          )}

          {sceneType === 'moon' && (
            <>
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100, 64, 64]} />
                <meshStandardMaterial 
                  color="#333" 
                  roughness={0.9} 
                  displacementScale={0.2}
                  wireframe={false}
                />
              </mesh>
              <MoonCraters />
              <MoonDust />
              {/* Hard Space Light */}
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={3} 
                castShadow 
                shadow-bias={-0.0001}
              />
              <fog attach="fog" args={['#000', 5, 30]} />
            </>
          )}

          {sceneType === 'salt_flats' && (
            <>
              {/* Infinite Sky */}
              <Sky 
                sunPosition={[100, 20, 100]} 
                turbidity={0.1} 
                rayleigh={0.5} 
                mieCoefficient={0.005} 
                mieDirectionalG={0.8} 
              />
              
              {/* Bright Sunlight */}
              <ambientLight intensity={0.5} />
              <directionalLight 
                position={[50, 50, 25]} 
                intensity={2} 
                castShadow 
                shadow-mapSize={[2048, 2048]} 
              />

              {/* Vast White Ground - Matte (No Reflection) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial 
                  color="#ffffff" 
                  roughness={1} 
                  metalness={0} 
                />
              </mesh>
              
              {/* Fog to blend horizon seamlessly into the sky */}
              <fog attach="fog" args={['#ffffff', 10, 200]} /> 
            </>
          )}

          {sceneType === 'desert' && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100, 32, 32]} />
                <meshStandardMaterial color="#dcb183" roughness={1} />
              </mesh>
              <Rocks />
              <Cactus />
              <DesertDust />
              <fog attach="fog" args={['#dcb183', 5, 40]} />
            </>
          )}

          {/* Shadows for grounding */}
          <ContactShadows 
            resolution={1024} 
            scale={20} 
            blur={2} 
            opacity={0.5} 
            far={10} 
            color="#000000" 
          />
          
          {/* @ts-ignore - Environment preset types are strict string unions */}
          <Environment preset={currentEnv.preset} background={false} blur={0.8} />
          </Physics>
        </Suspense>

        <OrbitControls 
          ref={controlsRef}
          enabled={!spsMode}
          enablePan={viewMode === 'interior'} 
          enableZoom={viewMode === 'exterior'}
          minPolarAngle={0} 
          maxPolarAngle={viewMode === 'exterior' ? Math.PI / 2.1 : Math.PI} 
          minDistance={viewMode === 'exterior' ? 3 : 0.01}
          maxDistance={viewMode === 'exterior' ? 15 : 0.01}
          autoRotate={autoRotate && !spsMode && viewMode === 'exterior'}
          autoRotateSpeed={0.5}
          makeDefault
        />
      </Canvas>

      <Loader />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
        
        {/* Idle Toggle Button - Always Visible */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 pointer-events-auto z-50 flex flex-col gap-3">
            <button
                ref={toggleBtnRef}
                onClick={() => {
                    setIsIdle(!isIdle);
                    if (isIdle) resetIdleTimer(); // Restart timer if waking up
                }}
                className={`group relative p-3 border transition-all duration-300 ${
                    isIdle 
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' 
                    : 'bg-black/40 border-white/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/60'
                }`}
                title={isIdle ? "Show Controls" : "Hide Controls"}
            >
                {isIdle ? <Eye size={20} /> : <EyeOff size={20} />}
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        </div>

        {/* SPS Toggle */}
        <div className="absolute bottom-8 left-0 pointer-events-auto z-50 group">
            <div className="transform -translate-x-[calc(100%-3.25rem)] group-hover:translate-x-0 transition-transform duration-300 ease-in-out">
                <button
                    onClick={() => setSpsMode(!spsMode)}
                    className={`relative p-3 border-y border-r rounded-r-xl transition-all duration-300 flex items-center gap-3 ${
                        spsMode 
                        ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] animate-pulse' 
                        : 'bg-black/40 border-white/20 text-white/60 hover:bg-red-900/50 hover:text-white hover:border-red-500/60 backdrop-blur-md'
                    }`}
                    title="SPS MODE (Safety Protocol System)"
                >
                    <span className="text-[10px] font-bold whitespace-nowrap pl-1">
                        SPS MODE ACTIVE
                    </span>
                    <AlertTriangle size={20} />
                </button>
            </div>
        </div>

        {/* Header */}
        <motion.header 
            ref={headerRef}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: isIdle ? -100 : 0, opacity: isIdle ? 0 : 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start pointer-events-auto z-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 animate-pulse" />
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white drop-shadow-lg font-mono italic">TESLARRR<span className="text-red-500">_</span></h1>
            </div>
            <p className="text-[8px] md:text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase flex items-center gap-2 border-l-2 border-white/20 pl-3">
              <span className="opacity-50 hidden md:inline">BETA</span>
              <span className="w-px h-3 bg-white/20 hidden md:block" />
              <span className="opacity-50 hidden md:inline">C.JEY.</span>
              <span className="w-px h-3 bg-white/20 hidden md:block" />
              <span className="inline-flex font-bold">
                <motion.span 
                  animate={{ color: ['#ff0000', '#00ff00', '#0000ff', '#ff0000'] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >R</motion.span>
                <motion.span 
                  animate={{ color: ['#00ff00', '#0000ff', '#ff0000', '#00ff00'] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.2 }}
                >G</motion.span>
                <motion.span 
                  animate={{ color: ['#0000ff', '#ff0000', '#00ff00', '#0000ff'] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.4 }}
                >B</motion.span>
              </span>
              <span className="w-px h-3 bg-white/20" />
              RAPID_RENDERER
            </p>
          </div>
          
          <div className="flex gap-1 mr-14 md:mr-20 bg-black/40 backdrop-blur-md border border-white/10 p-1">
            <button 
              onClick={() => handleZoom(0.5)}
              className="p-2 md:p-3 bg-transparent border border-transparent hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white transition-all"
              title="Fly In"
            >
              <ZoomIn size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button 
              onClick={() => handleZoom(1.5)}
              className="p-2 md:p-3 bg-transparent border border-transparent hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white transition-all"
              title="Reset View"
            >
              <ZoomOut size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center"></div>
            <button 
              onClick={() => setViewMode(viewMode === 'exterior' ? 'interior' : 'exterior')}
              className={`p-2 md:p-3 border transition-all flex items-center gap-2 ${viewMode === 'interior' ? 'bg-white text-black border-white' : 'bg-transparent border-transparent hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white'}`}
              title={viewMode === 'exterior' ? "Switch to Interior" : "Switch to Exterior"}
            >
              <div className="flex items-center gap-1">
                {viewMode === 'exterior' ? <Eye size={16} /> : <RotateCcw size={16} />}
                <span className="text-[10px] font-mono font-bold hidden md:block">
                  {viewMode === 'exterior' ? 'INTERIOR' : 'EXTERIOR'}
                </span>
              </div>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center"></div>
            <button 
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-2 md:p-3 border transition-all ${autoRotate ? 'bg-white text-black border-white' : 'bg-transparent border-transparent hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white'}`}
              title="Auto Rotate"
            >
              <RotateCcw size={16} className={`md:w-[18px] md:h-[18px] ${autoRotate ? 'animate-spin-slow' : ''}`} />
            </button>
            <button className="p-2 md:p-3 bg-transparent border border-transparent hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white transition-all hidden md:block">
              <Share2 size={18} />
            </button>
            <button className="p-2 md:p-3 bg-transparent border border-transparent hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white transition-all hidden md:block">
              <Info size={18} />
            </button>
          </div>
        </motion.header>

        {/* Lighting & Environment Controls - Right Side (Desktop ONLY) */}
        <motion.div 
            ref={rightControlsRef}
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: isIdle ? 100 : 0, opacity: isIdle ? 0 : 1 }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
            className="absolute top-1/2 right-8 -translate-y-1/2 hidden md:flex flex-col gap-8 pointer-events-auto z-10"
        >
          
          {/* Lighting Picker */}
          <div className="flex flex-col gap-1">
            <div className="text-[8px] md:text-[9px] text-white/40 font-mono uppercase tracking-widest text-right mb-1 border-b border-white/10 pb-1">Light_Source</div>
            <div className="flex flex-col gap-1 bg-black/40 backdrop-blur-md border-l border-white/10 p-1">
                {Object.entries(ENVIRONMENTS).map(([key, env]) => (
                <button 
                    key={key}
                    onClick={() => setLighting(key as any)}
                    className={`p-2 md:p-3 transition-all relative group flex items-center justify-end gap-3 ${
                        lighting === key 
                        ? 'bg-white text-black' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                    title={env.name}
                >
                    <span className={`text-[10px] font-mono uppercase tracking-wider hidden md:block ${lighting === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {env.name}
                    </span>
                    <env.icon size={16} className="md:w-[18px] md:h-[18px]" />
                    {lighting === key && <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500" />}
                </button>
                ))}
            </div>
          </div>

          {/* Scene Picker */}
          <div className="flex flex-col gap-1">
            <div className="text-[8px] md:text-[9px] text-white/40 font-mono uppercase tracking-widest text-right mb-1 border-b border-white/10 pb-1">Environment</div>
            <div className="flex flex-col gap-2 items-end">
                {Object.entries(SCENES).map(([key, scene]) => (
                <button 
                    key={key}
                    onClick={() => setSceneType(key as any)}
                    className={`w-8 h-8 md:w-10 md:h-10 transition-all relative group border border-white/10 overflow-hidden ${
                        sceneType === key ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'opacity-50 hover:opacity-100 hover:border-white/40'
                    }`}
                    title={scene.name}
                    style={{ backgroundColor: scene.color }}
                >
                    {sceneType === key && (
                        <div className="absolute inset-0 border-2 border-white/20" />
                    )}
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-mono px-2 py-1 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
                    {scene.name}
                    </span>
                </button>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Main Controls - Bottom */}
        <motion.div 
            ref={bottomControlsRef}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: isIdle ? 200 : 0, opacity: isIdle ? 0 : 1 }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
            className="absolute bottom-0 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-0 md:px-6 pointer-events-auto z-10"
        >
          <div className="bg-black/80 backdrop-blur-xl border-t md:border border-white/20 p-1 shadow-2xl relative">
            {/* Decorative Tech Lines */}
            <div className="absolute -top-1 left-0 w-4 h-1 bg-white" />
            <div className="absolute -top-1 right-0 w-4 h-1 bg-white" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/40" />

            {/* Mobile Tabs */}
            <div className="flex md:hidden border-b border-white/10">
                <button 
                    onClick={() => setMobileTab('car')} 
                    className={`flex-1 p-3 text-[10px] font-mono uppercase tracking-widest transition-colors ${mobileTab === 'car' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white'}`}
                >
                    Vehicle
                </button>
                <button 
                    onClick={() => setMobileTab('env')} 
                    className={`flex-1 p-3 text-[10px] font-mono uppercase tracking-widest transition-colors ${mobileTab === 'env' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white'}`}
                >
                    Environment
                </button>
            </div>

            {/* Car Controls (Visible if Tab=Car OR Desktop) */}
            <div className={`${mobileTab === 'car' ? 'block' : 'hidden'} md:block p-4 md:p-6 border border-white/5 flex flex-col gap-4 md:gap-6`}>
                {/* Finishes */}
                <div className="flex justify-center gap-px bg-white/5 p-1 overflow-x-auto">
                {FINISHES.map((f) => (
                    <button
                    key={f.id}
                    onClick={() => setFinish(f.id)}
                    className={`px-3 py-2 md:px-6 text-[10px] md:text-xs font-mono uppercase tracking-wider transition-all flex-1 whitespace-nowrap ${
                        finish === f.id 
                        ? 'bg-white text-black font-bold' 
                        : 'bg-transparent text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    {f.name}
                    </button>
                ))}
                </div>

                {/* View Mode Toggle (Mobile/Bottom) */}
                <div className="flex md:hidden justify-center gap-px bg-white/5 p-1">
                    <button
                        onClick={() => setViewMode('exterior')}
                        className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'exterior' ? 'bg-white text-black font-bold' : 'text-white/40'}`}
                    >
                        Exterior
                    </button>
                    <button
                        onClick={() => setViewMode('interior')}
                        className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'interior' ? 'bg-white text-black font-bold' : 'text-white/40'}`}
                    >
                        Interior
                    </button>
                </div>

                {/* Colors or Lunacy Library */}
                <div className="flex flex-col gap-4 relative">
                
                {finish === 'lunacy' ? (
                    <div className="flex flex-col gap-4">
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest border-b border-white/10 pb-1 flex justify-between items-center">
                            <span>Material Library</span>
                            <span className="text-[8px] bg-white/10 px-1 rounded">UNREAL_ENGINE_ASSETS</span>
                        </div>
                        
                        {/* Presets Grid */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {LUNACY_MATERIALS.map((mat) => (
                                <button
                                    key={mat.id}
                                    onClick={() => {
                                        setLunacyMaterial(mat.id);
                                        setCustomTextureUrl('');
                                    }}
                                    className={`group relative aspect-square border transition-all overflow-hidden ${
                                        lunacyMaterial === mat.id && !customTextureUrl
                                        ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                                        : 'border-white/10 hover:border-white/40'
                                    }`}
                                >
                                    <div 
                                        className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: mat.color }}
                                    />
                                    {/* Scanline effect */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />
                                    
                                    <span className="absolute bottom-1 left-1 text-[8px] font-mono uppercase text-white drop-shadow-md leading-none">
                                        {mat.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Custom Texture URL Input */}
                        <div className="flex flex-col gap-1 mt-2">
                             <div className="text-[9px] text-white/40 font-mono uppercase tracking-widest">Import Custom Texture (URL)</div>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={customTextureUrl}
                                    onChange={(e) => setCustomTextureUrl(e.target.value)}
                                    placeholder="https://example.com/texture.jpg"
                                    className="bg-white/5 border border-white/10 text-xs text-white font-mono px-3 py-2 w-full focus:outline-none focus:border-white/40 placeholder:text-white/20"
                                />
                                {customTextureUrl && (
                                    <button 
                                        onClick={() => setCustomTextureUrl('')}
                                        className="px-3 bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                             </div>
                             <p className="text-[8px] text-white/30">Supports .jpg, .png. CORS enabled URLs required.</p>
                        </div>
                    </div>
                ) : (
                <>
                {/* Color Picker Popup */}
                {showColorPicker && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 bg-black border border-white/20 p-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-2 w-64">
                        <div className="flex justify-between items-center bg-white/5 p-2">
                            <span className="text-[10px] font-mono uppercase text-white/60 tracking-widest">Manual_Override</span>
                            <button onClick={() => setShowColorPicker(false)} className="text-white/40 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                        <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', height: '160px', borderRadius: 0 }} />
                    </div>
                )}

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start items-center px-1">
                    {/* Custom Color Trigger */}
                    <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`relative group w-14 h-14 border transition-all flex-shrink-0 overflow-hidden ${
                    !currentColors.some(c => c.value === color) ? 'border-white' : 'border-white/10 hover:border-white/40'
                    }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-bold text-white drop-shadow-md tracking-widest font-mono bg-black/50 px-1">CUSTOM</span>
                    </div>
                    {!currentColors.some(c => c.value === color) && (
                        <div className="absolute inset-0 border-2 border-white" />
                    )}
                    </button>

                    <div className="w-px h-10 bg-white/10 mx-2" />

                    {currentColors.map((c) => (
                    <button
                        key={c.name}
                        onClick={() => {
                            setColor(c.value);
                            setShowColorPicker(false);
                        }}
                        className={`group relative w-12 h-12 transition-all flex-shrink-0 ${
                        color === c.value ? 'scale-110 z-10' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        title={c.name}
                    >
                        <div 
                            className={`w-full h-full shadow-lg transition-all duration-300 ${color === c.value ? 'rounded-none rotate-45 scale-75' : 'rounded-full'}`}
                            style={{ backgroundColor: c.value }} 
                        />
                        {color === c.value && (
                            <div className="absolute inset-0 border border-white rotate-45 scale-[0.85] shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        )}
                    </button>
                    ))}
                </div>

                {/* Hex Input & Info */}
                <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-0">
                        <div className="bg-white/5 border border-white/10 px-3 py-2 flex items-center gap-2">
                            <div className="w-3 h-3" style={{ backgroundColor: color }} />
                            <span className="text-white/40 font-mono text-xs">#</span>
                            <input 
                                type="text" 
                                value={hexInput}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                    setHexInput(val);
                                    if (val.length === 6) {
                                        setColor('#' + val);
                                    }
                                }}
                                onBlur={() => {
                                    if (hexInput.length < 6) {
                                        setHexInput(color.replace('#', ''));
                                    }
                                }}
                                className="bg-transparent border-none text-sm text-white font-mono w-16 focus:outline-none uppercase tracking-widest"
                                placeholder="HEX"
                            />
                        </div>
                        <button 
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`p-2 border-y border-r border-white/10 transition-colors ${showColorPicker ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                            title="Toggle Color Picker"
                        >
                            <Settings size={16} className={showColorPicker ? "animate-spin-slow" : ""} />
                        </button>
                    </div>

                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] mt-1">
                    {currentColors.find(c => c.value === color)?.name || 'UNREGISTERED_PIGMENT'} <span className="text-white/20 mx-2">|</span> {FINISHES.find(f => f.id === finish)?.name}
                    </p>
                </div>
                </>
                )}
                </div>
            </div>

            {/* Environment Controls (Mobile Only) */}
            <div className={`${mobileTab === 'env' ? 'block' : 'hidden'} md:hidden p-4 flex flex-col gap-6`}>
                
                {/* Light Source */}
                <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest border-b border-white/10 pb-1">Light Source</div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {Object.entries(ENVIRONMENTS).map(([key, env]) => (
                            <button 
                                key={key}
                                onClick={() => setLighting(key as any)}
                                className={`p-3 border transition-all flex-shrink-0 flex flex-col items-center gap-2 min-w-[80px] ${
                                    lighting === key 
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/40'
                                }`}
                            >
                                <div className="relative">
                                    <env.icon size={20} />
                                    {lighting === key && <div className="absolute -right-1 -top-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                                </div>
                                <span className="text-[9px] font-mono uppercase tracking-wider">{env.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Environment Scene */}
                <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest border-b border-white/10 pb-1">Environment</div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {Object.entries(SCENES).map(([key, scene]) => (
                            <button 
                                key={key}
                                onClick={() => setSceneType(key as any)}
                                className={`p-1 border transition-all flex-shrink-0 relative group overflow-hidden w-24 h-12 ${
                                    sceneType === key ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/10 opacity-60'
                                }`}
                                style={{ backgroundColor: scene.color }}
                            >
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono uppercase bg-black/50 text-white font-bold backdrop-blur-[1px] text-center leading-tight p-1">
                                    {scene.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
