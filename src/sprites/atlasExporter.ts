import {InsectChampion} from '../data/champions';
import {processChampionSpriteSheet} from './sheetProcessor';
import {
  FrameSizeOption,
  SPRITE_ANIMATIONS,
  SPRITE_COLS,
  SPRITE_PIVOT,
  SPRITE_ROWS,
} from './types';

export function buildPhaserPixiAtlasJson(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
) {
  const frames: Record<string, unknown> = {};
  const animations: Record<string, string[]> = {};

  for (const anim of SPRITE_ANIMATIONS) {
    const animFrameKeys: string[] = [];
    for (let col = 0; col < anim.frameCount; col++) {
      const key = `${champion.id}_${anim.engineKey}_${String(col).padStart(2, '0')}.png`;
      animFrameKeys.push(key);
      frames[key] = {
        frame: {
          x: col * frameSize,
          y: anim.row * frameSize,
          w: frameSize,
          h: frameSize,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: {x: 0, y: 0, w: frameSize, h: frameSize},
        sourceSize: {w: frameSize, h: frameSize},
        pivot: SPRITE_PIVOT,
      };
    }
    animations[anim.engineKey] = animFrameKeys;
  }

  return {
    frames,
    animations,
    meta: {
      app: 'Chitin & Runes Sprite Studio',
      version: '3.0',
      image: `${champion.id}_spritesheet.png`,
      format: 'RGBA8888',
      size: {w: SPRITE_COLS * frameSize, h: SPRITE_ROWS * frameSize},
      scale: '1',
      champion: {
        id: champion.id,
        name: champion.name,
        title: champion.title,
        insectType: champion.insectType,
        role: champion.role,
      },
      animationSpecs: SPRITE_ANIMATIONS.map((a) => ({
        name: a.engineKey,
        row: a.row,
        frameCount: a.frameCount,
        fps: a.defaultFps,
        loop: a.loop,
      })),
    },
  };
}

export function buildUnityGodotManifestJson(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
) {
  return {
    championId: champion.id,
    displayName: `${champion.name} — ${champion.title}`,
    textureFile: `${champion.id}_spritesheet.png`,
    textureWidth: SPRITE_COLS * frameSize,
    textureHeight: SPRITE_ROWS * frameSize,
    cellSize: {width: frameSize, height: frameSize},
    columns: SPRITE_COLS,
    rows: SPRITE_ROWS,
    pivotNormalized: SPRITE_PIVOT,
    pixelsPerUnit: frameSize === 256 ? 128 : 64,
    clips: SPRITE_ANIMATIONS.map((anim) => ({
      name: anim.engineKey,
      rowIndex: anim.row,
      startFrame: anim.row * SPRITE_COLS,
      endFrame: anim.row * SPRITE_COLS + anim.frameCount - 1,
      fps: anim.defaultFps,
      loop: anim.loop,
    })),
  };
}

function canvasToPngUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG encoding failed'));
        return;
      }
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
    }, 'image/png');
  });
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntryInput {
  filename: string;
  data: Uint8Array;
}

export function buildZipBlob(entries: ZipEntryInput[]): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.filename);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRecord] as BlobPart[], {
    type: 'application/zip',
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadChampionSpriteSheetPng(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
  threshold = 232,
) {
  const processed = await processChampionSpriteSheet(champion, frameSize, threshold);
  const pngBytes = await canvasToPngUint8Array(processed.sheetCanvas);
  triggerDownload(
    new Blob([pngBytes as BlobPart], {type: 'image/png'}),
    `${champion.id}_spritesheet_12x5_${frameSize}px.png`,
  );
}

export function downloadChampionAtlasJson(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
) {
  const atlas = buildPhaserPixiAtlasJson(champion, frameSize);
  const jsonBytes = new TextEncoder().encode(JSON.stringify(atlas, null, 2));
  triggerDownload(
    new Blob([jsonBytes], {type: 'application/json'}),
    `${champion.id}_atlas_12x5_${frameSize}px.json`,
  );
}

async function createChampionEntries(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
  threshold: number,
  prefixDir = '',
): Promise<ZipEntryInput[]> {
  const encoder = new TextEncoder();
  const processed = await processChampionSpriteSheet(champion, frameSize, threshold);
  const pngBytes = await canvasToPngUint8Array(processed.sheetCanvas);
  const phaserJson = encoder.encode(
    JSON.stringify(buildPhaserPixiAtlasJson(champion, frameSize), null, 2),
  );
  const unityGodotJson = encoder.encode(
    JSON.stringify(buildUnityGodotManifestJson(champion, frameSize), null, 2),
  );

  const readme = encoder.encode(
    [
      `${champion.name} — ${champion.title} (${champion.insectType})`,
      `============================================================`,
      `Sprite Sheet: ${champion.id}_spritesheet.png`,
      `Grid: ${SPRITE_COLS} columns x ${SPRITE_ROWS} rows (60 progressive painterly frames)`,
      `Cell Size: ${frameSize} x ${frameSize} px (RGBA8888 transparent)`,
      `Normalized Pivot: x=${SPRITE_PIVOT.x}, y=${SPRITE_PIVOT.y}`,
      ``,
      `Row Order (12 frames per animation):`,
      ...SPRITE_ANIMATIONS.map(
        (a) =>
          `  Row ${a.row}: ${a.engineKey} (${a.frameCount} frames, ${a.defaultFps} FPS, loop=${a.loop})`,
      ),
      ``,
      `Included Files:`,
      `- ${champion.id}_spritesheet.png : Transparent RGBA sprite sheet`,
      `- ${champion.id}_atlas_phaser_pixi.json : TexturePacker JSON Hash for Phaser 3 / PixiJS`,
      `- ${champion.id}_manifest_unity_godot.json : Slice grid & clip timing for Unity / Godot`,
    ].join('\n'),
  );

  return [
    {filename: `${prefixDir}${champion.id}_spritesheet.png`, data: pngBytes},
    {filename: `${prefixDir}${champion.id}_atlas_phaser_pixi.json`, data: phaserJson},
    {filename: `${prefixDir}${champion.id}_manifest_unity_godot.json`, data: unityGodotJson},
    {filename: `${prefixDir}README.txt`, data: readme},
  ];
}

export async function downloadChampionPackZip(
  champion: InsectChampion,
  frameSize: FrameSizeOption,
  threshold = 232,
) {
  const entries = await createChampionEntries(champion, frameSize, threshold);
  const zipBlob = buildZipBlob(entries);
  triggerDownload(zipBlob, `${champion.id}_sprite_pack_12x5_${frameSize}px.zip`);
}

export async function downloadAllChampionsZip(
  champions: InsectChampion[],
  frameSize: FrameSizeOption,
  threshold = 232,
  onProgress?: (current: number, total: number) => void,
) {
  const allEntries: ZipEntryInput[] = [];
  for (let i = 0; i < champions.length; i++) {
    const champ = champions[i];
    onProgress?.(i + 1, champions.length);
    await new Promise((r) => setTimeout(r, 15));
    const entries = await createChampionEntries(
      champ,
      frameSize,
      threshold,
      `${champ.index}_${champ.id}/`,
    );
    allEntries.push(...entries);
  }
  const zipBlob = buildZipBlob(allEntries);
  triggerDownload(zipBlob, `chitin_and_runes_10_spritesheets_12x5_${frameSize}px.zip`);
}
