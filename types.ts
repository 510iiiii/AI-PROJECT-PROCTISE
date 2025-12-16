import { Vector3, Color } from 'three';

export enum AppState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface HandGestureData {
  isOpen: boolean;
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
}

export interface OrnamentData {
  chaosPos: Vector3;
  targetPos: Vector3;
  rotation: Vector3;
  scale: number;
  color: Color;
  speed: number; // Individual lerp speed variance
}

export interface ParticleData {
  chaosPos: Float32Array;
  targetPos: Float32Array;
  colors: Float32Array;
}
