import { useMemo } from 'react';
import { Ragdoll } from './Ragdoll';

export function CrashTestDummies() {
    // Generate random dummy positions
    const dummies = useMemo(() => {
        const items = [];
        for(let i=0; i<25; i++) { // More dummies!
            items.push({
                id: i,
                position: [
                    (Math.random() - 0.5) * 6, // Spread x
                    0,
                    10 + (Math.random() * 50) // Start from +10 to +60
                ] as [number, number, number],
                velocity: [
                    (Math.random() - 0.5) * 5, // Some side-to-side movement
                    0, 
                    -50 - Math.random() * 20 // Negative Z velocity
                ] as [number, number, number],
                color: Math.random() > 0.5 ? '#facc15' : '#ffffff'
            });
        }
        return items;
    }, []);

    return (
        <group>
            {dummies.map(d => (
                <Ragdoll 
                    key={d.id} 
                    position={d.position} 
                    velocity={d.velocity}
                    color={d.color} 
                />
            ))}
        </group>
    );
}
