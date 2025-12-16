import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

interface CameraControllerProps {
  targetX: number; // -1 to 1
  targetY: number; // -1 to 1
}

export const CameraController: React.FC<CameraControllerProps> = ({ targetX, targetY }) => {
  const currentPos = useRef(new THREE.Vector2(0, 0));
  
  useFrame(({ camera }) => {
    // Smooth lerp towards target
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, targetX, 0.05);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, targetY, 0.05);

    // Calculate camera position on a slight arc
    const camX = currentPos.current.x * 10;
    const camY = CONFIG.cameraY + (currentPos.current.y * 5);
    const camZ = CONFIG.cameraZ - (Math.abs(currentPos.current.x) * 2); // Pull in slightly at sides

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.05);
    camera.lookAt(0, 2, 0);
  });

  return null;
};
