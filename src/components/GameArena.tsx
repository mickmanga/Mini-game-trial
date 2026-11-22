import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {InsectChampion} from '../data/champions';
import {
  ProcessedSpriteSheet,
  processChampionSpriteSheet,
} from '../sprites/sheetProcessor';
import {
  ChampionCombatKit,
  getChampionCombatKit,
} from '../game/championConfigs';
import {
  AllyDrone,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BeamEffect,
  EnemyArchetype,
  EnemyEntity,
  FloatingText,
  GameScreenState,
  HazardZone,
  HudSnapshot,
  Particle,
  PlayerEntity,
  ProjectileEntity,
  SlashArcEffect,
} from '../game/arenaTypes';
import {
  drawAllyDrone,
  drawArenaBackdrop,
  drawBeamEffect,
  drawEnemy,
  drawFloatingTexts,
  drawHazardZone,
  drawParticles,
  drawPlayer,
  drawProjectile,
  drawSlashArc,
} from '../game/arenaRenderer';
import {soundFx} from '../game/soundFx';
import {ChampionSpriteThumb} from './ChampionSpriteThumb';

interface GameArenaProps {
  champions: InsectChampion[];
  selectedChampion: InsectChampion;
  onSelectChampion: (champion: InsectChampion) => void;
}

const MAX_WAVES = 5;

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

interface ArenaWorld {
  timeSec: number;
  wave: number;
  waveBannerTimer: number;
  waveClearDelay: number;
  kills: number;
  score: number;
  nextId: number;
  shakeTimer: number;
  shakePower: number;
  player: PlayerEntity;
  enemies: EnemyEntity[];
  projectiles: ProjectileEntity[];
  slashes: SlashArcEffect[];
  beams: BeamEffect[];
  hazards: HazardZone[];
  drones: AllyDrone[];
  particles: Particle[];
  texts: FloatingText[];
}

export function GameArena({
  champions,
  selectedChampion,
  onSelectChampion,
}: GameArenaProps) {
  const [screenState, setScreenState] =
    useState<GameScreenState>('CHARACTER_SELECT');
  const [muted, setMuted] = useState(soundFx.isMuted());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteSheetRef = useRef<ProcessedSpriteSheet | null>(null);
  const worldRef = useRef<ArenaWorld | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef<{x: number; y: number; active: boolean; down: boolean}>({
    x: ARENA_WIDTH * 0.7,
    y: ARENA_HEIGHT * 0.5,
    active: false,
    down: false,
  });
  const screenStateRef = useRef<GameScreenState>(screenState);
  screenStateRef.current = screenState;

  const kit = getChampionCombatKit(selectedChampion.id);
  const kitRef = useRef<ChampionCombatKit>(kit);
  kitRef.current = kit;

  const championRef = useRef<InsectChampion>(selectedChampion);
  championRef.current = selectedChampion;

  const [hud, setHud] = useState<HudSnapshot>({
    hp: kit.maxHp,
    maxHp: kit.maxHp,
    shield: 0,
    ultCharge: 50,
    skillCd: 0,
    skillMaxCd: kit.skillCooldown,
    wave: 1,
    maxWaves: MAX_WAVES,
    kills: 0,
    score: 0,
    enemiesRemaining: 0,
    waveBannerTimer: 0,
    bossHp: null,
    bossMaxHp: null,
    bossName: null,
  });

  // Preload active champion's processed 12x5 cel-shaded sprite sheet
  useEffect(() => {
    let cancelled = false;
    processChampionSpriteSheet(selectedChampion, 128, 234)
      .then((sheet) => {
        if (!cancelled) {
          spriteSheetRef.current = sheet;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedChampion]);

  const spawnWaveEnemies = useCallback((world: ArenaWorld, waveNum: number) => {
    const pickEdgePos = (): {x: number; y: number} => {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) return {x: 40 + Math.random() * (ARENA_WIDTH - 80), y: 28};
      if (side === 1)
        return {x: 40 + Math.random() * (ARENA_WIDTH - 80), y: ARENA_HEIGHT - 28};
      if (side === 2) return {x: 28, y: 40 + Math.random() * (ARENA_HEIGHT - 80)};
      return {x: ARENA_WIDTH - 28, y: 40 + Math.random() * (ARENA_HEIGHT - 80)};
    };

    const addEnemy = (archetype: EnemyArchetype) => {
      const pos =
        archetype === 'boss'
          ? {x: ARENA_WIDTH - 110, y: ARENA_HEIGHT / 2}
          : pickEdgePos();

      const scaleHp = 1 + (waveNum - 1) * 0.14;
      const spec =
        archetype === 'larva'
          ? {name: 'Larve du Néant', hp: 78, speed: 128, damage: 14, radius: 17, score: 60}
          : archetype === 'stinger'
            ? {name: 'Guêpe Aiguillon', hp: 105, speed: 105, damage: 18, radius: 19, score: 110}
            : archetype === 'brute'
              ? {name: 'Scarabée Cuirassé', hp: 235, speed: 82, damage: 26, radius: 26, score: 190}
              : {
                  name: "Reine Chitineuse Kai'Zora",
                  hp: 1150,
                  speed: 96,
                  damage: 34,
                  radius: 40,
                  score: 1200,
                };

      const maxHp = Math.round(spec.hp * (archetype === 'boss' ? 1 : scaleHp));
      world.enemies.push({
        id: world.nextId++,
        archetype,
        name: spec.name,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        radius: spec.radius,
        hp: maxHp,
        maxHp,
        speed: spec.speed,
        damage: spec.damage,
        facing: pos.x > world.player.x ? -1 : 1,
        attackCd: 0.9 + Math.random() * 0.7,
        stunTimer: 0,
        slowTimer: 0,
        hurtFlash: 0,
        phaseTimer: 0,
        telegraphTimer: 0,
        telegraphX: pos.x,
        telegraphY: pos.y,
        telegraphRadius: 72,
        scoreValue: spec.score,
      });
    };

    if (waveNum === 1) {
      for (let i = 0; i < 5; i++) addEnemy('larva');
      addEnemy('stinger');
    } else if (waveNum === 2) {
      for (let i = 0; i < 6; i++) addEnemy('larva');
      for (let i = 0; i < 3; i++) addEnemy('stinger');
      addEnemy('brute');
    } else if (waveNum === 3) {
      for (let i = 0; i < 7; i++) addEnemy('larva');
      for (let i = 0; i < 4; i++) addEnemy('stinger');
      for (let i = 0; i < 2; i++) addEnemy('brute');
    } else if (waveNum === 4) {
      for (let i = 0; i < 8; i++) addEnemy('larva');
      for (let i = 0; i < 5; i++) addEnemy('stinger');
      for (let i = 0; i < 3; i++) addEnemy('brute');
    } else {
      addEnemy('boss');
      for (let i = 0; i < 5; i++) addEnemy('larva');
      for (let i = 0; i < 3; i++) addEnemy('stinger');
      addEnemy('brute');
    }

    world.waveBannerTimer = 2.1;
  }, []);

  const createFreshWorld = useCallback(
    (combatKit: ChampionCombatKit): ArenaWorld => {
      const world: ArenaWorld = {
        timeSec: 0,
        wave: 1,
        waveBannerTimer: 2.1,
        waveClearDelay: 0,
        kills: 0,
        score: 0,
        nextId: 1,
        shakeTimer: 0,
        shakePower: 0,
        player: {
          x: ARENA_WIDTH * 0.35,
          y: ARENA_HEIGHT * 0.5,
          vx: 0,
          vy: 0,
          radius: 22,
          facing: 1,
          aimAngle: 0,
          hp: combatKit.maxHp,
          maxHp: combatKit.maxHp,
          shield: 0,
          ultCharge: 55,
          attackCd: 0,
          skillCd: 0,
          invulnTimer: 0,
          hurtTimer: 0,
          rapidFireTimer: 0,
          animRow: 0,
          animTimer: 0,
          animLockTimer: 0,
          animFps: 10,
        },
        enemies: [],
        projectiles: [],
        slashes: [],
        beams: [],
        hazards: [],
        drones: [],
        particles: [],
        texts: [],
      };
      spawnWaveEnemies(world, 1);
      return world;
    },
    [spawnWaveEnemies],
  );

  const startGame = useCallback(
    (champ?: InsectChampion) => {
      const targetChamp = champ ?? championRef.current;
      if (champ) onSelectChampion(champ);
      const targetKit = getChampionCombatKit(targetChamp.id);
      const fresh = createFreshWorld(targetKit);
      worldRef.current = fresh;
      setHud({
        hp: fresh.player.hp,
        maxHp: fresh.player.maxHp,
        shield: 0,
        ultCharge: fresh.player.ultCharge,
        skillCd: 0,
        skillMaxCd: targetKit.skillCooldown,
        wave: 1,
        maxWaves: MAX_WAVES,
        kills: 0,
        score: 0,
        enemiesRemaining: fresh.enemies.length,
        waveBannerTimer: fresh.waveBannerTimer,
        bossHp: null,
        bossMaxHp: null,
        bossName: null,
      });
      setScreenState('PLAYING');
    },
    [createFreshWorld, onSelectChampion],
  );

  // Helper functions inside simulation
  const spawnParticles = (
    world: ArenaWorld,
    x: number,
    y: number,
    color: string,
    count: number,
    speedMax = 150,
  ) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * speedMax;
      const life = 0.25 + Math.random() * 0.35;
      world.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 3 + Math.random() * 4,
        color,
        life,
        maxLife: life,
      });
    }
  };

  const addFloatingText = (
    world: ArenaWorld,
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1,
  ) => {
    world.texts.push({
      x,
      y,
      vy: -36,
      text,
      color,
      life: 0.72,
      maxLife: 0.72,
      scale,
    });
  };

  const damageEnemy = (
    world: ArenaWorld,
    enemy: EnemyEntity,
    amount: number,
    accentHex: string,
    options?: {
      ultGain?: number;
      stunSec?: number;
      slowSec?: number;
      knockbackX?: number;
      knockbackY?: number;
      isCrit?: boolean;
    },
  ) => {
    if (enemy.hp <= 0) return;
    const dmg = Math.max(1, Math.round(amount));
    enemy.hp -= dmg;
    enemy.hurtFlash = 0.12;
    if (options?.stunSec) {
      enemy.stunTimer = Math.max(enemy.stunTimer, options.stunSec);
      enemy.telegraphTimer = 0;
    }
    if (options?.slowSec) {
      enemy.slowTimer = Math.max(enemy.slowTimer, options.slowSec);
    }
    if (options?.knockbackX || options?.knockbackY) {
      const resist = enemy.archetype === 'boss' ? 0.2 : 1;
      enemy.x = clamp(enemy.x + (options.knockbackX ?? 0) * resist, 26, ARENA_WIDTH - 26);
      enemy.y = clamp(enemy.y + (options.knockbackY ?? 0) * resist, 26, ARENA_HEIGHT - 26);
    }

    const gain = options?.ultGain ?? 12;
    if (gain > 0) {
      world.player.ultCharge = Math.min(100, world.player.ultCharge + gain);
    }

    addFloatingText(
      world,
      enemy.x + (Math.random() - 0.5) * 14,
      enemy.y - enemy.radius - 6,
      options?.isCrit ? `${dmg}!` : `${dmg}`,
      options?.isCrit ? '#FACC15' : '#F3F1EC',
      options?.isCrit ? 1.25 : 1,
    );
    spawnParticles(world, enemy.x, enemy.y, accentHex, 5, 110);

    if (enemy.hp <= 0) {
      world.kills += 1;
      world.score += enemy.scoreValue;
      world.player.ultCharge = Math.min(100, world.player.ultCharge + 10);
      spawnParticles(world, enemy.x, enemy.y, '#D9A441', 14, 180);
      soundFx.playHit(true);
    } else {
      soundFx.playHit(false);
    }
  };

  const resolveAimAngle = (world: ArenaWorld): number => {
    const p = world.player;
    if (pointerRef.current.active) {
      return Math.atan2(pointerRef.current.y - p.y, pointerRef.current.x - p.x);
    }
    // Auto-aim nearest enemy if mouse isn't inside canvas
    let nearest: EnemyEntity | null = null;
    let bestD = Infinity;
    for (const e of world.enemies) {
      if (e.hp <= 0) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < bestD) {
        bestD = d;
        nearest = e;
      }
    }
    if (nearest) {
      return Math.atan2(nearest.y - p.y, nearest.x - p.x);
    }
    return p.aimAngle;
  };

  const triggerBasicAttack = useCallback(() => {
    const world = worldRef.current;
    if (!world || screenStateRef.current !== 'PLAYING') return;
    const p = world.player;
    if (p.attackCd > 0) return;

    const currentKit = kitRef.current;
    const accent = championRef.current.accentHex;
    const angle = resolveAimAngle(world);
    p.aimAngle = angle;
    p.facing = Math.cos(angle) >= 0 ? 1 : -1;

    const cdMultiplier = p.rapidFireTimer > 0 ? 0.5 : 1;
    p.attackCd = currentKit.attackCooldown * cdMultiplier;
    p.animRow = 2;
    p.animTimer = 0;
    p.animLockTimer = 0.24;
    p.animFps = 20;

    soundFx.playAttack(currentKit.combatStyle);

    if (currentKit.combatStyle === 'melee') {
      world.slashes.push({
        x: p.x + Math.cos(angle) * 18,
        y: p.y - 16 + Math.sin(angle) * 18,
        angle,
        radius: currentKit.attackRange,
        arcSpread: Math.PI * 0.85,
        color: accent,
        life: 0.18,
        maxLife: 0.18,
      });

      for (const enemy of world.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist(p.x, p.y, enemy.x, enemy.y);
        if (d <= currentKit.attackRange + enemy.radius) {
          const toEnemy = Math.atan2(enemy.y - p.y, enemy.x - p.x);
          let diff = Math.abs(toEnemy - angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff <= Math.PI * 0.55 || d < 42) {
            damageEnemy(world, enemy, currentKit.attackDamage, accent, {
              ultGain: 15,
              knockbackX: Math.cos(toEnemy) * 16,
              knockbackY: Math.sin(toEnemy) * 16,
            });
          }
        }
      }
    } else {
      const spd = currentKit.projectileSpeed ?? 600;
      world.projectiles.push({
        id: world.nextId++,
        owner: 'player',
        x: p.x + Math.cos(angle) * 24,
        y: p.y - 18 + Math.sin(angle) * 16,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: currentKit.piercingBasic ? 10 : 7,
        damage: currentKit.attackDamage,
        color: currentKit.projectileColor ?? accent,
        life: currentKit.attackRange / spd,
        maxLife: currentKit.attackRange / spd,
        piercing: currentKit.piercingBasic,
        hitIds: new Set(),
      });
    }
  }, []);

  const triggerSkill = useCallback(() => {
    const world = worldRef.current;
    if (!world || screenStateRef.current !== 'PLAYING') return;
    const p = world.player;
    if (p.skillCd > 0) return;

    const currentKit = kitRef.current;
    const accent = championRef.current.accentHex;
    const angle = resolveAimAngle(world);
    p.aimAngle = angle;
    p.facing = Math.cos(angle) >= 0 ? 1 : -1;
    p.skillCd = currentKit.skillCooldown;
    p.animRow = 2;
    p.animTimer = 0;
    p.animLockTimer = 0.34;
    p.animFps = 18;

    soundFx.playSkill();

    const mech = currentKit.skillMechanic;
    if (mech === 'shadow_dash' || mech === 'catapult_leap' || mech === 'aqua_dash') {
      const dashDist = mech === 'catapult_leap' ? 195 : 175;
      const startX = p.x;
      const startY = p.y;
      p.x = clamp(p.x + Math.cos(angle) * dashDist, 32, ARENA_WIDTH - 32);
      p.y = clamp(p.y + Math.sin(angle) * dashDist, 42, ARENA_HEIGHT - 24);
      p.invulnTimer = 0.28;

      world.beams.push({
        x1: startX,
        y1: startY - 18,
        x2: p.x,
        y2: p.y - 18,
        width: 24,
        color: accent,
        life: 0.26,
        maxLife: 0.26,
      });

      for (const enemy of world.enemies) {
        if (enemy.hp <= 0) continue;
        const hitLine = pointToSegmentDist(enemy.x, enemy.y, startX, startY, p.x, p.y);
        const hitLanding = dist(enemy.x, enemy.y, p.x, p.y) < 95;
        if (hitLine < enemy.radius + 36 || (mech === 'catapult_leap' && hitLanding)) {
          damageEnemy(world, enemy, currentKit.attackDamage * 1.65, accent, {
            ultGain: 18,
            slowSec: 1.4,
            isCrit: true,
          });
        }
      }
      if (mech === 'aqua_dash') {
        world.hazards.push({
          id: world.nextId++,
          kind: 'shockwave',
          x: startX,
          y: startY,
          vx: 0,
          vy: 0,
          radius: 20,
          maxRadius: 110,
          damagePerTick: currentKit.attackDamage * 1.1,
          tickTimer: 0,
          life: 0.32,
          maxLife: 0.32,
          color: accent,
          hitIds: new Set(),
        });
      }
    } else if (mech === 'bronze_shield') {
      p.shield = Math.min(200, p.shield + 140);
      addFloatingText(world, p.x, p.y - 54, '+140 BOUCLIER', '#6EC8B5', 1.1);
      world.hazards.push({
        id: world.nextId++,
        kind: 'shockwave',
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        radius: 25,
        maxRadius: 145,
        damagePerTick: currentKit.attackDamage * 1.1,
        tickTimer: 0,
        life: 0.35,
        maxLife: 0.35,
        color: accent,
        stunSec: 0.8,
        hitIds: new Set(),
      });
    } else if (mech === 'spore_heal') {
      const heal = 85;
      p.hp = Math.min(p.maxHp, p.hp + heal);
      addFloatingText(world, p.x, p.y - 54, `+${heal} PV`, '#6EC8B5', 1.15);
      world.hazards.push({
        id: world.nextId++,
        kind: 'shockwave',
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        radius: 24,
        maxRadius: 165,
        damagePerTick: currentKit.attackDamage * 1.4,
        tickTimer: 0,
        life: 0.4,
        maxLife: 0.4,
        color: '#6EC8B5',
        stunSec: 1.25,
        hitIds: new Set(),
      });
    } else if (mech === 'venom_evade') {
      // Dash backward slightly & fire 3 slowing darts
      p.x = clamp(p.x - Math.cos(angle) * 115, 32, ARENA_WIDTH - 32);
      p.y = clamp(p.y - Math.sin(angle) * 115, 42, ARENA_HEIGHT - 24);
      p.invulnTimer = 0.24;
      for (const spread of [-0.22, 0, 0.22]) {
        const a = angle + spread;
        world.projectiles.push({
          id: world.nextId++,
          owner: 'player',
          x: p.x + Math.cos(a) * 20,
          y: p.y - 16 + Math.sin(a) * 14,
          vx: Math.cos(a) * 690,
          vy: Math.sin(a) * 690,
          radius: 8,
          damage: Math.round(currentKit.attackDamage * 1.15),
          color: '#7AE582',
          life: 0.72,
          maxLife: 0.72,
          slowSec: 2.0,
          hitIds: new Set(),
        });
      }
    } else if (mech === 'ash_vortex') {
      const tx = clamp(p.x + Math.cos(angle) * 210, 75, ARENA_WIDTH - 75);
      const ty = clamp(p.y + Math.sin(angle) * 210, 75, ARENA_HEIGHT - 75);
      world.hazards.push({
        id: world.nextId++,
        kind: 'vortex',
        x: tx,
        y: ty,
        vx: 0,
        vy: 0,
        radius: 105,
        maxRadius: 105,
        damagePerTick: 24,
        tickTimer: 0.05,
        life: 3.2,
        maxLife: 3.2,
        color: accent,
      });
    } else if (mech === 'banner_stun') {
      const cx = p.x + Math.cos(angle) * 72;
      const cy = p.y + Math.sin(angle) * 72;
      world.hazards.push({
        id: world.nextId++,
        kind: 'shockwave',
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: 22,
        maxRadius: 135,
        damagePerTick: currentKit.attackDamage * 1.5,
        tickTimer: 0,
        life: 0.35,
        maxLife: 0.35,
        color: accent,
        stunSec: 1.65,
        hitIds: new Set(),
      });
    } else if (mech === 'vine_trap') {
      const tx = clamp(p.x + Math.cos(angle) * 165, 55, ARENA_WIDTH - 55);
      const ty = clamp(p.y + Math.sin(angle) * 165, 55, ARENA_HEIGHT - 55);
      world.hazards.push({
        id: world.nextId++,
        kind: 'trap',
        x: tx,
        y: ty,
        vx: 0,
        vy: 0,
        radius: 62,
        maxRadius: 62,
        damagePerTick: currentKit.attackDamage * 1.9,
        tickTimer: 0,
        life: 7.5,
        maxLife: 7.5,
        color: accent,
        stunSec: 1.8,
        triggered: false,
      });
    } else if (mech === 'frost_pillar') {
      const tx = clamp(p.x + Math.cos(angle) * 185, 65, ARENA_WIDTH - 65);
      const ty = clamp(p.y + Math.sin(angle) * 185, 65, ARENA_HEIGHT - 65);
      world.hazards.push({
        id: world.nextId++,
        kind: 'frost_pillar',
        x: tx,
        y: ty,
        vx: 0,
        vy: 0,
        radius: 100,
        maxRadius: 100,
        damagePerTick: 34,
        tickTimer: 0.05,
        life: 3.0,
        maxLife: 3.0,
        color: accent,
        slowSec: 2.0,
      });
    }
  }, []);

  const triggerUltimate = useCallback(() => {
    const world = worldRef.current;
    if (!world || screenStateRef.current !== 'PLAYING') return;
    const p = world.player;
    if (p.ultCharge < 100) return;

    const currentKit = kitRef.current;
    const accent = championRef.current.accentHex;
    const angle = resolveAimAngle(world);
    p.aimAngle = angle;
    p.facing = Math.cos(angle) >= 0 ? 1 : -1;
    p.ultCharge = 0;
    p.invulnTimer = 0.55;
    p.animRow = 3; // ULT 12-frame animation!
    p.animTimer = 0;
    p.animLockTimer = 0.65;
    p.animFps = 18;

    world.shakeTimer = 0.32;
    world.shakePower = 7;
    soundFx.playUlt();
    addFloatingText(
      world,
      p.x,
      p.y - 68,
      currentKit.ultName.toUpperCase(),
      '#D9A441',
      1.25,
    );

    const ult = currentKit.ultMechanic;

    if (ult === 'eclipse_blades') {
      // Kael'Vex: massive dual blade storm around her
      world.slashes.push(
        {
          x: p.x,
          y: p.y - 16,
          angle: 0,
          radius: 195,
          arcSpread: Math.PI * 1.95,
          color: '#D4A853',
          life: 0.42,
          maxLife: 0.42,
        },
        {
          x: p.x,
          y: p.y - 16,
          angle: Math.PI,
          radius: 145,
          arcSpread: Math.PI * 1.85,
          color: '#FACC15',
          life: 0.35,
          maxLife: 0.35,
        },
      );
      for (const e of world.enemies) {
        if (dist(p.x, p.y, e.x, e.y) <= 210 + e.radius) {
          damageEnemy(world, e, currentKit.attackDamage * 4.2, '#D4A853', {
            ultGain: 0,
            isCrit: true,
          });
        }
      }
    } else if (ult === 'desert_anvil') {
      // Brim'Kor: leaps toward aim & releases seismic stun rings
      p.x = clamp(p.x + Math.cos(angle) * 145, 45, ARENA_WIDTH - 45);
      p.y = clamp(p.y + Math.sin(angle) * 145, 45, ARENA_HEIGHT - 45);
      world.hazards.push({
        id: world.nextId++,
        kind: 'shockwave',
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        radius: 30,
        maxRadius: 270,
        damagePerTick: 165,
        tickTimer: 0,
        life: 0.55,
        maxLife: 0.55,
        color: '#E07A3A',
        stunSec: 2.2,
        hitIds: new Set(),
      });
    } else if (ult === 'glade_aurora') {
      // Sylphéra: huge heal + 12 homing astral bolts
      p.hp = Math.min(p.maxHp, p.hp + 180);
      addFloatingText(world, p.x, p.y - 52, '+180 PV', '#6EC8B5', 1.25);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        world.projectiles.push({
          id: world.nextId++,
          owner: 'player',
          x: p.x + Math.cos(a) * 20,
          y: p.y - 18 + Math.sin(a) * 20,
          vx: Math.cos(a) * 460,
          vy: Math.sin(a) * 460,
          radius: 9,
          damage: 58,
          color: '#6EC8B5',
          life: 1.6,
          maxLife: 1.6,
          homing: true,
          stunSec: 0.85,
          hitIds: new Set(),
        });
      }
    } else if (ult === 'queen_railgun') {
      // Vespéron: giant piercing railgun beam across entire arena
      const ex = p.x + Math.cos(angle) * 1250;
      const ey = p.y - 16 + Math.sin(angle) * 1250;
      world.beams.push({
        x1: p.x,
        y1: p.y - 16,
        x2: ex,
        y2: ey,
        width: 44,
        color: '#4FA872',
        life: 0.45,
        maxLife: 0.45,
      });
      for (const e of world.enemies) {
        if (pointToSegmentDist(e.x, e.y, p.x, p.y - 16, ex, ey) <= e.radius + 32) {
          damageEnemy(world, e, 215, '#4FA872', {
            ultGain: 0,
            isCrit: true,
            knockbackX: Math.cos(angle) * 32,
            knockbackY: Math.sin(angle) * 32,
          });
        }
      }
    } else if (ult === 'monolith_storm') {
      // Nox'Thalys: 14 homing spectral moth projectiles + center vortex
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        world.projectiles.push({
          id: world.nextId++,
          owner: 'player',
          x: p.x,
          y: p.y - 16,
          vx: Math.cos(a) * 420,
          vy: Math.sin(a) * 420,
          radius: 9,
          damage: 62,
          color: '#B8A6EA',
          life: 1.8,
          maxLife: 1.8,
          homing: true,
          slowSec: 1.5,
          hitIds: new Set(),
        });
      }
    } else if (ult === 'swarm_cyclone') {
      // Kri'Zarak: moving giant sandstorm cyclone sweeping forward
      world.hazards.push({
        id: world.nextId++,
        kind: 'cyclone',
        x: p.x + Math.cos(angle) * 40,
        y: p.y + Math.sin(angle) * 40,
        vx: Math.cos(angle) * 185,
        vy: Math.sin(angle) * 185,
        radius: 125,
        maxRadius: 125,
        damagePerTick: 48,
        tickTimer: 0.05,
        life: 3.4,
        maxLife: 3.4,
        color: '#D99B4E',
        slowSec: 1.0,
      });
    } else if (ult === 'prism_barrage') {
      // Aurelia: 8 radial prismatic crystal laser beams
      const colors = ['#56D5DF', '#81E6D9', '#6CA8DC', '#C084FC'];
      for (let i = 0; i < 8; i++) {
        const a = angle + (i / 8) * Math.PI * 2;
        const ex = p.x + Math.cos(a) * 650;
        const ey = p.y - 14 + Math.sin(a) * 650;
        const c = colors[i % colors.length];
        world.beams.push({
          x1: p.x,
          y1: p.y - 14,
          x2: ex,
          y2: ey,
          width: 24,
          color: c,
          life: 0.42,
          maxLife: 0.42,
        });
        for (const e of world.enemies) {
          if (pointToSegmentDist(e.x, e.y, p.x, p.y - 14, ex, ey) <= e.radius + 20) {
            damageEnemy(world, e, 155, c, {ultGain: 0, isCrit: true});
          }
        }
      }
    } else if (ult === 'colony_surge') {
      // Myrmex: shield + summons 5 armored ant-drones fighting enemies
      p.shield = Math.min(260, p.shield + 160);
      addFloatingText(world, p.x, p.y - 54, '+5 LÉGIONNAIRES', '#C94A4A', 1.15);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        world.drones.push({
          id: world.nextId++,
          x: clamp(p.x + Math.cos(a) * 52, 24, ARENA_WIDTH - 24),
          y: clamp(p.y + Math.sin(a) * 52, 24, ARENA_HEIGHT - 24),
          radius: 13,
          damage: 30,
          attackCd: 0.15,
          life: 10.0,
          facing: 1,
          color: '#C94A4A',
        });
      }
    } else if (ult === 'living_canopy') {
      // Cymoth: fan volley of 15 piercing thorn arrows + rapid fire buff
      p.rapidFireTimer = 5.0;
      for (let i = -7; i <= 7; i++) {
        const a = angle + i * 0.14;
        world.projectiles.push({
          id: world.nextId++,
          owner: 'player',
          x: p.x + Math.cos(a) * 20,
          y: p.y - 16 + Math.sin(a) * 16,
          vx: Math.cos(a) * 760,
          vy: Math.sin(a) * 760,
          radius: 8,
          damage: 92,
          color: '#8BC36A',
          life: 0.9,
          maxLife: 0.9,
          piercing: true,
          slowSec: 1.5,
          hitIds: new Set(),
        });
      }
    } else if (ult === 'sonic_winter') {
      // Zéphyrion: giant expanding sonic shockwave across the arena
      world.hazards.push({
        id: world.nextId++,
        kind: 'sonic_ring',
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        radius: 35,
        maxRadius: 480,
        damagePerTick: 185,
        tickTimer: 0,
        life: 0.72,
        maxLife: 0.72,
        color: '#79C3FF',
        slowSec: 3.0,
        hitIds: new Set(),
      });
    }
  }, []);

  // Keyboard bindings while playing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenStateRef.current !== 'PLAYING' && screenStateRef.current !== 'PAUSED') {
        return;
      }
      const key = e.key.toLowerCase();
      if (
        [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)
      ) {
        e.preventDefault();
      }
      if (key === 'escape' || key === 'p') {
        setScreenState((prev) =>
          prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev,
        );
        return;
      }
      keysRef.current.add(key);

      if (screenStateRef.current === 'PLAYING') {
        if (key === ' ' || key === 'j') triggerBasicAttack();
        if (key === 'e' || key === 'k') triggerSkill();
        if (key === 'r' || key === 'u') triggerUltimate();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      keysRef.current.clear();
      pointerRef.current.down = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [triggerBasicAttack, triggerSkill, triggerUltimate]);

  // Main 60fps Game Loop
  useEffect(() => {
    if (screenState !== 'PLAYING' && screenState !== 'PAUSED') return;

    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const damagePlayer = (world: ArenaWorld, rawDmg: number) => {
      const p = world.player;
      if (p.invulnTimer > 0 || p.hp <= 0) return;

      let remaining = rawDmg;
      if (p.shield > 0) {
        const absorbed = Math.min(p.shield, remaining);
        p.shield -= absorbed;
        remaining -= absorbed;
      }
      if (remaining > 0) {
        p.hp = Math.max(0, p.hp - remaining);
        p.hurtTimer = 0.25;
        p.invulnTimer = 0.35;
        p.animRow = 4;
        p.animTimer = 0;
        p.animLockTimer = 0.22;
        p.animFps = 16;
        addFloatingText(world, p.x, p.y - 48, `-${remaining}`, '#F87171', 1.1);
        soundFx.playPlayerHurt();
      }
    };

    const stepSimulation = (world: ArenaWorld, dt: number) => {
      world.timeSec += dt;
      if (world.waveBannerTimer > 0) world.waveBannerTimer = Math.max(0, world.waveBannerTimer - dt);
      if (world.shakeTimer > 0) world.shakeTimer = Math.max(0, world.shakeTimer - dt);

      const p = world.player;
      const currentKit = kitRef.current;
      const accent = championRef.current.accentHex;

      // Cooldowns & passive ult trickle
      p.attackCd = Math.max(0, p.attackCd - dt);
      p.skillCd = Math.max(0, p.skillCd - dt);
      p.invulnTimer = Math.max(0, p.invulnTimer - dt);
      p.hurtTimer = Math.max(0, p.hurtTimer - dt);
      p.rapidFireTimer = Math.max(0, p.rapidFireTimer - dt);
      p.ultCharge = Math.min(100, p.ultCharge + dt * 3.5);

      // Continuous fire if holding Left Mouse or Space
      if (pointerRef.current.down || keysRef.current.has(' ') || keysRef.current.has('j')) {
        triggerBasicAttack();
      }

      // Movement (supports AZERTY ZQSD, QWERTY WASD, and Arrow keys)
      const keys = keysRef.current;
      let moveX = 0;
      let moveY = 0;
      if (keys.has('q') || keys.has('a') || keys.has('arrowleft')) moveX -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveX += 1;
      if (keys.has('z') || keys.has('w') || keys.has('arrowup')) moveY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveY += 1;

      const isMoving = moveX !== 0 || moveY !== 0;
      if (isMoving) {
        const len = Math.hypot(moveX, moveY);
        moveX /= len;
        moveY /= len;
        const speedMult = p.rapidFireTimer > 0 ? 1.2 : 1;
        p.x = clamp(p.x + moveX * currentKit.speed * speedMult * dt, 30, ARENA_WIDTH - 30);
        p.y = clamp(p.y + moveY * currentKit.speed * speedMult * dt, 48, ARENA_HEIGHT - 22);
      }

      p.aimAngle = resolveAimAngle(world);
      if (pointerRef.current.active) {
        p.facing = pointerRef.current.x >= p.x ? 1 : -1;
      } else if (moveX !== 0) {
        p.facing = moveX >= 0 ? 1 : -1;
      }

      // Sprite animation state selection
      if (p.animLockTimer > 0) {
        p.animLockTimer = Math.max(0, p.animLockTimer - dt);
        p.animTimer += dt;
      } else if (isMoving) {
        if (p.animRow !== 1) p.animTimer = 0;
        p.animRow = 1;
        p.animFps = 14;
        p.animTimer += dt;
      } else {
        if (p.animRow !== 0) p.animTimer = 0;
        p.animRow = 0;
        p.animFps = 10;
        p.animTimer += dt;
      }

      // Hazard Zones Update
      for (let i = world.hazards.length - 1; i >= 0; i--) {
        const hz = world.hazards[i];
        hz.life -= dt;
        hz.x = clamp(hz.x + hz.vx * dt, 40, ARENA_WIDTH - 40);
        hz.y = clamp(hz.y + hz.vy * dt, 40, ARENA_HEIGHT - 40);

        if (hz.kind === 'shockwave' || hz.kind === 'sonic_ring') {
          const progress = 1 - Math.max(0, hz.life / hz.maxLife);
          hz.radius = 20 + (hz.maxRadius - 20) * progress;
          for (const e of world.enemies) {
            if (e.hp <= 0 || hz.hitIds?.has(e.id)) continue;
            if (dist(hz.x, hz.y, e.x, e.y) <= hz.radius + e.radius) {
              hz.hitIds?.add(e.id);
              const ang = Math.atan2(e.y - hz.y, e.x - hz.x);
              damageEnemy(world, e, hz.damagePerTick, hz.color, {
                ultGain: hz.maxRadius > 200 ? 0 : 12,
                stunSec: hz.stunSec,
                slowSec: hz.slowSec,
                knockbackX: Math.cos(ang) * 22,
                knockbackY: Math.sin(ang) * 22,
                isCrit: hz.maxRadius > 200,
              });
            }
          }
        } else if (hz.kind === 'trap') {
          for (const e of world.enemies) {
            if (e.hp <= 0) continue;
            if (dist(hz.x, hz.y, e.x, e.y) <= hz.radius + e.radius) {
              // Trap detonates!
              for (const target of world.enemies) {
                if (dist(hz.x, hz.y, target.x, target.y) <= hz.radius + 40) {
                  damageEnemy(world, target, hz.damagePerTick, hz.color, {
                    ultGain: 16,
                    stunSec: hz.stunSec,
                    isCrit: true,
                  });
                }
              }
              spawnParticles(world, hz.x, hz.y, hz.color, 14, 160);
              hz.life = 0;
              break;
            }
          }
        } else {
          // Vortex / Cyclone / Frost Pillar tick
          hz.tickTimer -= dt;
          if (hz.kind === 'vortex') {
            for (const e of world.enemies) {
              if (e.hp <= 0) continue;
              const d = dist(hz.x, hz.y, e.x, e.y);
              if (d < hz.radius + 55 && d > 10) {
                const pull = e.archetype === 'boss' ? 25 : 85;
                e.x += ((hz.x - e.x) / d) * pull * dt;
                e.y += ((hz.y - e.y) / d) * pull * dt;
              }
            }
          }
          if (hz.tickTimer <= 0) {
            hz.tickTimer = 0.35;
            for (const e of world.enemies) {
              if (e.hp <= 0) continue;
              if (dist(hz.x, hz.y, e.x, e.y) <= hz.radius + e.radius) {
                damageEnemy(world, e, hz.damagePerTick, hz.color, {
                  ultGain: hz.kind === 'cyclone' ? 0 : 6,
                  slowSec: hz.slowSec,
                });
              }
            }
          }
        }

        if (hz.life <= 0) {
          world.hazards.splice(i, 1);
        }
      }

      // Allied Drones Update (Myrmex Ult)
      for (let i = world.drones.length - 1; i >= 0; i--) {
        const dr = world.drones[i];
        dr.life -= dt;
        dr.attackCd = Math.max(0, dr.attackCd - dt);
        let target: EnemyEntity | null = null;
        let best = Infinity;
        for (const e of world.enemies) {
          if (e.hp <= 0) continue;
          const d = dist(dr.x, dr.y, e.x, e.y);
          if (d < best) {
            best = d;
            target = e;
          }
        }
        if (target) {
          const d = dist(dr.x, dr.y, target.x, target.y);
          if (d > target.radius + 16) {
            dr.x += ((target.x - dr.x) / d) * 230 * dt;
            dr.y += ((target.y - dr.y) / d) * 230 * dt;
            dr.facing = target.x >= dr.x ? 1 : -1;
          } else if (dr.attackCd <= 0) {
            dr.attackCd = 0.45;
            damageEnemy(world, target, dr.damage, dr.color, {ultGain: 2});
          }
        }
        if (dr.life <= 0) world.drones.splice(i, 1);
      }

      // Projectiles Update
      for (let i = world.projectiles.length - 1; i >= 0; i--) {
        const pr = world.projectiles[i];
        pr.life -= dt;

        if (pr.homing && pr.owner === 'player') {
          let nearest: EnemyEntity | null = null;
          let best = 420;
          for (const e of world.enemies) {
            if (e.hp <= 0 || pr.hitIds.has(e.id)) continue;
            const d = dist(pr.x, pr.y, e.x, e.y);
            if (d < best) {
              best = d;
              nearest = e;
            }
          }
          if (nearest) {
            const desired = Math.atan2(nearest.y - pr.y, nearest.x - pr.x);
            const cur = Math.atan2(pr.vy, pr.vx);
            const spd = Math.hypot(pr.vx, pr.vy);
            let delta = desired - cur;
            while (delta > Math.PI) delta -= Math.PI * 2;
            while (delta < -Math.PI) delta += Math.PI * 2;
            const nextAngle = cur + clamp(delta, -dt * 7, dt * 7);
            pr.vx = Math.cos(nextAngle) * spd;
            pr.vy = Math.sin(nextAngle) * spd;
          }
        }

        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        if (
          pr.x < -30 ||
          pr.x > ARENA_WIDTH + 30 ||
          pr.y < -30 ||
          pr.y > ARENA_HEIGHT + 30 ||
          pr.life <= 0
        ) {
          world.projectiles.splice(i, 1);
          continue;
        }

        if (pr.owner === 'player') {
          let consumed = false;
          for (const e of world.enemies) {
            if (e.hp <= 0 || pr.hitIds.has(e.id)) continue;
            if (dist(pr.x, pr.y, e.x, e.y) <= pr.radius + e.radius) {
              pr.hitIds.add(e.id);
              damageEnemy(world, e, pr.damage, pr.color, {
                ultGain: pr.homing ? 0 : 12,
                slowSec: pr.slowSec,
                stunSec: pr.stunSec,
              });
              if (!pr.piercing) {
                consumed = true;
                break;
              }
            }
          }
          if (consumed) {
            world.projectiles.splice(i, 1);
          }
        } else {
          // Enemy projectile hits player
          if (dist(pr.x, pr.y, p.x, p.y - 16) <= pr.radius + p.radius) {
            damagePlayer(world, pr.damage);
            spawnParticles(world, pr.x, pr.y, pr.color, 6, 90);
            world.projectiles.splice(i, 1);
          }
        }
      }

      // Enemies AI & Collisions
      for (let i = world.enemies.length - 1; i >= 0; i--) {
        const e = world.enemies[i];
        if (e.hp <= 0) {
          world.enemies.splice(i, 1);
          continue;
        }
        e.hurtFlash = Math.max(0, e.hurtFlash - dt);
        e.stunTimer = Math.max(0, e.stunTimer - dt);
        e.slowTimer = Math.max(0, e.slowTimer - dt);
        e.attackCd = Math.max(0, e.attackCd - dt);

        if (e.stunTimer > 0) continue;

        const dToPlayer = dist(e.x, e.y, p.x, p.y);
        const spdMult = e.slowTimer > 0 ? 0.5 : 1;
        e.facing = p.x >= e.x ? 1 : -1;

        if (e.archetype === 'stinger') {
          // Keeps medium range and shoots venom darts
          const idealDist = 235;
          if (dToPlayer > idealDist + 25) {
            e.x += ((p.x - e.x) / dToPlayer) * e.speed * spdMult * dt;
            e.y += ((p.y - e.y) / dToPlayer) * e.speed * spdMult * dt;
          } else if (dToPlayer < idealDist - 55) {
            e.x -= ((p.x - e.x) / dToPlayer) * e.speed * 0.75 * spdMult * dt;
            e.y -= ((p.y - e.y) / dToPlayer) * e.speed * 0.75 * spdMult * dt;
          }
          if (e.attackCd <= 0) {
            e.attackCd = 1.9 + Math.random() * 0.5;
            const a = Math.atan2(p.y - 14 - e.y, p.x - e.x);
            world.projectiles.push({
              id: world.nextId++,
              owner: 'enemy',
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 285,
              vy: Math.sin(a) * 285,
              radius: 6,
              damage: e.damage,
              color: '#F43F5E',
              life: 2.5,
              maxLife: 2.5,
              hitIds: new Set(),
            });
          }
        } else if (e.archetype === 'boss') {
          // Boss: alternates chasing, telegraphed ground slam, and radial needle burst
          if (e.telegraphTimer > 0) {
            e.telegraphTimer -= dt;
            if (e.telegraphTimer <= 0) {
              // Detonate Boss Slam
              world.hazards.push({
                id: world.nextId++,
                kind: 'shockwave',
                x: e.telegraphX,
                y: e.telegraphY,
                vx: 0,
                vy: 0,
                radius: 20,
                maxRadius: e.telegraphRadius,
                damagePerTick: 0,
                tickTimer: 0,
                life: 0.35,
                maxLife: 0.35,
                color: '#F43F5E',
                hitIds: new Set(),
              });
              if (dist(p.x, p.y, e.telegraphX, e.telegraphY) <= e.telegraphRadius) {
                damagePlayer(world, 38);
              }
              // Also release 8 radial stingers
              for (let k = 0; k < 8; k++) {
                const a = (k / 8) * Math.PI * 2 + world.timeSec;
                world.projectiles.push({
                  id: world.nextId++,
                  owner: 'enemy',
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(a) * 260,
                  vy: Math.sin(a) * 260,
                  radius: 7,
                  damage: 20,
                  color: '#E879F9',
                  life: 2.4,
                  maxLife: 2.4,
                  hitIds: new Set(),
                });
              }
            }
          } else {
            if (dToPlayer > e.radius + p.radius + 10) {
              e.x += ((p.x - e.x) / dToPlayer) * e.speed * spdMult * dt;
              e.y += ((p.y - e.y) / dToPlayer) * e.speed * spdMult * dt;
            }
            if (e.attackCd <= 0) {
              e.attackCd = 2.6;
              e.telegraphTimer = 0.95;
              e.telegraphX = p.x;
              e.telegraphY = p.y;
              e.telegraphRadius = 92;
            }
          }
        } else {
          // Larva & Brute melee chase
          if (dToPlayer > e.radius + p.radius - 4) {
            e.x += ((p.x - e.x) / dToPlayer) * e.speed * spdMult * dt;
            e.y += ((p.y - e.y) / dToPlayer) * e.speed * spdMult * dt;
          }
          if (dToPlayer <= e.radius + p.radius + 8 && e.attackCd <= 0) {
            e.attackCd = e.archetype === 'brute' ? 1.25 : 0.95;
            damagePlayer(world, e.damage);
          }
        }

        e.x = clamp(e.x, e.radius + 10, ARENA_WIDTH - e.radius - 10);
        e.y = clamp(e.y, e.radius + 10, ARENA_HEIGHT - e.radius - 10);
      }

      // Soft separation between enemies so they don't stack identically
      for (let i = 0; i < world.enemies.length; i++) {
        const a = world.enemies[i];
        for (let j = i + 1; j < world.enemies.length; j++) {
          const b = world.enemies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const minD = a.radius + b.radius;
          if (d > 0.1 && d < minD) {
            const push = (minD - d) * 0.35;
            a.x -= (dx / d) * push;
            a.y -= (dy / d) * push;
            b.x += (dx / d) * push;
            b.y += (dy / d) * push;
          }
        }
      }

      // Visual slashes, beams, particles, texts
      for (let i = world.slashes.length - 1; i >= 0; i--) {
        world.slashes[i].life -= dt;
        if (world.slashes[i].life <= 0) world.slashes.splice(i, 1);
      }
      for (let i = world.beams.length - 1; i >= 0; i--) {
        world.beams[i].life -= dt;
        if (world.beams[i].life <= 0) world.beams.splice(i, 1);
      }
      for (let i = world.particles.length - 1; i >= 0; i--) {
        const pt = world.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) world.particles.splice(i, 1);
      }
      for (let i = world.texts.length - 1; i >= 0; i--) {
        const ft = world.texts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) world.texts.splice(i, 1);
      }

      // Check defeat
      if (p.hp <= 0) {
        soundFx.playDefeat();
        setScreenState('GAME_OVER');
        return;
      }

      // Check wave clear / victory
      if (world.enemies.length === 0) {
        if (world.wave >= MAX_WAVES) {
          world.score += 500 + p.hp * 2;
          soundFx.playVictory();
          setScreenState('VICTORY');
          return;
        }
        world.waveClearDelay += dt;
        if (world.waveClearDelay >= 1.1) {
          world.waveClearDelay = 0;
          world.wave += 1;
          // Small wave-clear heal bonus
          const heal = 55;
          p.hp = Math.min(p.maxHp, p.hp + heal);
          addFloatingText(world, p.x, p.y - 54, `+${heal} PV VAGUE SUIVANTE`, '#6EC8B5', 1.1);
          soundFx.playWaveClear();
          spawnWaveEnemies(world, world.wave);
        }
      }
    };

    const renderWorld = (world: ArenaWorld) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const accent = championRef.current.accentHex;
      ctx.save();
      if (world.shakeTimer > 0) {
        ctx.translate(
          (Math.random() - 0.5) * world.shakePower * 2,
          (Math.random() - 0.5) * world.shakePower * 2,
        );
      }

      drawArenaBackdrop(ctx, world.timeSec, accent);

      for (const hz of world.hazards) drawHazardZone(ctx, hz, world.timeSec);
      for (const dr of world.drones) drawAllyDrone(ctx, dr, world.timeSec);

      // Depth-sort enemies + player by Y
      const actors: Array<{y: number; draw: () => void}> = world.enemies.map((e) => ({
        y: e.y,
        draw: () => drawEnemy(ctx, e, world.timeSec),
      }));
      actors.push({
        y: world.player.y,
        draw: () =>
          drawPlayer(
            ctx,
            world.player,
            spriteSheetRef.current,
            accent,
            world.timeSec,
          ),
      });
      actors.sort((a, b) => a.y - b.y);
      for (const actor of actors) actor.draw();

      for (const sl of world.slashes) drawSlashArc(ctx, sl);
      for (const bm of world.beams) drawBeamEffect(ctx, bm);
      for (const pr of world.projectiles) drawProjectile(ctx, pr);
      drawParticles(ctx, world.particles);
      drawFloatingTexts(ctx, world.texts);

      // Clean wave announcement overlay on canvas
      if (world.waveBannerTimer > 0) {
        const alpha = Math.min(1, world.waveBannerTimer * 1.4);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(9, 10, 13, 0.72)';
        ctx.fillRect(ARENA_WIDTH / 2 - 220, 32, 440, 56);
        ctx.strokeStyle = 'rgba(217, 164, 65, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ARENA_WIDTH / 2 - 220, 32, 440, 56);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#D9A441';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          world.wave === MAX_WAVES ? 'BOSS FINAL' : `VAGUE ${world.wave} SUR ${MAX_WAVES}`,
          ARENA_WIDTH / 2,
          53,
        );
        ctx.fillStyle = '#F3F1EC';
        ctx.font = '600 18px "Cormorant Garamond", serif';
        ctx.fillText(
          world.wave === MAX_WAVES
            ? "Reine Chitineuse Kai'Zora approche"
            : 'Repoussez l’essaim du Néant',
          ARENA_WIDTH / 2,
          76,
        );
        ctx.restore();
      }

      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const world = worldRef.current;
      if (world) {
        if (screenStateRef.current === 'PLAYING') {
          stepSimulation(world, dt);
        }
        renderWorld(world);

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.06) {
          hudSyncAccum = 0;
          const boss = world.enemies.find((e) => e.archetype === 'boss');
          setHud({
            hp: Math.ceil(world.player.hp),
            maxHp: world.player.maxHp,
            shield: Math.ceil(world.player.shield),
            ultCharge: Math.floor(world.player.ultCharge),
            skillCd: world.player.skillCd,
            skillMaxCd: kitRef.current.skillCooldown,
            wave: world.wave,
            maxWaves: MAX_WAVES,
            kills: world.kills,
            score: world.score,
            enemiesRemaining: world.enemies.length,
            waveBannerTimer: world.waveBannerTimer,
            bossHp: boss ? Math.max(0, Math.ceil(boss.hp)) : null,
            bossMaxHp: boss ? boss.maxHp : null,
            bossName: boss ? boss.name : null,
          });
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [screenState, spawnWaveEnemies, triggerBasicAttack]);

  const updatePointerCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;
    pointerRef.current.x = (e.clientX - rect.left) * scaleX;
    pointerRef.current.y = (e.clientY - rect.top) * scaleY;
    pointerRef.current.active = true;
  };

  const handleToggleMute = () => {
    const next = !muted;
    soundFx.setMuted(next);
    setMuted(next);
  };

  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const ultReady = hud.ultCharge >= 100;
  const skillReady = hud.skillCd <= 0.05;

  return (
    <section
      id="jeu-arene"
      className="rounded-2xl border border-white/10 bg-[#0F1118] p-5 sm:p-6"
      aria-labelledby="arena-title"
    >
      {/* Top Arena Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-medium text-[#D9A441]">
            Arène Jouable · 10 Champions · Ultime &amp; 5 Vagues d’Ennemis
          </p>
          <h2
            id="arena-title"
            className="font-display mt-0.5 text-2xl font-semibold tracking-tight text-[#F3F1EC] sm:text-3xl"
          >
            {screenState === 'CHARACTER_SELECT'
              ? 'Choisissez votre champion insectoïde'
              : `${selectedChampion.name} — ${selectedChampion.title}`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {screenState !== 'CHARACTER_SELECT' && (
            <>
              <button
                type="button"
                onClick={() =>
                  setScreenState((s) => (s === 'PLAYING' ? 'PAUSED' : 'PLAYING'))
                }
                disabled={screenState === 'VICTORY' || screenState === 'GAME_OVER'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-xs font-medium text-[#F3F1EC] transition-colors hover:bg-white/12 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {screenState === 'PAUSED' ? (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reprendre</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScreenState('CHARACTER_SELECT')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-xs font-medium text-[#F3F1EC] transition-colors hover:bg-white/12 whitespace-nowrap shrink-0"
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Changer de champion</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-xs font-medium text-[#C7C9D1] transition-colors hover:bg-white/12 hover:text-white whitespace-nowrap shrink-0"
          >
            {muted ? (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{muted ? 'Muet' : 'Audio'}</span>
          </button>
        </div>
      </div>

      {/* CHARACTER SELECT STATE */}
      {screenState === 'CHARACTER_SELECT' ? (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 10 Champions Selection Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 lg:col-span-8">
            {champions.map((champ) => {
              const isSelected = champ.id === selectedChampion.id;
              return (
                <button
                  key={champ.id}
                  type="button"
                  onClick={() => onSelectChampion(champ)}
                  className={`group flex flex-col items-center rounded-xl border p-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                    isSelected
                      ? 'border-[#D9A441] bg-[#171B26]'
                      : 'border-white/10 bg-[#12141C] hover:border-white/25 hover:bg-[#161923]'
                  }`}
                >
                  <div className="h-20 w-20 overflow-hidden rounded-lg bg-[#0A0C12] p-1">
                    <ChampionSpriteThumb champion={champ} animate={isSelected} size={96} />
                  </div>
                  <p className="font-display mt-2 text-base font-semibold text-[#F3F1EC]">
                    {champ.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9DA3B0]">
                    {champ.role} · {champ.insectType.split(' ')[0]}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected Champion Combat Dossier & Launch CTA */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#131620] p-5 lg:col-span-4">
            <div>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0A0C12] p-1">
                  <ChampionSpriteThumb champion={selectedChampion} animate size={112} />
                </div>
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{color: selectedChampion.accentHex}}
                  >
                    {selectedChampion.role} · {selectedChampion.insectType}
                  </p>
                  <h3 className="font-display mt-0.5 text-2xl font-semibold text-[#F3F1EC]">
                    {selectedChampion.name}
                  </h3>
                  <p className="font-mono-tabular mt-1 text-xs text-[#A7ADBA]">
                    PV {kit.maxHp} · Dégâts {kit.attackDamage} ·{' '}
                    {kit.combatStyle === 'melee' ? 'Mêlée' : 'À distance'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-xs">
                <div>
                  <p className="font-semibold text-[#F3F1EC]">
                    Compétence (E) — {kit.skillName}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-[#9DA3B0]">
                    {kit.skillDescription}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#D9A441]">
                    Ultime (R / Clic droit) — {kit.ultName}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-[#9DA3B0]">
                    {kit.ultDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="mb-3 text-[11px] text-[#8E95A5]">
                Déplacement : ZQSD / WASD / Flèches · Attaque : Clic gauche ou Espace · Compétence : E · Ultime : R ou Clic droit
              </p>
              <button
                type="button"
                onClick={() => startGame(selectedChampion)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D9A441] px-4 py-3 text-sm font-semibold text-[#090A0D] transition-colors hover:bg-[#E4B458] focus-visible:outline-2 focus-visible:outline-white"
              >
                <Swords className="h-4 w-4" aria-hidden="true" />
                <span>Entrer dans l’arène avec {selectedChampion.name}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE ARENA + DOCKED HUD */
        <div className="mt-4">
          {/* Top Status Strip outside playfield */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#12151E] px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-5">
              <span className="font-mono-tabular font-semibold text-[#F3F1EC]">
                Vague {hud.wave} / {hud.maxWaves}
              </span>
              <span className="font-mono-tabular text-[#A7ADBA]">
                Ennemis restants : <strong className="text-[#F3F1EC]">{hud.enemiesRemaining}</strong>
              </span>
              <span className="font-mono-tabular text-[#A7ADBA]">
                Éliminations : <strong className="text-[#F3F1EC]">{hud.kills}</strong>
              </span>
            </div>
            <div className="font-mono-tabular font-semibold text-[#D9A441]">
              Score : {hud.score}
            </div>
          </div>

          {/* Boss Health Bar when Wave 5 Boss is active */}
          {hud.bossHp !== null && hud.bossMaxHp !== null && (
            <div className="mb-3 rounded-lg border border-rose-500/35 bg-rose-950/25 px-4 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-200">{hud.bossName}</span>
                <span className="font-mono-tabular text-rose-200">
                  PV Boss : {hud.bossHp} / {hud.bossMaxHp}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-black/50">
                <div
                  className="h-full bg-rose-500 transition-all duration-100"
                  style={{width: `${(hud.bossHp / hud.bossMaxHp) * 100}%`}}
                />
              </div>
            </div>
          )}

          {/* Playfield Canvas + State Overlays */}
          <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#090B10]">
            <canvas
              ref={canvasRef}
              width={ARENA_WIDTH}
              height={ARENA_HEIGHT}
              onPointerMove={updatePointerCoords}
              onPointerDown={(e) => {
                updatePointerCoords(e);
                if (e.button === 2) {
                  triggerUltimate();
                } else {
                  pointerRef.current.down = true;
                  triggerBasicAttack();
                }
              }}
              onPointerUp={() => {
                pointerRef.current.down = false;
              }}
              onPointerLeave={() => {
                pointerRef.current.down = false;
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="block h-auto w-full cursor-crosshair select-none touch-none"
            />

            {/* PAUSED / VICTORY / GAME OVER MODAL OVERLAY */}
            {screenState !== 'PLAYING' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#090A0D]/80 p-6 backdrop-blur-xs">
                <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12151E] p-6 text-center shadow-2xl">
                  <p className="text-xs font-medium text-[#D9A441]">
                    {screenState === 'PAUSED'
                      ? 'Combat en pause'
                      : screenState === 'VICTORY'
                        ? 'Victoire totale · 5 Vagues vaincues'
                        : 'Défaite dans l’arène'}
                  </p>
                  <h3 className="font-display mt-1 text-3xl font-semibold text-[#F3F1EC]">
                    {screenState === 'PAUSED'
                      ? selectedChampion.name
                      : screenState === 'VICTORY'
                        ? 'L’essaim du Néant est brisé'
                        : `${selectedChampion.name} est tombé`}
                  </h3>
                  <p className="font-mono-tabular mt-3 text-sm text-[#A7ADBA]">
                    Score : {hud.score} · Éliminations : {hud.kills} · Vague {hud.wave}/{hud.maxWaves}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {screenState === 'PAUSED' ? (
                      <button
                        type="button"
                        onClick={() => setScreenState('PLAYING')}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2.5 text-xs font-semibold text-[#090A0D] hover:bg-[#E4B458] whitespace-nowrap shrink-0"
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reprendre</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => startGame(selectedChampion)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2.5 text-xs font-semibold text-[#090A0D] hover:bg-[#E4B458] whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Rejouer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScreenState('CHARACTER_SELECT')}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 px-4 py-2.5 text-xs font-medium text-[#F3F1EC] hover:bg-white/12 whitespace-nowrap shrink-0"
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Changer de champion</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action & Vitals Dock (outside playfield) */}
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#12151E] p-3.5 md:grid-cols-12 md:items-center">
            {/* Health + Shield Bar */}
            <div className="md:col-span-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F3F1EC]">
                  PV : <span className="font-mono-tabular">{hud.hp} / {hud.maxHp}</span>
                </span>
                {hud.shield > 0 && (
                  <span className="font-mono-tabular inline-flex items-center gap-1 text-[#6EC8B5]">
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    +{hud.shield} Bouclier
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-md bg-black/55">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${hpPct}%`,
                    backgroundColor: hpPct > 35 ? '#4FA872' : '#E05252',
                  }}
                />
              </div>
            </div>

            {/* Interactive Skill (E) & Ultimate (R) Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 md:col-span-7 md:justify-end">
              <button
                type="button"
                onClick={triggerBasicAttack}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 px-3.5 py-2 text-xs font-medium text-[#F3F1EC] hover:bg-white/12 whitespace-nowrap shrink-0"
              >
                <Swords className="h-3.5 w-3.5 text-[#D9A441]" aria-hidden="true" />
                <span>Attaque (Clic / Espace)</span>
              </button>

              <button
                type="button"
                onClick={triggerSkill}
                disabled={!skillReady}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  skillReady
                    ? 'border-[#6EC8B5]/60 bg-[#6EC8B5]/15 text-[#F3F1EC] hover:bg-[#6EC8B5]/25'
                    : 'border-white/10 bg-white/4 text-[#8E95A5]'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-[#6EC8B5]" aria-hidden="true" />
                <span>
                  [E] {kit.skillName}{' '}
                  {!skillReady ? `(${hud.skillCd.toFixed(1)}s)` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={triggerUltimate}
                disabled={!ultReady}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  ultReady
                    ? 'border-[#D9A441] bg-[#D9A441] text-[#090A0D] hover:bg-[#E4B458]'
                    : 'border-white/10 bg-white/5 text-[#9DA3B0]'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  [R] Ultime : {kit.ultName} ({hud.ultCharge}%)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
