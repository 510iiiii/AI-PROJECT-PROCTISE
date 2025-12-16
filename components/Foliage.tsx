import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, THEME } from '../constants';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0 = Chaos, 1 = Formed
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute vec3 aColor;
  varying vec3 vColor;

  // Cubic Ease In Out
  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    vColor = aColor;
    
    float t = ease(uProgress);
    
    // Add some noise based on index/position for organic movement
    vec3 pos = mix(aChaosPos, aTargetPos, t);
    
    // Breathing effect when formed
    if (uProgress > 0.95) {
      pos.x += sin(uTime * 2.0 + pos.y) * 0.05;
      pos.z += cos(uTime * 1.5 + pos.y) * 0.05;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (4.0 * (1.0 + (1.0-t)*2.0)) * (20.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    // Circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft edge
    float glow = 1.0 - smoothstep(0.3, 0.5, r);
    gl_FragColor = vec4(vColor, glow);
  }
`;

interface FoliageProps {
  progress: number;
}

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, chaosPositions, colors } = useMemo(() => {
    const count = CONFIG.foliageCount;
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    
    const colorChoices = [THEME.emerald, THEME.darkEmerald, THEME.gold];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 1. Chaos Position: Random Sphere
      const r = Math.cbrt(Math.random()) * CONFIG.chaosRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      chaos[i3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaos[i3 + 2] = r * Math.cos(phi);

      // 2. Target Position: Cone Tree
      // Height from -H/2 to H/2
      const y = (Math.random() * CONFIG.treeHeight) - (CONFIG.treeHeight / 2);
      // Normalized height (0 at bottom, 1 at top) to calculate radius
      const hNorm = (y + CONFIG.treeHeight / 2) / CONFIG.treeHeight;
      const radiusAtY = (1.0 - hNorm) * CONFIG.treeRadius;
      const angle = Math.random() * Math.PI * 2;
      const rDist = Math.sqrt(Math.random()) * radiusAtY; // Uniform distribution in disc
      
      pos[i3] = rDist * Math.cos(angle);
      pos[i3 + 1] = y;
      pos[i3 + 2] = rDist * Math.sin(angle);

      // 3. Colors
      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      cols[i3] = c.r;
      cols[i3 + 1] = c.g;
      cols[i3 + 2] = c.b;
    }

    return { positions: pos, chaosPositions: chaos, colors: cols };
  }, []);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
      // Smooth interpolation handled by parent, passed as prop
      shaderRef.current.uniforms.uProgress.value = progress;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Used for initial bounding box, shader overrides
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
