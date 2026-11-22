import {ProcessedSpriteSheet} from '../sprites/sheetProcessor';
import {SPRITE_COLS, SPRITE_PIVOT} from '../sprites/types';
import {
  AllyDrone,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BeamEffect,
  EnemyEntity,
  FloatingText,
  HazardZone,
  Particle,
  PlayerEntity,
  ProjectileEntity,
  SlashArcEffect,
} from './arenaTypes';

export function drawArenaBackdrop(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  accentHex: string,
) {
  // Deep slate obsidian floor
  const bgGrad = ctx.createRadialGradient(
    ARENA_WIDTH * 0.5,
    ARENA_HEIGHT * 0.5,
    80,
    ARENA_WIDTH * 0.5,
    ARENA_HEIGHT * 0.5,
    ARENA_WIDTH * 0.72,
  );
  bgGrad.addColorStop(0, '#171B26');
  bgGrad.addColorStop(0.65, '#10131B');
  bgGrad.addColorStop(1, '#090B10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Carved tactical grid tiles
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const tile = 60;
  for (let x = tile; x < ARENA_WIDTH; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA_HEIGHT);
    ctx.stroke();
  }
  for (let y = tile; y < ARENA_HEIGHT; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA_WIDTH, y);
    ctx.stroke();
  }

  // Central Rift sigil ring
  const cx = ARENA_WIDTH / 2;
  const cy = ARENA_HEIGHT / 2;
  ctx.strokeStyle = `${accentHex}26`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 132, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(217, 164, 65, 0.14)';
  ctx.lineWidth = 1.25;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, 152, timeSec * 0.08, timeSec * 0.08 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Outer arena carved boundary
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, ARENA_WIDTH - 20, ARENA_HEIGHT - 20);
  ctx.restore();
}

export function drawHazardZone(ctx: CanvasRenderingContext2D, zone: HazardZone, timeSec: number) {
  const ratio = Math.max(0, zone.life / zone.maxLife);
  ctx.save();

  if (zone.kind === 'sonic_ring' || zone.kind === 'shockwave') {
    const progress = 1 - ratio;
    const r = zone.radius;
    ctx.globalAlpha = Math.max(0.1, (1 - progress * 0.85) * 0.9);
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = zone.kind === 'sonic_ring' ? 7 : 5;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha *= 0.25;
    ctx.fillStyle = zone.color;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (zone.kind === 'trap') {
    ctx.globalAlpha = Math.min(1, ratio * 2);
    ctx.fillStyle = 'rgba(123, 166, 93, 0.16)';
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Thorn spikes inside trap
    ctx.strokeStyle = '#BCE098';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(
        zone.x + Math.cos(a) * (zone.radius * 0.35),
        zone.y + Math.sin(a) * (zone.radius * 0.35),
      );
      ctx.lineTo(
        zone.x + Math.cos(a) * (zone.radius * 0.85),
        zone.y + Math.sin(a) * (zone.radius * 0.85),
      );
      ctx.stroke();
    }
  } else if (zone.kind === 'frost_pillar') {
    ctx.globalAlpha = Math.min(1, ratio * 2.2);
    ctx.fillStyle = 'rgba(108, 168, 220, 0.14)';
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central ice diamond crystal
    ctx.fillStyle = '#B8E4FF';
    ctx.strokeStyle = '#090B10';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y - 24);
    ctx.lineTo(zone.x + 14, zone.y);
    ctx.lineTo(zone.x, zone.y + 12);
    ctx.lineTo(zone.x - 14, zone.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Vortex / Sandstorm Cyclone
    ctx.globalAlpha = Math.min(0.9, ratio * 1.8);
    ctx.fillStyle =
      zone.kind === 'cyclone'
        ? 'rgba(217, 155, 78, 0.2)'
        : 'rgba(156, 140, 196, 0.22)';
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let ring = 0; ring < 3; ring++) {
      const rr = zone.radius * (0.38 + ring * 0.26);
      const start = timeSec * (4 + ring * 1.4) + ring * 2;
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, rr, start, start + Math.PI * 1.25);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawSlashArc(ctx: CanvasRenderingContext2D, slash: SlashArcEffect) {
  const ratio = Math.max(0, slash.life / slash.maxLife);
  ctx.save();
  ctx.globalAlpha = ratio;
  ctx.translate(slash.x, slash.y);
  ctx.rotate(slash.angle);

  ctx.strokeStyle = slash.color;
  ctx.lineWidth = 10 * ratio + 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, slash.radius, -slash.arcSpread / 2, slash.arcSpread / 2);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3 * ratio;
  ctx.beginPath();
  ctx.arc(0, 0, slash.radius * 0.96, -slash.arcSpread * 0.4, slash.arcSpread * 0.4);
  ctx.stroke();
  ctx.restore();
}

export function drawBeamEffect(ctx: CanvasRenderingContext2D, beam: BeamEffect) {
  const ratio = Math.max(0, beam.life / beam.maxLife);
  ctx.save();
  ctx.globalAlpha = ratio;
  ctx.lineCap = 'round';

  ctx.strokeStyle = beam.color;
  ctx.lineWidth = beam.width * (0.6 + ratio * 0.5);
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(2, beam.width * 0.32 * ratio);
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();
  ctx.restore();
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyEntity,
  timeSec: number,
) {
  // Draw boss/brute telegraphed attack indicator on ground
  if (enemy.telegraphTimer > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(220, 68, 68, 0.16)';
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.telegraphX, enemy.telegraphY, enemy.telegraphRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, enemy.radius * 0.78, enemy.radius * 0.9, enemy.radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  const wobble = Math.sin(timeSec * 10 + enemy.id) * 1.5;
  ctx.scale(enemy.facing, 1);

  const ink = '#0A0B10';
  const isFlash = enemy.hurtFlash > 0;

  if (enemy.archetype === 'larva') {
    // Cel-shaded Void Crawler Insect
    const shell = isFlash ? '#FFF2D6' : '#8A56AC';
    const belly = isFlash ? '#FFFFFF' : '#4E2B6B';

    // Articulated legs
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      const lx = i * 7;
      ctx.beginPath();
      ctx.moveTo(lx, 4);
      ctx.lineTo(lx - 4, 14 + (i % 2 === 0 ? wobble : -wobble));
      ctx.stroke();
    }

    // Segmented abdomen
    ctx.fillStyle = belly;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-6, 0, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Carapace head/thorax
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(5, -1, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mandibles
    ctx.strokeStyle = '#E6B8FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -3);
    ctx.lineTo(20, -6);
    ctx.moveTo(14, 3);
    ctx.lineTo(20, 6);
    ctx.stroke();

    // Glowing eye
    ctx.fillStyle = '#FF5C8D';
    ctx.beginPath();
    ctx.arc(10, -4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.archetype === 'stinger') {
    // Cel-shaded Winged Void Wasp
    const wingFlutter = Math.sin(timeSec * 28 + enemy.id) * 0.35;
    const body = isFlash ? '#FFF2D6' : '#C94A5A';
    const stripe = isFlash ? '#FFFFFF' : '#261420';

    // Translucent cel-shaded wings
    ctx.save();
    ctx.rotate(-0.35 + wingFlutter);
    ctx.fillStyle = 'rgba(180, 235, 255, 0.55)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-6, -15, 7, 15, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Abdomen + stinger
    ctx.fillStyle = body;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-8, 2 + wobble * 0.5, 13, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = stripe;
    ctx.fillRect(-13, -3 + wobble * 0.5, 4, 10);

    // Thorax & head
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(7, -2 + wobble * 0.5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(12, -4 + wobble * 0.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.archetype === 'brute') {
    // Armored Obsidian Beetle Brute
    const shell = isFlash ? '#FFF2D6' : '#3E6B5B';
    const plate = isFlash ? '#FFFFFF' : '#65A38C';

    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 11, 10);
      ctx.lineTo(i * 12 + 3, 24 + (i % 2 === 0 ? wobble : -wobble));
      ctx.stroke();
    }

    // Heavy domed shell
    ctx.fillStyle = shell;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-2, -2, 24, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Specular armor ridge
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.ellipse(-4, -9, 15, 7, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Horn
    ctx.fillStyle = '#D9A441';
    ctx.beginPath();
    ctx.moveTo(16, -2);
    ctx.lineTo(31, -11);
    ctx.lineTo(22, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#FF784F';
    ctx.beginPath();
    ctx.arc(15, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // BOSS: Reine Chitineuse Kai'Zora
    const wingBeat = Math.sin(timeSec * 14) * 0.25;
    const carapace = isFlash ? '#FFF5E0' : '#7E2A53';
    const crown = isFlash ? '#FFFFFF' : '#D9A441';

    // Four iridescent wings
    ctx.save();
    ctx.rotate(-0.2 + wingBeat);
    ctx.fillStyle = 'rgba(232, 121, 249, 0.35)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-18, -32, 12, 28, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Royal legs
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    for (let i = -2; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 12, 14);
      ctx.lineTo(i * 15 - 6, 36 + (i % 2 === 0 ? wobble : -wobble));
      ctx.stroke();
    }

    // Large abdomen + thorax
    ctx.fillStyle = carapace;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(-14, 4, 28, 22, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9F396B';
    ctx.beginPath();
    ctx.arc(16, -4, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crown horns
    ctx.fillStyle = crown;
    ctx.beginPath();
    ctx.moveTo(14, -22);
    ctx.lineTo(24, -40);
    ctx.lineTo(28, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing eyes
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(25, -8, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(28, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stun indicator stars
  if (enemy.stunTimer > 0) {
    ctx.scale(enemy.facing, 1);
    ctx.fillStyle = '#FACC15';
    for (let s = 0; s < 3; s++) {
      const a = timeSec * 6 + (s * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 14, -enemy.radius - 10 + Math.sin(a) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Enemy HP Bar (clean, readable)
  if (enemy.archetype !== 'boss' && enemy.hp < enemy.maxHp) {
    const barW = enemy.radius * 2 + 8;
    const barH = 5;
    const bx = enemy.x - barW / 2;
    const by = enemy.y - enemy.radius - 14;
    ctx.fillStyle = 'rgba(9, 10, 13, 0.85)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = enemy.slowTimer > 0 ? '#6CA8DC' : '#E05252';
    ctx.fillRect(bx, by, barW * Math.max(0, enemy.hp / enemy.maxHp), barH);
  }
}

export function drawAllyDrone(ctx: CanvasRenderingContext2D, drone: AllyDrone, timeSec: number) {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.scale(drone.facing, 1);
  const bob = Math.sin(timeSec * 14 + drone.id) * 1.5;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = drone.color;
  ctx.strokeStyle = '#0A0B10';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-4, bob, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(6, bob - 1, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(9, bob - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity,
  sheet: ProcessedSpriteSheet | null,
  accentHex: string,
  timeSec: number,
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Subtle shadow under feet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ult ready subtle ground ring
  if (player.ultCharge >= 100) {
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.45 + Math.sin(timeSec * 6) * 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Active shield aura
  if (player.shield > 0) {
    ctx.strokeStyle = '#6EC8B5';
    ctx.fillStyle = 'rgba(110, 200, 181, 0.12)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -28, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Aim direction chevron at ground ring
  const aimDist = 36;
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.arc(
    Math.cos(player.aimAngle) * aimDist,
    Math.sin(player.aimAngle) * (aimDist * 0.48),
    4,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Sprite frame drawing
  if (sheet) {
    const drawSize = 104;
    const frameIndex =
      Math.floor(player.animTimer * player.animFps) % SPRITE_COLS;
    const rowFrames = sheet.frames[player.animRow] ?? sheet.frames[0];
    const frameCanvas = rowFrames?.[frameIndex] ?? rowFrames?.[0];

    if (frameCanvas) {
      ctx.save();
      ctx.scale(player.facing, 1);
      if (player.hurtTimer > 0 && Math.floor(player.hurtTimer * 20) % 2 === 0) {
        ctx.filter = 'brightness(1.85)';
      }
      const pivotOffsetX = drawSize * SPRITE_PIVOT.x;
      const pivotOffsetY = drawSize * SPRITE_PIVOT.y;
      ctx.drawImage(frameCanvas, -pivotOffsetX, -pivotOffsetY, drawSize, drawSize);
      ctx.restore();
    }
  } else {
    // Loading fallback circle while sprite sheet decodes (first ~150ms)
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(0, -24, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, p: ProjectileEntity) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const angle = Math.atan2(p.vy, p.vx);
  ctx.rotate(angle);

  ctx.fillStyle = p.color;
  ctx.strokeStyle = '#090A0D';
  ctx.lineWidth = 2;

  if (p.owner === 'player') {
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(p.radius * 0.3, 0, p.radius * 0.6, p.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (0.4 + alpha * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  ctx.save();
  ctx.textAlign = 'center';
  for (const ft of texts) {
    const alpha = Math.max(0, Math.min(1, (ft.life / ft.maxLife) * 1.4));
    ctx.globalAlpha = alpha;
    const size = Math.round(13 * (ft.scale ?? 1));
    ctx.font = `700 ${size}px "JetBrains Mono", monospace`;
    ctx.strokeStyle = '#090A0D';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.restore();
}
