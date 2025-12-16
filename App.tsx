import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { AppState, HandGestureData } from './types';
import { analyzeFrame } from './services/geminiService';
import { Foliage } from './components/Foliage';
import { Ornaments } from './components/Ornaments';
import { Polaroids } from './components/Polaroids';
import { CameraController } from './components/CameraController';
import { Overlay } from './components/Overlay';
import { CONFIG, AI_CONFIG } from './constants';

const SceneContent: React.FC<{ appState: AppState, handData: HandGestureData }> = ({ appState, handData }) => {
  const progressRef = useRef(0);
  
  // Smoothly interpolate progress based on state
  // Chaos = 0, Formed = 1
  useFrame((state, delta) => {
    const target = appState === AppState.CHAOS ? 0 : 1;
    // Slower transition for dramatic effect
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 0.8);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, CONFIG.cameraY, CONFIG.cameraZ]} fov={45} />
      <CameraController targetX={handData.x} targetY={handData.y} />
      
      {/* Lights */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} color="#fff" castShadow />
      
      {/* Environment */}
      <Environment preset="lobby" />

      {/* Objects */}
      <group position={[0, -2, 0]}>
        <Foliage progress={progressRef.current} />
        <Ornaments progress={progressRef.current} />
        <Polaroids progress={progressRef.current} />
      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [appState, setAppState] = useState<AppState>(AppState.FORMED);
  const [handData, setHandData] = useState<HandGestureData>({ isOpen: false, x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Setup Webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Webcam access denied", err);
      }
    };
    startWebcam();
  }, []);

  // AI Loop
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;
      
      setIsProcessing(true);
      const data = await analyzeFrame(videoRef.current);
      setIsProcessing(false);

      setHandData(prev => ({
        isOpen: data.isOpen,
        // Smooth out the coordinates slightly in the state update if needed, 
        // but CameraController handles lerping.
        x: data.x,
        y: data.y
      }));

      // State Logic
      if (data.isOpen) {
        setAppState(AppState.CHAOS);
      } else {
        setAppState(AppState.FORMED);
      }

    }, AI_CONFIG.inferenceIntervalMs);

    return () => clearInterval(interval);
  }, []);

  const handleManualToggle = () => {
    setAppState(prev => prev === AppState.FORMED ? AppState.CHAOS : AppState.FORMED);
  };

  return (
    <div className="w-full h-screen bg-neutral-900 relative overflow-hidden">
      {/* Hidden Video for AI */}
      <video ref={videoRef} className="hidden" muted playsInline />
      
      <Overlay 
        appState={appState} 
        handData={handData} 
        onManualToggle={handleManualToggle}
        isProcessing={isProcessing}
      />

      <Canvas 
        shadows
        dpr={[1, 2]}
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <SceneContent appState={appState} handData={handData} />
      </Canvas>
    </div>
  );
}
