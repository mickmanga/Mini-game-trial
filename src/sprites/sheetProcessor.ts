import {InsectChampion} from '../data/champions';
import {FrameSizeOption, SPRITE_COLS, SPRITE_PIVOT, SPRITE_ROWS} from './types';

export interface ProcessedSpriteSheet {
  championId: string;
  frameSize: FrameSizeOption;
  threshold: number;
  sheetCanvas: HTMLCanvasElement;
  frames: HTMLCanvasElement[][]; // [5 rows][12 cols]
}

const SHEET_CACHE = new Map<string, ProcessedSpriteSheet>();

interface ChampionRigConfig {
  isFloating: boolean;
  idle: number[];
  run: number[];
  attack: number[];
  ult: number[];
  hitKo: number[];
}

// Curated cohesive keyframe maps per champion (from the 4x4 grid indices 0..15)
const CHAMPION_RIGS: Record<string, ChampionRigConfig> = {
  kaelvex: {
    isFloating: false,
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  brimkor: {
    isFloating: false,
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  sylphera: {
    isFloating: true,
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  vesperon: {
    isFloating: true,
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  noxthalys: {
    isFloating: true,
    idle: [0, 2, 3, 2],
    run: [5, 6, 7, 6],
    attack: [8, 9, 10, 9],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  krizarak: {
    isFloating: false,
    idle: [1, 2, 3, 2],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  aurelia: {
    isFloating: true,
    idle: [1, 2, 3, 2],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [15, 15],
  },
  myrmex: {
    isFloating: false,
    idle: [0, 1, 2, 1],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  cymoth: {
    isFloating: false,
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 5],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
  zephyrion: {
    isFloating: true,
    idle: [0, 1, 2, 3],
    run: [4, 5, 6, 7],
    attack: [8, 9, 10, 11],
    ult: [12, 13],
    hitKo: [14, 15],
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function findBestCuts(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  axis: 'x' | 'y',
  segments: number,
): number[] {
  const length = axis === 'x' ? width : height;
  const crossLength = axis === 'x' ? height : width;
  const cuts: number[] = [0];

  for (let s = 1; s < segments; s++) {
    const ideal = Math.round((length * s) / segments);
    const searchRadius = Math.round(length * 0.065);
    const minIdx = Math.max(1, ideal - searchRadius);
    const maxIdx = Math.min(length - 2, ideal + searchRadius);

    let bestPos = ideal;
    let lowestInkScore = Number.POSITIVE_INFINITY;

    for (let pos = minIdx; pos <= maxIdx; pos++) {
      let ink = 0;
      for (let c = 0; c < crossLength; c += 2) {
        const px = axis === 'x' ? pos : c;
        const py = axis === 'x' ? c : pos;
        const offset = (py * width + px) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        if (r < 240 || g < 240 || b < 240) {
          ink += 255 - Math.min(r, g, b);
        }
      }
      const distPenalty = Math.abs(pos - ideal) * 0.25;
      const totalScore = ink + distPenalty;
      if (totalScore < lowestInkScore) {
        lowestInkScore = totalScore;
        bestPos = pos;
      }
    }
    cuts.push(bestPos);
  }

  cuts.push(length);
  return cuts;
}

interface ExtractedCell {
  canvas: HTMLCanvasElement;
  bbox: {minX: number; minY: number; maxX: number; maxY: number};
  spineX: number;
  medianY: number;
  footY: number;
}

function extractTransparentCell(
  sourceCtx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  threshold: number,
): ExtractedCell | null {
  const cellCanvas = document.createElement('canvas');
  cellCanvas.width = sw;
  cellCanvas.height = sh;
  const ctx = cellCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(sourceCtx.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;
  const totalPixels = sw * sh;

  const visited = new Uint8Array(totalPixels);
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const isNearWhite = (idx: number): boolean => {
    const o = idx * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    return minC >= threshold && maxC - minC <= 32;
  };

  const enqueue = (idx: number) => {
    if (visited[idx]) return;
    visited[idx] = 1;
    if (isNearWhite(idx)) {
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < sw; x++) {
    enqueue(x);
    enqueue((sh - 1) * sw + x);
  }
  for (let y = 1; y < sh - 1; y++) {
    enqueue(y * sw);
    enqueue(y * sw + (sw - 1));
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % sw;
    const y = (idx - x) / sw;
    if (x > 0) enqueue(idx - 1);
    if (x < sw - 1) enqueue(idx + 1);
    if (y > 0) enqueue(idx - sw);
    if (y < sh - 1) enqueue(idx + sw);
  }

  for (let i = 0; i < totalPixels; i++) {
    if (isBg[i]) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const x = i % sw;
    const y = (i - x) / sw;
    const touchesBg =
      (x > 0 && isBg[i - 1]) ||
      (x < sw - 1 && isBg[i + 1]) ||
      (y > 0 && isBg[i - sw]) ||
      (y < sh - 1 && isBg[i + sw]);

    if (touchesBg) {
      const o = i * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const lum = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum > threshold - 36 && sat < 34) {
        const ratio = Math.max(0, Math.min(1, (threshold + 8 - lum) / 48));
        data[o + 3] = Math.round(ratio * 255);
        data[o] = Math.max(0, Math.round(r * 0.85));
        data[o + 1] = Math.max(0, Math.round(g * 0.85));
        data[o + 2] = Math.max(0, Math.round(b * 0.85));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;

  const colMass = new Uint32Array(sw);
  const rowMass = new Uint32Array(sh);
  let totalMass = 0;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const a = data[(y * sw + x) * 4 + 3];
      if (a > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        colMass[x] += a;
        rowMass[y] += a;
        totalMass += a;
      }
    }
  }

  if (maxX < minX || maxY < minY || totalMass === 0) return null;

  // Compute robust horizontal torso center-of-mass using squared column density
  // so thin horizontal beams, arrows, or slash tips never shift the body
  let weightedSumX = 0;
  let totalCoreWeight = 0;
  for (let x = minX; x <= maxX; x++) {
    const m = colMass[x];
    if (m > 0) {
      const w = m * m;
      weightedSumX += x * w;
      totalCoreWeight += w;
    }
  }
  const spineX =
    totalCoreWeight > 0 ? weightedSumX / totalCoreWeight : (minX + maxX) / 2;

  // Compute vertical median (50%) & solid foot baseline (97%)
  let accY = 0;
  let medianY = (minY + maxY) / 2;
  let footY = maxY;
  let foundMedian = false;
  for (let y = minY; y <= maxY; y++) {
    accY += rowMass[y];
    if (!foundMedian && accY >= totalMass * 0.5) {
      medianY = y;
      foundMedian = true;
    }
    if (accY >= totalMass * 0.97) {
      footY = y;
      break;
    }
  }

  return {
    canvas: cellCanvas,
    bbox: {minX, minY, maxX, maxY},
    spineX,
    medianY,
    footY,
  };
}

function normalizeCellToCanvas(
  cell: ExtractedCell,
  globalScale: number,
  refMedianOffset: number,
  isFloating: boolean,
  frameSize: number,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = frameSize;
  out.height = frameSize;
  const ctx = out.getContext('2d');
  if (!ctx) return out;

  const bw = cell.bbox.maxX - cell.bbox.minX + 1;
  const bh = cell.bbox.maxY - cell.bbox.minY + 1;

  // Keep locked global scale; only gently clamp if a massive beam would clip badly
  const drawW = bw * globalScale;
  const drawH = bh * globalScale;

  const pivotX = frameSize * SPRITE_PIVOT.x;
  const pivotY = frameSize * SPRITE_PIVOT.y;

  // Align horizontal spine to pivotX, clamping only if it runs outside frame
  let dx = pivotX - (cell.spineX - cell.bbox.minX) * globalScale;
  if (dx + drawW > frameSize - 2) {
    dx = Math.max(2, frameSize - 2 - drawW);
  }
  if (dx < 2) {
    dx = 2;
  }

  let dy: number;
  if (isFloating) {
    // Anchor floating characters by their torso vertical median so robes/auras never make them bob erratically
    dy = pivotY - refMedianOffset - (cell.medianY - cell.bbox.minY) * globalScale;
  } else {
    // Anchor grounded characters by their solid foot row
    dy = pivotY - (cell.footY - cell.bbox.minY) * globalScale;
  }

  // Keep inside top/bottom safely
  if (dy < 2) dy = 2;
  if (dy + drawH > frameSize - 2) {
    dy = Math.max(2, frameSize - 2 - drawH);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    cell.canvas,
    cell.bbox.minX,
    cell.bbox.minY,
    bw,
    bh,
    dx,
    dy,
    drawW,
    drawH,
  );

  return out;
}

interface FrameTransform {
  keyCanvas: HTMLCanvasElement;
  dx?: number;
  dy?: number;
  rot?: number;
  scaleX?: number;
  scaleY?: number;
  trailCanvas?: HTMLCanvasElement;
  trailAlpha?: number;
  trailDx?: number;
  brightness?: number;
  hitFlashAlpha?: number;
}

function renderCrispTransformedFrame(
  spec: FrameTransform,
  frameSize: number,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = frameSize;
  out.height = frameSize;
  const ctx = out.getContext('2d');
  if (!ctx) return out;

  const pivotX = frameSize * SPRITE_PIVOT.x;
  const pivotY = frameSize * SPRITE_PIVOT.y;
  const s = frameSize / 256;

  // Optional subtle crisp 1-frame motion trail during fast dash/strike
  if (spec.trailCanvas && spec.trailAlpha && spec.trailAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = spec.trailAlpha;
    ctx.translate((spec.trailDx ?? -6) * s, 0);
    ctx.drawImage(spec.trailCanvas, 0, 0, frameSize, frameSize);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(pivotX + (spec.dx ?? 0) * s, pivotY + (spec.dy ?? 0) * s);
  if (spec.rot) ctx.rotate(spec.rot);
  ctx.scale(spec.scaleX ?? 1, spec.scaleY ?? 1);
  ctx.translate(-pivotX, -pivotY);

  if (spec.brightness && spec.brightness !== 1) {
    ctx.filter = `brightness(${spec.brightness})`;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(spec.keyCanvas, 0, 0, frameSize, frameSize);
  ctx.filter = 'none';

  // Clean hit-impact flash overlay masked strictly to character silhouette
  if (spec.hitFlashAlpha && spec.hitFlashAlpha > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255, 240, 210, ${spec.hitFlashAlpha})`;
    ctx.fillRect(0, 0, frameSize, frameSize);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
  return out;
}

function buildCohesive12Frames(
  rig: ChampionRigConfig,
  normalizedKeyframes: HTMLCanvasElement[],
  frameSize: number,
): HTMLCanvasElement[][] {
  const getKey = (idx: number) => normalizedKeyframes[idx] ?? normalizedKeyframes[0];

  // 1. IDLE (12 frames): Seamless breathing & poise loop
  const idleFrames: HTMLCanvasElement[] = [];
  for (let i = 0; i < SPRITE_COLS; i++) {
    const phase = (i / SPRITE_COLS) * Math.PI * 2;
    const keySlot = Math.floor((i / SPRITE_COLS) * rig.idle.length) % rig.idle.length;
    const breath = Math.sin(phase);
    const sway = Math.cos(phase);
    idleFrames.push(
      renderCrispTransformedFrame(
        {
          keyCanvas: getKey(rig.idle[keySlot]),
          dy: rig.isFloating ? breath * 3.5 : breath * 0.8,
          rot: sway * 0.012,
          scaleY: 1 + breath * 0.014,
          scaleX: 1 - breath * 0.008,
        },
        frameSize,
      ),
    );
  }

  // 2. RUN (12 frames): Rhythmic locomotion stride loop
  const runFrames: HTMLCanvasElement[] = [];
  for (let i = 0; i < SPRITE_COLS; i++) {
    const phase = (i / SPRITE_COLS) * Math.PI * 2;
    const keySlot = Math.floor((i / SPRITE_COLS) * rig.run.length) % rig.run.length;
    const prevSlot = (keySlot - 1 + rig.run.length) % rig.run.length;
    const stepBounce = Math.abs(Math.sin(phase * 2));
    runFrames.push(
      renderCrispTransformedFrame(
        {
          keyCanvas: getKey(rig.run[keySlot]),
          dx: Math.cos(phase * 2) * 2.5,
          dy: rig.isFloating ? Math.sin(phase * 2) * 4 : -stepBounce * 4.5,
          rot: 0.035 + Math.sin(phase * 2) * 0.016,
          scaleX: 1.02 - stepBounce * 0.02,
          scaleY: 0.99 + stepBounce * 0.02,
          trailCanvas: getKey(rig.run[prevSlot]),
          trailAlpha: 0.14,
          trailDx: -5,
        },
        frameSize,
      ),
    );
  }

  // 3. ATTACK (12 frames): Progressive anticipation -> strike -> impact -> recovery
  const a0 = getKey(rig.attack[0]);
  const a1 = getKey(rig.attack[1] ?? rig.attack[0]);
  const a2 = getKey(rig.attack[2] ?? rig.attack[1] ?? rig.attack[0]);
  const a3 = getKey(rig.attack[3] ?? rig.attack[2] ?? rig.attack[0]);
  const g0 = getKey(rig.idle[0]);

  const attackSpecs: FrameTransform[] = [
    {keyCanvas: g0, dx: -2, rot: -0.025, scaleX: 0.98, scaleY: 1.02},
    {keyCanvas: a0, dx: -5, rot: -0.055, scaleX: 0.96, scaleY: 1.04},
    {keyCanvas: a0, dx: -7, rot: -0.075, scaleX: 0.95, scaleY: 1.05},
    {keyCanvas: a1, dx: 2, rot: 0.025, scaleX: 1.03, scaleY: 0.98, trailCanvas: a0, trailAlpha: 0.18, trailDx: -8},
    {keyCanvas: a1, dx: 6, rot: 0.05, scaleX: 1.04, scaleY: 0.97, trailCanvas: a0, trailAlpha: 0.15, trailDx: -10},
    {keyCanvas: a2, dx: 10, dy: -2, rot: 0.06, scaleX: 1.05, scaleY: 0.97, brightness: 1.08, trailCanvas: a1, trailAlpha: 0.2, trailDx: -10},
    {keyCanvas: a2, dx: 10, dy: -1, rot: 0.05, scaleX: 1.04, scaleY: 0.98, brightness: 1.05},
    {keyCanvas: a2, dx: 8, dy: 0, rot: 0.04, scaleX: 1.02, scaleY: 0.99},
    {keyCanvas: a3, dx: 5, rot: 0.025, scaleX: 1.01, scaleY: 1.0},
    {keyCanvas: a3, dx: 3, rot: 0.015, scaleX: 1.0, scaleY: 1.0},
    {keyCanvas: g0, dx: 1, rot: 0.006, scaleX: 1.0, scaleY: 1.0},
    {keyCanvas: g0, dx: 0, rot: 0, scaleX: 1.0, scaleY: 1.0},
  ];
  const attackFrames = attackSpecs.map((s) =>
    renderCrispTransformedFrame(s, frameSize),
  );

  // 4. ULT (12 frames): Progressive charge ascension -> apex burst -> settle
  const u0 = getKey(rig.ult[0]);
  const u1 = getKey(rig.ult[1] ?? rig.ult[0]);
  const ultSpecs: FrameTransform[] = [
    {keyCanvas: g0, dy: -2, scaleX: 0.98, scaleY: 1.02, brightness: 1.03},
    {keyCanvas: u0, dy: -5, rot: -0.03, scaleX: 1.01, scaleY: 1.03, brightness: 1.06},
    {keyCanvas: u0, dy: -8, rot: -0.04, scaleX: 1.03, scaleY: 1.04, brightness: 1.1},
    {keyCanvas: u0, dy: -10, rot: -0.02, scaleX: 1.04, scaleY: 1.04, brightness: 1.14},
    {keyCanvas: u1, dx: 2, dy: -7, rot: 0.02, scaleX: 1.05, scaleY: 1.03, brightness: 1.16, trailCanvas: u0, trailAlpha: 0.2, trailDx: 0},
    {keyCanvas: u1, dx: -2, dy: -5, rot: 0.03, scaleX: 1.06, scaleY: 1.02, brightness: 1.16},
    {keyCanvas: u1, dx: 1.5, dy: -3, rot: 0.025, scaleX: 1.04, scaleY: 1.02, brightness: 1.12},
    {keyCanvas: u1, dx: 0, dy: -2, rot: 0.015, scaleX: 1.03, scaleY: 1.01, brightness: 1.08},
    {keyCanvas: u0, dy: -4, rot: 0.01, scaleX: 1.02, scaleY: 1.01, brightness: 1.04},
    {keyCanvas: u0, dy: -2, rot: 0.005, scaleX: 1.01, scaleY: 1.0, brightness: 1.02},
    {keyCanvas: g0, dy: -1, rot: 0, scaleX: 1.0, scaleY: 1.0},
    {keyCanvas: g0, dy: 0, rot: 0, scaleX: 1.0, scaleY: 1.0},
  ];
  const ultFrames = ultSpecs.map((s) =>
    renderCrispTransformedFrame(s, frameSize),
  );

  // 5. HIT / K.O. (12 frames): Crisp impact flash -> stagger -> ground defeat
  const k0 = getKey(rig.hitKo[0]);
  const k1 = getKey(rig.hitKo[1] ?? rig.hitKo[0]);
  const koSpecs: FrameTransform[] = [
    {keyCanvas: g0, dx: -4, dy: -2, rot: -0.05, hitFlashAlpha: 0.55},
    {keyCanvas: k0, dx: -8, dy: -4, rot: -0.08, hitFlashAlpha: 0.35},
    {keyCanvas: k0, dx: -10, dy: -2, rot: -0.1, hitFlashAlpha: 0.12},
    {keyCanvas: k0, dx: -8, dy: 1, rot: -0.07},
    {keyCanvas: k0, dx: -5, dy: 3, rot: -0.04},
    {keyCanvas: k1, dx: -3, dy: -2, rot: -0.03, trailCanvas: k0, trailAlpha: 0.16, trailDx: -4},
    {keyCanvas: k1, dx: -1, dy: 2, rot: 0.01, scaleX: 1.03, scaleY: 0.97},
    {keyCanvas: k1, dx: 0, dy: 0, rot: 0, scaleX: 1.01, scaleY: 0.99},
    {keyCanvas: k1, dx: 0, dy: 0, rot: 0},
    {keyCanvas: k1, dx: 0, dy: 0, rot: 0},
    {keyCanvas: k1, dx: 0, dy: 0, rot: 0},
    {keyCanvas: k1, dx: 0, dy: 0, rot: 0},
  ];
  const hitKoFrames = koSpecs.map((s) =>
    renderCrispTransformedFrame(s, frameSize),
  );

  return [idleFrames, runFrames, attackFrames, ultFrames, hitKoFrames];
}

export async function processChampionSpriteSheet(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
  threshold = 234,
): Promise<ProcessedSpriteSheet> {
  const cacheKey = `${champion.id}:${frameSize}:${threshold}:cel_v3`;
  const cached = SHEET_CACHE.get(cacheKey);
  if (cached) return cached;

  const rig = CHAMPION_RIGS[champion.id] ?? CHAMPION_RIGS.kaelvex;
  const img = await loadImage(champion.spriteSheetPath);

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = img.naturalWidth || img.width;
  rawCanvas.height = img.naturalHeight || img.height;
  const rawCtx = rawCanvas.getContext('2d', {willReadFrequently: true});
  if (!rawCtx) {
    throw new Error('Impossible d’initialiser le contexte Canvas 2D');
  }

  rawCtx.drawImage(img, 0, 0);
  const rawData = rawCtx.getImageData(0, 0, rawCanvas.width, rawCanvas.height).data;

  const srcCols = 4;
  const srcRows = 4;
  const colCuts = findBestCuts(rawData, rawCanvas.width, rawCanvas.height, 'x', srcCols);
  const rowCuts = findBestCuts(rawData, rawCanvas.width, rawCanvas.height, 'y', srcRows);

  const extractedCells: (ExtractedCell | null)[] = [];
  for (let r = 0; r < srcRows; r++) {
    for (let c = 0; c < srcCols; c++) {
      const sx = colCuts[c];
      const sy = rowCuts[r];
      const sw = Math.max(1, colCuts[c + 1] - sx);
      const sh = Math.max(1, rowCuts[r + 1] - sy);
      extractedCells.push(extractTransparentCell(rawCtx, sx, sy, sw, sh, threshold));
    }
  }

  // Compute ONE locked globalScale from curated idle keyframes so character size NEVER fluctuates
  const idleCells = rig.idle
    .map((idx) => extractedCells[idx])
    .filter((c): c is ExtractedCell => c !== null);

  const avgIdleHeight =
    idleCells.length > 0
      ? idleCells.reduce((sum, c) => sum + (c.bbox.maxY - c.bbox.minY + 1), 0) /
        idleCells.length
      : rawCanvas.height / srcRows;

  const avgIdleWidth =
    idleCells.length > 0
      ? idleCells.reduce((sum, c) => sum + (c.bbox.maxX - c.bbox.minX + 1), 0) /
        idleCells.length
      : rawCanvas.width / srcCols;

  // Target 72% height & <= 74% width so swings/auras never shrink the hero
  const globalScale = Math.min(
    (frameSize * 0.72) / Math.max(1, avgIdleHeight),
    (frameSize * 0.74) / Math.max(1, avgIdleWidth),
  );

  // Reference torso vertical offset for floating champions
  const refMedianOffset =
    idleCells.length > 0
      ? (idleCells.reduce((sum, c) => sum + (c.footY - c.medianY), 0) /
          idleCells.length) *
        globalScale
      : frameSize * 0.35;

  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = frameSize;
  fallbackCanvas.height = frameSize;

  const normalizedKeyframes = extractedCells.map((cell) =>
    cell
      ? normalizeCellToCanvas(
          cell,
          globalScale,
          refMedianOffset,
          rig.isFloating,
          frameSize,
        )
      : fallbackCanvas,
  );

  const frames = buildCohesive12Frames(rig, normalizedKeyframes, frameSize);

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = SPRITE_COLS * frameSize;
  sheetCanvas.height = SPRITE_ROWS * frameSize;
  const sheetCtx = sheetCanvas.getContext('2d');

  if (sheetCtx) {
    for (let r = 0; r < SPRITE_ROWS; r++) {
      for (let c = 0; c < SPRITE_COLS; c++) {
        const frame = frames[r]?.[c];
        if (frame) {
          sheetCtx.drawImage(frame, c * frameSize, r * frameSize);
        }
      }
    }
  }

  const processed: ProcessedSpriteSheet = {
    championId: champion.id,
    frameSize,
    threshold,
    sheetCanvas,
    frames,
  };

  SHEET_CACHE.set(cacheKey, processed);
  return processed;
}
