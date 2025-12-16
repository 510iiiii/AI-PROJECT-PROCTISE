import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, THEME } from '../constants';

interface OrnamentsProps {
  progress: number;
}

const dummy = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

export const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Data for each instance
  const instances = useMemo(() => {
    const data = [];
    for (let i = 0; i < CONFIG.ornamentCount; i++) {
      // Chaos Pos
      const r = Math.cbrt(Math.random()) * CONFIG.chaosRadius * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const chaosPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      // Target Pos (On surface of cone mostly)
      const y = (Math.random() * CONFIG.treeHeight) - (CONFIG.treeHeight / 2);
      const hNorm = (y + CONFIG.treeHeight / 2) / CONFIG.treeHeight;
      const radiusAtY = (1.0 - hNorm) * CONFIG.treeRadius;
      const angle = Math.random() * Math.PI * 2;
      // Bias towards outer edge for ornaments
      const rDist = radiusAtY * (0.8 + Math.random() * 0.2); 
      const targetPos = new THREE.Vector3(
        rDist * Math.cos(angle),
        y,
        rDist * Math.sin(angle)
      );

      // Randomize color type
      const isGold = Math.random() > 0.5;
      const color = isGold ? THEME.gold : THEME.red;
      
      data.push({
        chaosPos,
        targetPos,
        color,
        scale: 0.2 + Math.random() * 0.3,
        rotationSpeed: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      instances.forEach((data, i) => {
        meshRef.current?.setColorAt(i, data.color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [instances]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();

    // Ease function
    const t = progress < 0.5 ? 4.0 * progress * progress * progress : 1.0 - Math.pow(-2.0 * progress + 2.0, 3.0) / 2.0;

    instances.forEach((data, i) => {
      // Interpolate position
      tempVec3.lerpVectors(data.chaosPos, data.targetPos, t);
      
      // Add subtle float
      const floatY = Math.sin(time + data.phase) * 0.1;
      
      dummy.position.copy(tempVec3);
      dummy.position.y += floatY;
      
      // Rotate
      dummy.rotation.x = time * data.rotationSpeed;
      dummy.rotation.y = time * data.rotationSpeed;
      dummy.scale.setScalar(data.scale * (0.5 + 0.5 * t)); // Grow as they form

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.ornamentCount]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        metalness={0.9}
        roughness={0.1}
        emissive={THEME.champagne}
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};
