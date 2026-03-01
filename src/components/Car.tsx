import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useLayoutEffect, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

// Define the type for the GLTF result to avoid TS errors
type GLTFResult = {
  nodes: {
    [key: string]: THREE.Mesh;
  };
  materials: {
    [key: string]: THREE.Material;
  };
  scene: THREE.Group;
};

interface CarProps {
  color: string;
  secondaryColor?: string;
  finish: 'gloss' | 'matte' | 'satin' | 'metallic' | 'fluorescent' | 'iridescent' | 'lunacy';
  lunacyMaterial?: string;
  moving?: boolean;
  spsMode?: boolean;
}

const LUNACY_MODES: Record<string, number> = {
  'cyber_hex': 1,
  'plasma': 2,
  'liquid_gold': 3,
  'damascus': 4,
  'matrix': 5,
  'magma': 6,
};

export function Car({ color, secondaryColor, finish, lunacyMaterial, moving = false, spsMode = false }: CarProps) {
  // Load the model - Using the downloaded Tesla Model 3
  const { scene, nodes, materials } = useGLTF(
    '/tesla/2023_tesla_model_3_performance.glb'
  ) as unknown as GLTFResult;

  // Custom Texture Loading
  const [customTexture, setCustomTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    if (lunacyMaterial && lunacyMaterial.startsWith('http')) {
        new THREE.TextureLoader().load(lunacyMaterial, (tex) => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            setCustomTexture(tex);
        });
    } else {
        setCustomTexture(null);
    }
  }, [lunacyMaterial]);

  // Identify wheels for animation
  const wheels = useMemo(() => {
    const wheelMeshes: THREE.Object3D[] = [];
    if (!scene) return wheelMeshes;
    
    scene.traverse((child) => {
      // Look for objects that seem to be main wheel containers or meshes
      // "Wheel" is standard. We avoid "steering_wheel" if possible.
      const name = child.name.toLowerCase();
      if (name.includes('wheel') && !name.includes('steering')) {
         // Check if it's a mesh or a group that holds the wheel
         // For this specific model, we might need to experiment, but usually rotating the mesh works
         if ((child as THREE.Mesh).isMesh) {
            wheelMeshes.push(child);
         }
      }
    });
    return wheelMeshes;
  }, [scene]);

  // Configure material properties based on finish
  const roughness = finish === 'matte' || finish === 'fluorescent' ? 0.8 : finish === 'satin' ? 0.4 : 0.15;
  const metalness = finish === 'metallic' || finish === 'iridescent' ? 0.8 : 0.1;
  const clearcoat = finish === 'gloss' || finish === 'metallic' || finish === 'iridescent' ? 1.0 : 0.0;
  const clearcoatRoughness = finish === 'gloss' ? 0.05 : 0.1;

  // Find the body material
  const bodyMaterial = useMemo(() => {
    if (!materials || !scene) return undefined;
    
    // In this specific model, there might be multiple materials that need to be painted
    // or the naming is very specific.
    // Instead of finding just one, let's find ALL materials that look like paint
    // and return the first one as the "primary" for animation, but apply changes to all.
    
    let primaryMat: THREE.Material | undefined;
    const paintMaterials: THREE.Material[] = [];
    
    // Helper to check if a material name sounds like paint
    const isPaint = (name: string) => {
      const n = name.toLowerCase();
      return n.includes('paint') || 
             n.includes('body') || 
             n.includes('metal') || 
             n.includes('exterior') ||
             n.includes('color');
    };

    // 1. Search in materials object
    Object.entries(materials).forEach(([name, mat]) => {
      if (isPaint(name)) {
        paintMaterials.push(mat);
        if (!primaryMat) primaryMat = mat;
      }
    });
    
    // 2. Traverse scene if we didn't find enough
    if (paintMaterials.length === 0) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          const mat = m.material as THREE.Material;
          if (isPaint(m.name) || isPaint(mat.name)) {
             if (!paintMaterials.includes(mat)) {
               paintMaterials.push(mat);
               if (!primaryMat) primaryMat = mat;
             }
          }
        }
      });
    }
    
    // Attach the list to the primary material so we can access it in useFrame
    if (primaryMat) {
      (primaryMat as any)._linkedMaterials = paintMaterials;
    }
    
    return primaryMat as THREE.MeshStandardMaterial;
  }, [materials, scene]);

  useLayoutEffect(() => {
    // Apply initial settings to ALL found paint materials
    if (bodyMaterial && (bodyMaterial as any)._linkedMaterials) {
      (bodyMaterial as any)._linkedMaterials.forEach((mat: THREE.MeshStandardMaterial) => {
        // Ensure we reset these if switching away from fluorescent
        mat.emissive = new THREE.Color(0, 0, 0);
        mat.emissiveIntensity = 0;
        
        // Inject shader for Iridescence
        mat.onBeforeCompile = (shader) => {
            mat.userData.shader = shader;
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uBaseColor = { value: new THREE.Color(color) };
            shader.uniforms.uSecondaryColor = { value: new THREE.Color(secondaryColor || color) };
            shader.uniforms.uIridescent = { value: finish === 'iridescent' ? 1.0 : 0.0 };
            shader.uniforms.uFluorescent = { value: finish === 'fluorescent' ? 1.0 : 0.0 };
            shader.uniforms.uLunacyMode = { value: 0 };
            shader.uniforms.uCustomTexture = { value: null };

            // Add uniforms
            // Note: vViewPosition is already declared in MeshStandardMaterial
            
            // We need to ensure vViewPosition is set if it's not already in the standard shader
            // MeshStandardMaterial usually has it, but let's be safe by hooking into the end of main
            // Actually, standard material defines vViewPosition in the prefix if needed.
            // Let's just use the standard <project_vertex> chunk which sets mvPosition, 
            // and then set vViewPosition = -mvPosition.xyz;
            
            shader.vertexShader = shader.vertexShader.replace(
              '#include <project_vertex>',
              `
              #include <project_vertex>
              vViewPosition = -mvPosition.xyz;
              `
            );

            shader.fragmentShader = `
              uniform float uTime;
              uniform float uIridescent;
              uniform float uFluorescent;
              uniform int uLunacyMode;
              uniform sampler2D uCustomTexture;
              uniform vec3 uBaseColor;
              uniform vec3 uSecondaryColor;
              
              // Simplex Noise (3D)
              vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
              vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
              float snoise(vec3 v) {
                const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx) ;
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
                i = mod289(i);
                vec4 p = permute( permute( permute(
                          i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                float n_ = 0.142857142857; // 1.0/7.0
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                              dot(p2,x2), dot(p3,x3) ) );
              }

              ${shader.fragmentShader}
            `;

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <color_fragment>',
              `
              #include <color_fragment>
              
              // --- LUNACY MODES ---
              if (uLunacyMode > 0) {
                  vec3 pos = vViewPosition * 5.0; // Scale position
                  
                  // 1. Cyber Hex
                  if (uLunacyMode == 1) {
                      vec2 uv = pos.xy * 2.0;
                      // Simple grid approximation
                      vec2 r = vec2(1.0, 1.73);
                      vec2 h = r * 0.5;
                      vec2 a = mod(uv, r) - h;
                      vec2 b = mod(uv - h, r) - h;
                      vec2 gv = dot(a, a) < dot(b, b) ? a : b;
                      float hex = 1.0 - smoothstep(0.45, 0.5, length(gv));
                      
                      // Glowing edges
                      float glow = smoothstep(0.4, 0.5, length(gv)) * smoothstep(0.55, 0.5, length(gv));
                      
                      vec3 hexColor = mix(vec3(0.0, 0.0, 0.1), vec3(0.0, 1.0, 0.8), glow * 5.0 * (sin(uTime * 2.0) * 0.5 + 0.5));
                      diffuseColor.rgb = hexColor;
                  }
                  
                  // 2. Plasma
                  else if (uLunacyMode == 2) {
                      float n = snoise(pos * 0.5 + uTime * 0.5);
                      float n2 = snoise(pos * 1.0 - uTime * 0.2);
                      vec3 col = 0.5 + 0.5 * cos(uTime + pos.xyx + vec3(0, 2, 4) + n * 2.0);
                      diffuseColor.rgb = col * (0.8 + 0.2 * n2);
                  }
                  
                  // 3. Liquid Gold
                  else if (uLunacyMode == 3) {
                      float n = snoise(pos * 0.8 + uTime * 0.3);
                      // Gold base
                      vec3 gold = vec3(1.0, 0.84, 0.0);
                      // Flowing highlights
                      float highlight = smoothstep(0.4, 0.6, n);
                      diffuseColor.rgb = mix(gold * 0.5, gold * 1.5, highlight);
                  }
                  
                  // 4. Damascus
                  else if (uLunacyMode == 4) {
                      float n = snoise(pos * 2.0);
                      float n2 = snoise(pos * 2.0 + n * 2.0);
                      float layers = sin(n2 * 20.0);
                      float pattern = smoothstep(-0.2, 0.2, layers);
                      diffuseColor.rgb = mix(vec3(0.2), vec3(0.8), pattern);
                  }
                  
                  // 5. Matrix
                  else if (uLunacyMode == 5) {
                      float n = step(0.9, fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453 + uTime));
                      diffuseColor.rgb = mix(vec3(0.0), vec3(0.0, 1.0, 0.0), n);
                  }
                  
                  // 6. Magma
                  else if (uLunacyMode == 6) {
                      float n = snoise(pos * 0.5 + uTime * 0.1);
                      float cracks = smoothstep(0.4, 0.5, n);
                      vec3 rock = vec3(0.1);
                      vec3 lava = vec3(1.0, 0.3, 0.0) * 2.0;
                      diffuseColor.rgb = mix(lava, rock, cracks);
                  }
                  
                  // 7. Custom Texture
                  else if (uLunacyMode == 7) {
                      vec4 texColor = texture2D(uCustomTexture, vViewPosition.xy * 0.5 + 0.5); // Planar mapping approximation
                      diffuseColor.rgb = texColor.rgb;
                  }
              }

              if (uIridescent > 0.5) {
                  vec3 viewDir = normalize(vViewPosition);
                  vec3 normal = normalize(vNormal);
                  
                  // Calculate angle between view and normal
                  // 1.0 = Facing camera (Base Color)
                  // 0.0 = Glancing angle (Secondary Color)
                  float NdotV = dot(viewDir, normal);
                  
                  // "Slow" transition:
                  // We want a broad gradient that starts shifting as soon as the surface curves.
                  // Using a simple linear mix based on the angle.
                  float mixFactor = 1.0 - max(0.0, NdotV);
                  
                  // Smooth it slightly to avoid harsh linear look
                  mixFactor = smoothstep(0.0, 1.0, mixFactor);
                  
                  // Mix the diffuse color (which tints the metallic reflection)
                  diffuseColor.rgb = mix(uBaseColor, uSecondaryColor, mixFactor);
              }
              `
            );

            // Removed old dithering_fragment injection to prevent conflict
            /* 
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              ...
            );
            */
            
            // Keep fluorescent injection at the end as it's an emissive effect
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `
              #include <dithering_fragment>
              
              // Fluorescent Effect (Glow)
              if (uFluorescent > 0.5) {
                  // Add a self-illuminated look that preserves shading but boosts brightness
                  gl_FragColor.rgb = mix(gl_FragColor.rgb, uBaseColor, 0.3);
                  gl_FragColor.rgb *= 1.2; 
              }
              `
            );
        };
        
        // Trigger recompile
        mat.needsUpdate = true;
      });
    }
    
    // Fix for windows/glass transparency
    Object.values(materials).forEach(m => {
      if (m.name.toLowerCase().includes('glass') || m.name.toLowerCase().includes('window')) {
        m.transparent = true;
        m.opacity = 0.3;
        (m as THREE.MeshStandardMaterial).roughness = 0;
        if ((m as THREE.MeshStandardMaterial).color) {
            (m as THREE.MeshStandardMaterial).color.set('black');
        }
        m.side = THREE.DoubleSide;
      }
    });

    // Fix wheels/tires
    Object.entries(materials).forEach(([name, m]) => {
      // Make rims and tires black
      if (
        name.toLowerCase().includes('tire') || 
        name.toLowerCase().includes('rubber') || 
        name.toLowerCase().includes('wheel') || 
        name.toLowerCase().includes('rim') ||
        name.toLowerCase().includes('chrome') // Often rims are chrome, let's black them out for "Performance" look
      ) {
        (m as THREE.MeshStandardMaterial).color.set('#050505'); // Deep black
        (m as THREE.MeshStandardMaterial).roughness = 0.4; // Satin finish
        (m as THREE.MeshStandardMaterial).metalness = 0.8; // Metallic look
      }
    });
  }, [scene, bodyMaterial]);

  useFrame((state, delta) => {
    if (bodyMaterial && (bodyMaterial as any)._linkedMaterials) {
      const linkedMats = (bodyMaterial as any)._linkedMaterials as THREE.MeshStandardMaterial[];
      
      linkedMats.forEach(mat => {
        let targetColor = new THREE.Color(color);
        let targetSecondaryColor = new THREE.Color(secondaryColor || color);

        // Update shader uniforms if available
        if (mat.userData.shader) {
            mat.userData.shader.uniforms.uBaseColor.value.copy(targetColor);
            mat.userData.shader.uniforms.uSecondaryColor.value.copy(targetSecondaryColor);
            mat.userData.shader.uniforms.uIridescent.value = finish === 'iridescent' ? 1.0 : 0.0;
            mat.userData.shader.uniforms.uFluorescent.value = finish === 'fluorescent' ? 1.0 : 0.0;
            
            // Determine Lunacy Mode
            let lunacyMode = 0;
            if (finish === 'lunacy') {
                if (customTexture) {
                    lunacyMode = 7;
                    mat.userData.shader.uniforms.uCustomTexture.value = customTexture;
                } else if (lunacyMaterial && LUNACY_MODES[lunacyMaterial]) {
                    lunacyMode = LUNACY_MODES[lunacyMaterial];
                }
            }
            mat.userData.shader.uniforms.uLunacyMode.value = lunacyMode;
            
            mat.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
        }

        // Smoothly animate color (base color)
        easing.dampC(mat.color, targetColor, 0.25, delta);
        
        // Smoothly animate material properties
        easing.damp(mat, 'roughness', roughness, 0.25, delta);
        easing.damp(mat, 'metalness', metalness, 0.25, delta);
        
        if ('clearcoat' in mat) {
          // @ts-ignore
          easing.damp(mat, 'clearcoat', clearcoat, 0.25, delta);
          // @ts-ignore
          easing.damp(mat, 'clearcoatRoughness', clearcoatRoughness, 0.25, delta);
        }
      });
    }

    // Spin wheels if moving
    if (moving) {
      wheels.forEach(wheel => {
        // Rotate around X axis (standard for GLTF cars)
        wheel.rotation.x -= delta * (spsMode ? 60 : 20); 
      });
    }
  });

  // Adjust rotation and scale for this specific Tesla model
  // Lift the car up on the Y axis to sit on the floor (0.75 is an estimate based on wheel radius)
  if (!scene) return null;
  
  return <primitive object={scene} rotation={[0, spsMode ? Math.PI : Math.PI / 1.2, 0]} scale={1} position={[0, 0.75, 0]} />;
}

// Preload the model
useGLTF.preload('/tesla/2023_tesla_model_3_performance.glb');


