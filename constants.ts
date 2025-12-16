import { Color } from 'three';

export const THEME = {
  emerald: new Color('#046307'),
  darkEmerald: new Color('#013203'),
  gold: new Color('#FFD700'),
  champagne: new Color('#F7E7CE'),
  red: new Color('#8B0000'),
};

export const CONFIG = {
  foliageCount: 15000,
  ornamentCount: 150,
  polaroidCount: 20,
  treeHeight: 18,
  treeRadius: 7,
  chaosRadius: 25,
  cameraZ: 22,
  cameraY: 2,
};

export const AI_CONFIG = {
  model: 'gemini-2.5-flash',
  inferenceIntervalMs: 800, // Balance between latency and rate limits
};
