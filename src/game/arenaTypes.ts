export type GameScreenState =
  | 'CHARACTER_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER';

export type EnemyArchetype = 'larva' | 'stinger' | 'brute' | 'boss';

export interface PlayerEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facing: 1 | -1;
  aimAngle: number;
  hp: number;
  maxHp: number;
  shield: number;
  ultCharge: number; // 0..100
  attackCd: number;
  skillCd: number;
  invulnTimer: number;
  hurtTimer: number;
  rapidFireTimer: number; // for cymoth living_canopy
  animRow: number; // 0 idle, 1 run, 2 attack, 3 ult, 4 hit_ko
  animTimer: number;
  animLockTimer: number;
  animFps: number;
}

export interface EnemyEntity {
  id: number;
  archetype: EnemyArchetype;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  facing: 1 | -1;
  attackCd: number;
  stunTimer: number;
  slowTimer: number;
  hurtFlash: number;
  phaseTimer: number;
  telegraphTimer: number;
  telegraphX: number;
  telegraphY: number;
  telegraphRadius: number;
  scoreValue: number;
}

export interface ProjectileEntity {
  id: number;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  piercing?: boolean;
  homing?: boolean;
  slowSec?: number;
  stunSec?: number;
  hitIds: Set<number>;
}

export interface SlashArcEffect {
  x: number;
  y: number;
  angle: number;
  radius: number;
  arcSpread: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface BeamEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface HazardZone {
  id: number;
  kind:
    | 'vortex'
    | 'cyclone'
    | 'trap'
    | 'frost_pillar'
    | 'shockwave'
    | 'sonic_ring';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  damagePerTick: number;
  tickTimer: number;
  life: number;
  maxLife: number;
  color: string;
  stunSec?: number;
  slowSec?: number;
  triggered?: boolean;
  hitIds?: Set<number>;
}

export interface AllyDrone {
  id: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
  attackCd: number;
  life: number;
  facing: 1 | -1;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale?: number;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  shield: number;
  ultCharge: number;
  skillCd: number;
  skillMaxCd: number;
  wave: number;
  maxWaves: number;
  kills: number;
  score: number;
  enemiesRemaining: number;
  waveBannerTimer: number;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossName: string | null;
}

export const ARENA_WIDTH = 1080;
export const ARENA_HEIGHT = 580;
