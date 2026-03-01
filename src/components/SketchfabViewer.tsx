import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Sketchfab: any;
  }
}

interface SketchfabViewerProps {
  modelUid: string;
  color: string;
  finish: 'gloss' | 'matte' | 'satin' | 'metallic';
}

export function SketchfabViewer({ modelUid, color, finish }: SketchfabViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [api, setApi] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Sketchfab API script
  useEffect(() => {
    if (!window.Sketchfab) {
      const script = document.createElement('script');
      script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
      script.async = true;
      script.onload = () => initViewer();
      document.body.appendChild(script);
    } else {
      initViewer();
    }

    function initViewer() {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const client = new window.Sketchfab( '1.12.1', iframe );
      client.init(modelUid, {
        success: (api: any) => {
          setApi(api);
          api.start();
          api.addEventListener('viewerready', () => {
            setIsLoaded(true);
            api.getMaterialList((err: any, materials: any[]) => {
              if (!err) {
                setMaterials(materials);
                console.log('Materials loaded:', materials);
              }
            });
          });
        },
        error: () => {
          console.error('Sketchfab API error');
        },
        ui_stop: 0,
        ui_controls: 1,
        ui_watermark: 0,
        ui_infos: 0,
      });
    }
  }, [modelUid]);

  // Update Color
  useEffect(() => {
    if (!api || !materials.length) return;

    // Find body material - usually named 'Paint', 'Body', 'CarPaint' etc.
    // For this specific Tesla model, we need to guess or find all paint-like materials
    const bodyMaterials = materials.filter(m => 
      m.name.toLowerCase().includes('paint') || 
      m.name.toLowerCase().includes('body') ||
      m.name.toLowerCase().includes('chassis')
    );

    // Convert hex color to RGB [0-1]
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    bodyMaterials.forEach(material => {
      // Clone the material to avoid reference issues if needed, but usually we just update properties
      // We need to update the Albedo/Diffuse color
      
      // Update PBR channels
      // This depends on the material model (PBR Metal/Roughness is standard)
      
      // Set Color (Albedo)
      api.setMaterialColor(material, [r, g, b]); // Helper if available, or manual property update
      
      // Manual property update for more control
      // We iterate through channels to find Albedo/Diffuse
      const albedoChannel = material.channels.AlbedoPBR || material.channels.DiffusePBR || material.channels.DiffuseColor;
      if (albedoChannel) {
        api.setTextureQuality(material.name, 'hd'); // Ensure high quality
        
        // We can't easily change the texture color if it's a texture, but we can set the factor
        if (albedoChannel.factor) {
           // Update the color factor
           // Note: The API might require a specific structure for updates
           // api.setMaterial(material, callback) is the way
        }
      }
    });
    
    // Simpler approach using setMaterialColor which is a helper in some versions, 
    // but standard way is updating the material object and calling setMaterial
    
    bodyMaterials.forEach(m => {
       // Construct the change object
       // We only change the AlbedoPBR color factor
       const changes: any = {};
       
       if (m.channels.AlbedoPBR) {
         changes.channels = {
           AlbedoPBR: {
             enable: true,
             factor: [r, g, b, 1] // RGBA
           }
         };
       } else if (m.channels.DiffusePBR) {
         changes.channels = {
           DiffusePBR: {
             enable: true,
             factor: [r, g, b, 1]
           }
         };
       } else if (m.channels.DiffuseColor) {
          changes.channels = {
           DiffuseColor: {
             enable: true,
             factor: [r, g, b, 1]
           }
         };
       }
       
       // Also update roughness/metalness based on finish
       let roughnessVal = finish === 'matte' ? 0.8 : finish === 'satin' ? 0.4 : 0.15;
       let metalnessVal = finish === 'metallic' ? 0.9 : 0.1;
       let clearcoatVal = finish === 'gloss' || finish === 'metallic' ? 1.0 : 0.0;

       if (!changes.channels) changes.channels = {};
       
       if (m.channels.RoughnessPBR) {
         changes.channels.RoughnessPBR = { enable: true, factor: roughnessVal };
       }
       
       if (m.channels.MetalnessPBR) {
         changes.channels.MetalnessPBR = { enable: true, factor: metalnessVal };
       }
       
       if (m.channels.ClearCoat) {
          changes.channels.ClearCoat = { enable: true, factor: clearcoatVal };
       }

       api.setMaterial(m, changes, () => {
         // console.log('Material updated');
       });
    });

  }, [api, materials, color, finish]);

  return (
    <iframe
      ref={iframeRef}
      title="Sketchfab Viewer"
      className="w-full h-full border-0"
      allow="autoplay; fullscreen; vr"
      allowFullScreen
    />
  );
}
