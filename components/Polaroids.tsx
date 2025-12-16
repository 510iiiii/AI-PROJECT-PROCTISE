import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

interface PolaroidsProps {
  progress: number;
}

const dummy = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

export const Polaroids: React.FC<PolaroidsProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate random textures (using simple colors or URLs if we loaded textures, 
  // here we simulate the polaroid frame with geometry and simple materials)
  
  const instances = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.polaroidCount; i++) {
        // Chaos
        const r = Math.cbrt(Math.random()) * CONFIG.chaosRadius * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const chaosPos = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );

        // Target: Spiral around tree
        const tPos = i / CONFIG.polaroidCount;
        const y = -CONFIG.treeHeight/2 + tPos * CONFIG.treeHeight;
        const radius = ((1 - tPos) * CONFIG.treeRadius) + 1.5; // Slightly outside
        const angle = tPos * Math.PI * 10; // Spiral
        const targetPos = new THREE.Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
        );

        data.push({
            chaosPos,
            targetPos,
            rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
            randomRot: Math.random() * Math.PI
        });
    }
    return data;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = progress; // Linear or eased
    const time = clock.getElapsedTime();

    // Smoother ease
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    instances.forEach((data, i) => {
        tempVec3.lerpVectors(data.chaosPos, data.targetPos, ease);
        dummy.position.copy(tempVec3);

        // Chaos rotation vs Order rotation (face outwards)
        const targetRotY = Math.atan2(dummy.position.x, dummy.position.z);
        
        // Manual rotation interpolation
        dummy.rotation.set(0,0,0);
        dummy.rotateOnAxis(data.rotationAxis, data.randomRot + time * 0.2); // Chaos spin
        
        const qChaos = dummy.quaternion.clone();
        dummy.rotation.set(0, targetRotY, 0); // Face out
        const qTarget = dummy.quaternion.clone();

        dummy.quaternion.slerpQuaternions(qChaos, qTarget, ease);
        
        dummy.scale.setScalar(0.8);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
        <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.polaroidCount]}>
            <boxGeometry args={[1.2, 1.5, 0.05]} /> {/* Polaroid shape */}
            <meshStandardMaterial color="#fff" roughness={0.2} metalness={0.1} />
        </instancedMesh>
        {/* Note: Real photo textures would require loading textures in the loop. 
            For this level, we use white frames to represent the polaroids aesthetic. */}
    </group>
  );
};
