import React, {useEffect, useRef, useState} from 'react';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Download,
  FileJson,
  FlipHorizontal,
  Pause,
  Play,
} from 'lucide-react';
import {InsectChampion} from '../data/champions';
import {
  ProcessedSpriteSheet,
  processChampionSpriteSheet,
} from '../sprites/sheetProcessor';
import {
  downloadAllChampionsZip,
  downloadChampionAtlasJson,
  downloadChampionPackZip,
  downloadChampionSpriteSheetPng,
} from '../sprites/atlasExporter';
import {
  FrameSizeOption,
  SPRITE_ANIMATIONS,
  SPRITE_COLS,
  SPRITE_PIVOT,
  SPRITE_ROWS,
  SpriteAnimationId,
} from '../sprites/types';

interface SpriteSheetStudioProps {
  champions: InsectChampion[];
  activeChampion: InsectChampion;
  onSelectActive: (champion: InsectChampion) => void;
}

type BackdropMode = 'checker' | 'dark' | 'light';

export function SpriteSheetStudio({
  champions,
  activeChampion,
  onSelectActive,
}: SpriteSheetStudioProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);

  const [processedSheet, setProcessedSheet] =
    useState<ProcessedSpriteSheet | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [animId, setAnimId] = useState<SpriteAnimationId>('idle');
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  const [flipX, setFlipX] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [backdrop, setBackdrop] = useState<BackdropMode>('checker');
  const [frameSize, setFrameSize] = useState<FrameSizeOption>(256);
  const [alphaThreshold, setAlphaThreshold] = useState(234);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  const activeAnimSpec =
    SPRITE_ANIMATIONS.find((a) => a.id === animId) ?? SPRITE_ANIMATIONS[0];

  // Process painterly sprite sheet into 12-frame progressive RGBA sequences
  useEffect(() => {
    let cancelled = false;
    setIsProcessing(true);
    processChampionSpriteSheet(activeChampion, frameSize, alphaThreshold)
      .then((sheet) => {
        if (!cancelled) {
          setProcessedSheet(sheet);
          setIsProcessing(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsProcessing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeChampion, frameSize, alphaThreshold]);

  const handleSelectAnim = (id: SpriteAnimationId) => {
    const spec = SPRITE_ANIMATIONS.find((a) => a.id === id);
    setAnimId(id);
    setFrameIndex(0);
    if (spec) setFps(spec.defaultFps);
    setIsPlaying(true);
  };

  // Playback loop across 12 frames
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(35, Math.round(1000 / fps));
    const timer = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % activeAnimSpec.frameCount);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, fps, activeAnimSpec.frameCount]);

  // Draw live preview frame from processed painterly canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !processedSheet) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = processedSheet.frameSize;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const frameCanvas = processedSheet.frames[activeAnimSpec.row]?.[frameIndex];
    if (frameCanvas) {
      ctx.save();
      if (flipX) {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(frameCanvas, 0, 0, size, size);
      ctx.restore();
    }

    if (showDebug) {
      const pivotX = size * SPRITE_PIVOT.x;
      const pivotY = size * SPRITE_PIVOT.y;
      ctx.save();
      ctx.strokeStyle = 'rgba(217, 164, 65, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

      const hbW = size * 0.44;
      const hbH = size * 0.72;
      ctx.strokeStyle = 'rgba(110, 200, 181, 0.75)';
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(pivotX - hbW / 2, pivotY - hbH, hbW, hbH);
      ctx.setLineDash([]);

      ctx.strokeStyle = '#D9A441';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX - 9, pivotY);
      ctx.lineTo(pivotX + 9, pivotY);
      ctx.moveTo(pivotX, pivotY - 9);
      ctx.lineTo(pivotX, pivotY + 9);
      ctx.stroke();
      ctx.restore();
    }
  }, [processedSheet, activeAnimSpec.row, frameIndex, flipX, showDebug]);

  // Draw full 12x5 (60 frames) transparent RGBA atlas preview
  useEffect(() => {
    const canvas = sheetCanvasRef.current;
    if (!canvas || !processedSheet) return;
    const sheet = processedSheet.sheetCanvas;
    canvas.width = sheet.width;
    canvas.height = sheet.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sheet, 0, 0);

    const cellSize = processedSheet.frameSize;
    if (showDebug) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      for (let c = 1; c < SPRITE_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, canvas.height);
        ctx.stroke();
      }
      for (let r = 1; r < SPRITE_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(canvas.width, r * cellSize);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Highlight active cell
    ctx.save();
    ctx.strokeStyle = '#D9A441';
    ctx.lineWidth = Math.max(4, Math.round(cellSize * 0.025));
    ctx.strokeRect(
      frameIndex * cellSize + 2,
      activeAnimSpec.row * cellSize + 2,
      cellSize - 4,
      cellSize - 4,
    );
    ctx.restore();
  }, [processedSheet, frameIndex, activeAnimSpec.row, showDebug]);

  const handleAtlasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const col = Math.max(
      0,
      Math.min(SPRITE_COLS - 1, Math.floor(relX * SPRITE_COLS)),
    );
    const row = Math.max(
      0,
      Math.min(SPRITE_ROWS - 1, Math.floor(relY * SPRITE_ROWS)),
    );
    const targetAnim = SPRITE_ANIMATIONS[row];
    if (targetAnim) {
      setAnimId(targetAnim.id);
      setFps(targetAnim.defaultFps);
      setFrameIndex(col);
      setIsPlaying(false);
    }
  };

  const handleBatchExport = async () => {
    if (batchProgress) return;
    setBatchProgress(`0 / ${champions.length}`);
    try {
      await downloadAllChampionsZip(
        champions,
        frameSize,
        alphaThreshold,
        (cur, total) => {
          setBatchProgress(`${cur} / ${total}`);
        },
      );
    } finally {
      setBatchProgress(null);
    }
  };

  const backdropStyle: React.CSSProperties =
    backdrop === 'checker'
      ? {
          backgroundColor: '#12151D',
          backgroundImage:
            'linear-gradient(45deg, rgba(255,255,255,0.045) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.045) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.045) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.045) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }
      : backdrop === 'light'
        ? {backgroundColor: '#EAECEF'}
        : {backgroundColor: '#0A0B0F'};

  const sheetWidthPx = SPRITE_COLS * frameSize;
  const sheetHeightPx = SPRITE_ROWS * frameSize;

  return (
    <section
      id="spritesheets"
      className="border-t border-white/10 pt-14"
      aria-labelledby="spritesheet-section-title"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium text-[#D9A441]">
            Cel-Shading 2D · 12 Images / Mouvement · 60 Frames RGBA
          </p>
          <h2
            id="spritesheet-section-title"
            className="font-display mt-1 text-3xl font-semibold tracking-tight text-[#F3F1EC] sm:text-4xl"
          >
            Studio Sprite Sheets &amp; Animations
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9DA3B0]">
            Chaque animation progresse sur 12 images nettes issues des sprites 2D
            cel-shading, détourées en transparence RGBA et verrouillées sur le
            centre du corps et le point de pivot pour Phaser, PixiJS, Unity et
            Godot.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBatchExport}
          disabled={Boolean(batchProgress)}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[#D9A441] px-4 py-2.5 text-xs font-semibold text-[#090A0D] transition-colors hover:bg-[#E4B458] disabled:opacity-60 whitespace-nowrap shrink-0 lg:self-end focus-visible:outline-2 focus-visible:outline-white"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          <span>
            {batchProgress
              ? `Préparation ${batchProgress}…`
              : 'Exporter les 10 sprite sheets (.ZIP)'}
          </span>
        </button>
      </div>

      {/* Champion Strip Selector */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
        {champions.map((champ) => {
          const isActive = champ.id === activeChampion.id;
          return (
            <button
              key={champ.id}
              type="button"
              onClick={() => {
                onSelectActive(champ);
                setFrameIndex(0);
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                isActive
                  ? 'border-[#D9A441] bg-[#161922] text-[#F3F1EC]'
                  : 'border-white/10 bg-[#101218] text-[#9DA3B0] hover:border-white/25 hover:text-[#F3F1EC]'
              }`}
            >
              <span className="font-mono-tabular text-[11px] text-[#D9A441]">
                {champ.index}
              </span>
              <span className="text-xs font-semibold">{champ.name}</span>
              <span className="text-[11px] text-[#737988]">
                · {champ.insectType.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Split */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Live Animated Previewer + Transport Controls */}
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#12141B] p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#F3F1EC]">
                  {activeChampion.name}
                </h3>
                <p className="text-xs text-[#9DA3B0]">
                  {activeChampion.insectType} · {activeAnimSpec.label}
                </p>
              </div>
              <span className="font-mono-tabular text-xs font-medium text-[#D9A441]">
                Image {String(frameIndex + 1).padStart(2, '0')} /{' '}
                {String(activeAnimSpec.frameCount).padStart(2, '0')}
              </span>
            </div>

            {/* Viewport */}
            <div
              style={backdropStyle}
              className="relative mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-white/10"
            >
              {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090A0D]/75 text-xs text-[#D6D3CB]">
                  Calcul des 60 images progressives…
                </div>
              )}
              <canvas
                ref={previewCanvasRef}
                width={frameSize}
                height={frameSize}
                className="h-full w-full max-h-[340px] max-w-[340px] object-contain"
              />
            </div>

            {/* 12-frame scrubber dots */}
            <div className="mt-3 grid grid-cols-12 gap-1" role="group" aria-label="Progression des 12 images">
              {Array.from({length: activeAnimSpec.frameCount}, (_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setFrameIndex(idx);
                  }}
                  aria-label={`Aller à l'image ${idx + 1}`}
                  className={`h-2 rounded-sm transition-colors ${
                    idx === frameIndex
                      ? 'bg-[#D9A441]'
                      : 'bg-white/12 hover:bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Backdrop & Overlay Toggles */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-[#0D0F14] p-0.5">
                {(['checker', 'dark', 'light'] as BackdropMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBackdrop(mode)}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      backdrop === mode
                        ? 'bg-white/15 text-[#F3F1EC]'
                        : 'text-[#8E95A5] hover:text-[#F3F1EC]'
                    }`}
                  >
                    {mode === 'checker'
                      ? 'Alpha'
                      : mode === 'dark'
                        ? 'Sombre'
                        : 'Clair'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFlipX((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    flipX
                      ? 'border-[#D9A441] bg-[#D9A441]/15 text-[#D9A441]'
                      : 'border-white/10 text-[#9DA3B0] hover:text-white'
                  }`}
                >
                  <FlipHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Miroir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDebug((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    showDebug
                      ? 'border-[#D9A441] bg-[#D9A441]/15 text-[#D9A441]'
                      : 'border-white/10 text-[#9DA3B0] hover:text-white'
                  }`}
                >
                  <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pivot / Grille</span>
                </button>
              </div>
            </div>

            {/* Animation Selector */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-medium text-[#9DA3B0]">
                Mouvements de la planche (5 lignes × 12 images)
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {SPRITE_ANIMATIONS.map((anim) => {
                  const active = anim.id === animId;
                  return (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => handleSelectAnim(anim.id)}
                      className={`rounded-md border px-2.5 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap truncate focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                        active
                          ? 'border-[#D9A441] bg-[#D9A441]/15 text-[#F3F1EC]'
                          : 'border-white/10 bg-[#0E1016] text-[#A7ADBA] hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <span className="font-mono-tabular mr-1.5 text-[11px] text-[#D9A441]">
                        L{anim.row}
                      </span>
                      {anim.label.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-xs text-[#8E95A5]">
                {activeAnimSpec.description}
              </p>
            </div>
          </div>

          {/* Transport + FPS + Alpha Sensitivity Controls */}
          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setFrameIndex(
                      (prev) =>
                        (prev - 1 + activeAnimSpec.frameCount) %
                        activeAnimSpec.frameCount,
                    );
                  }}
                  aria-label="Image précédente"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-[#C7C9D1] hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white/12 px-3 text-xs font-semibold text-[#F3F1EC] hover:bg-white/18 whitespace-nowrap shrink-0"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Lecture</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setFrameIndex(
                      (prev) => (prev + 1) % activeAnimSpec.frameCount,
                    );
                  }}
                  aria-label="Image suivante"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-[#C7C9D1] hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#9DA3B0]">
                <span>Cadence</span>
                <input
                  type="range"
                  min={6}
                  max={24}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-20 accent-[#D9A441]"
                />
                <span className="font-mono-tabular w-12 text-right text-[#F3F1EC]">
                  {fps} FPS
                </span>
              </label>
            </div>

            <label className="flex items-center justify-between gap-3 text-xs text-[#9DA3B0]">
              <span>Seuil de détourage alpha</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={210}
                  max={246}
                  value={alphaThreshold}
                  onChange={(e) => setAlphaThreshold(Number(e.target.value))}
                  className="w-28 accent-[#D9A441]"
                />
                <span className="font-mono-tabular w-9 text-right text-[#F3F1EC]">
                  {alphaThreshold}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Right: Full 12x5 Painterly Atlas Grid + Engine Exports */}
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#12141B] p-5 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#F3F1EC]">
                  Planche complète — {SPRITE_COLS} × {SPRITE_ROWS} cellules (60
                  images progressives)
                </h3>
                <p className="mt-0.5 text-xs text-[#8E95A5]">
                  12 images par mouvement. Cliquez sur une cellule pour
                  l’inspecter dans le lecteur.
                </p>
              </div>

              {/* Resolution selector */}
              <div
                role="group"
                aria-label="Résolution d’export"
                className="flex items-center gap-1 rounded-md border border-white/10 bg-[#0D0F14] p-0.5"
              >
                {([128, 256] as FrameSizeOption[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFrameSize(sz)}
                    className={`font-mono-tabular rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      frameSize === sz
                        ? 'bg-[#D9A441] text-[#090A0D]'
                        : 'text-[#9DA3B0] hover:text-white'
                    }`}
                  >
                    {sz}×{sz} px
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive 12x5 Atlas Grid Canvas */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-[#0B0C10]">
              <div className="grid min-w-[680px] grid-cols-[72px_1fr]">
                {/* Row labels aligned with 5 rows */}
                <div className="grid grid-rows-5 border-r border-white/10 bg-[#0E1016]">
                  {SPRITE_ANIMATIONS.map((anim) => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => handleSelectAnim(anim.id)}
                      className={`font-mono-tabular flex items-center justify-end px-2.5 text-[11px] transition-colors ${
                        anim.id === animId
                          ? 'bg-[#D9A441]/15 font-semibold text-[#D9A441]'
                          : 'text-[#8E95A5] hover:text-white'
                      }`}
                    >
                      {anim.engineKey}
                    </button>
                  ))}
                </div>

                <div
                  style={backdropStyle}
                  className="relative flex items-center justify-center"
                >
                  <canvas
                    ref={sheetCanvasRef}
                    onClick={handleAtlasClick}
                    className="block h-auto w-full cursor-pointer"
                    aria-label={`Planche sprite 12x5 complète de ${activeChampion.name}`}
                  />
                </div>
              </div>
            </div>

            {/* Technical Engine Metadata */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs sm:grid-cols-4">
              <div>
                <p className="text-[#737988]">Dimensions PNG</p>
                <p className="font-mono-tabular mt-0.5 font-medium text-[#F3F1EC]">
                  {sheetWidthPx} × {sheetHeightPx} px
                </p>
              </div>
              <div>
                <p className="text-[#737988]">Cellule / Grille</p>
                <p className="font-mono-tabular mt-0.5 font-medium text-[#F3F1EC]">
                  {frameSize} px · 12 × 5
                </p>
              </div>
              <div>
                <p className="text-[#737988]">Point de pivot</p>
                <p className="font-mono-tabular mt-0.5 font-medium text-[#F3F1EC]">
                  (0.50, 0.88)
                </p>
              </div>
              <div>
                <p className="text-[#737988]">Compatibilité</p>
                <p className="mt-0.5 font-medium text-[#F3F1EC]">
                  Phaser · Pixi · Unity · Godot
                </p>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() =>
                downloadChampionSpriteSheetPng(
                  activeChampion,
                  frameSize,
                  alphaThreshold,
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2 text-xs font-semibold text-[#090A0D] transition-colors hover:bg-[#E4B458] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Télécharger PNG ({frameSize}px)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadChampionAtlasJson(activeChampion, frameSize)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 px-4 py-2 text-xs font-medium text-[#F3F1EC] transition-colors hover:bg-white/12 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Atlas JSON (Phaser / Pixi)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadChampionPackZip(
                  activeChampion,
                  frameSize,
                  alphaThreshold,
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 px-4 py-2 text-xs font-medium text-[#F3F1EC] transition-colors hover:bg-white/12 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pack Complet (.ZIP)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
