import {useEffect, useRef} from 'react';
import {InsectChampion} from '../data/champions';
import {
  ProcessedSpriteSheet,
  processChampionSpriteSheet,
} from '../sprites/sheetProcessor';
import {SPRITE_COLS} from '../sprites/types';

interface ChampionSpriteThumbProps {
  champion: InsectChampion;
  animate?: boolean;
  size?: number;
}

export function ChampionSpriteThumb({
  champion,
  animate = true,
  size = 96,
}: ChampionSpriteThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<ProcessedSpriteSheet | null>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let frameIdx = 0;
    let lastStep = performance.now();

    const drawFrame = () => {
      const canvas = canvasRef.current;
      const sheet = sheetRef.current;
      if (!canvas || !sheet) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const frame = sheet.frames[0]?.[frameIdx % SPRITE_COLS];
      if (frame) {
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      }
    };

    const tick = (now: number) => {
      if (cancelled) return;
      if (animate && now - lastStep >= 115) {
        lastStep = now;
        frameIdx = (frameIdx + 1) % SPRITE_COLS;
        drawFrame();
      }
      if (animate) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    processChampionSpriteSheet(champion, 128, 234)
      .then((sheet) => {
        if (cancelled) return;
        sheetRef.current = sheet;
        drawFrame();
        if (animate) {
          rafId = window.requestAnimationFrame(tick);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [champion, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="h-full w-full object-contain"
      aria-hidden="true"
    />
  );
}
