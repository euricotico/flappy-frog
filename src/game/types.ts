export type GameState =
  | 'TITLE_MENU'
  | 'STAGE_SELECT'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER';

export type GameMode = 'CAMPAIGN' | 'ENDLESS';

export interface FrogState {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  kickTimer: number;
  squashX: number;
  squashY: number;
  blinkTimer: number;
  isBlinking: boolean;
  isDead: boolean;
}

export interface PipeObstacle {
  id: number;
  x: number;
  gapY: number;
  baseGapY: number;
  gapHeight: number;
  moveAmp: number;
  moveSpeed: number;
  movePhase: number;
  passed: boolean;
  leafSeed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface FloatingScore {
  x: number;
  y: number;
  vy: number;
  alpha: number;
  text: string;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
}

export interface Firefly {
  x: number;
  y: number;
  phase: number;
  speedX: number;
  radius: number;
}

export interface Raindrop {
  x: number;
  y: number;
  length: number;
  speedY: number;
}

export interface WindLeaf {
  x: number;
  y: number;
  speedX: number;
  phase: number;
  size: number;
  color: string;
}

export interface GameWorld {
  state: GameState;
  mode: GameMode;
  levelId: number;
  width: number;
  height: number;
  time: number;
  score: number;
  targetScore: number | null; // null in ENDLESS mode, targetPipes in CAMPAIGN mode
  spawnedPipesInStage: number;
  finishGateX: number | null;
  bestScore: number;
  isNewRecord: boolean;
  groundOffset: number;
  hillOffset: number;
  reedOffset: number;
  frog: FrogState;
  pipes: PipeObstacle[];
  particles: Particle[];
  floatingScores: FloatingScore[];
  clouds: Cloud[];
  fireflies: Firefly[];
  raindrops: Raindrop[];
  windLeaves: WindLeaf[];
  nextPipeId: number;
  shakeTimer: number;
  flashAlpha: number;
  lightningAlpha: number;
  lightningCooldown: number;
  gameOverTimestamp: number;
}

export interface MedalInfo {
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  label: string;
  primaryColor: string;
  secondaryColor: string;
  rimColor: string;
}

export const WORLD_HEIGHT = 640;
export const GROUND_HEIGHT = 92;
export const PLAYABLE_HEIGHT = WORLD_HEIGHT - GROUND_HEIGHT;

export const GRAVITY = 1480;
export const JUMP_VELOCITY = -455;
export const MAX_FALL_SPEED = 620;

export const FROG_RADIUS = 17;
export const PIPE_WIDTH = 70;
export const PIPE_CAP_HEIGHT = 28;
export const PIPE_CAP_OVERHANG = 6;
export const BASE_PIPE_SPEED = 188;
export const MAX_PIPE_SPEED = 262;
export const BASE_PIPE_GAP = 152;
export const MIN_PIPE_GAP = 122;
export const PIPE_SPACING = 248;

export const RESTART_COOLDOWN_MS = 420;

export function getMedalForScore(score: number): MedalInfo {
  if (score >= 40) {
    return {
      tier: 'platinum',
      label: 'Medalha de Platina',
      primaryColor: '#E0F2FE',
      secondaryColor: '#7DD3FC',
      rimColor: '#0284C7',
    };
  }
  if (score >= 25) {
    return {
      tier: 'gold',
      label: 'Medalha de Ouro',
      primaryColor: '#FDE047',
      secondaryColor: '#F59E0B',
      rimColor: '#B45309',
    };
  }
  if (score >= 12) {
    return {
      tier: 'silver',
      label: 'Medalha de Prata',
      primaryColor: '#F1F5F9',
      secondaryColor: '#CBD5E1',
      rimColor: '#64748B',
    };
  }
  if (score >= 5) {
    return {
      tier: 'bronze',
      label: 'Medalha de Bronze',
      primaryColor: '#FDBA74',
      secondaryColor: '#EA580C',
      rimColor: '#9A3412',
    };
  }
  return {
    tier: 'none',
    label: '',
    primaryColor: '',
    secondaryColor: '',
    rimColor: '',
  };
}
