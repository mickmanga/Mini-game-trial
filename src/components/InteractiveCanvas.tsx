import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Maximize2, Minus, Plus, RotateCcw, LayoutGrid} from 'lucide-react';
import {InsectChampion} from '../data/champions';
import {ChampionImage} from './ChampionImage';

interface InteractiveCanvasProps {
  champions: InsectChampion[];
  selectedId: string | null;
  onSelectChampion: (champion: InsectChampion) => void;
}

const CARD_WIDTH = 350;
const WORLD_WIDTH = 2070;
const WORLD_HEIGHT = 800;

export function InteractiveCanvas({
  champions,
  selectedId,
  onSelectChampion,
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState<Record<string, {x: number; y: number}>>(
    () => {
      const initial: Record<string, {x: number; y: number}> = {};
      for (const champ of champions) {
        initial[champ.id] = champ.defaultPosition;
      }
      return initial;
    },
  );

  const [viewport, setViewport] = useState({x: 32, y: 28, scale: 0.65});
  const [isPanning, setIsPanning] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  const panStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const cardDragRef = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const fitCanvasToViewport = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padX = 48;
    const padY = 48;
    const scaleX = (rect.width - padX) / WORLD_WIDTH;
    const scaleY = (rect.height - padY) / WORLD_HEIGHT;
    const nextScale = Math.max(0.28, Math.min(1.0, Math.min(scaleX, scaleY)));
    const offsetX = Math.max(20, (rect.width - WORLD_WIDTH * nextScale) / 2);
    const offsetY = Math.max(20, (rect.height - WORLD_HEIGHT * nextScale) / 2);
    setViewport({x: offsetX, y: offsetY, scale: Number(nextScale.toFixed(2))});
  }, []);

  useEffect(() => {
    fitCanvasToViewport();
    const handleResize = () => fitCanvasToViewport();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitCanvasToViewport]);

  const handleResetPositions = () => {
    const reset: Record<string, {x: number; y: number}> = {};
    champions.forEach((champ, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      reset[champ.id] = {
        x: 80 + col * 390,
        y: 80 + row * 350,
      };
    });
    setPositions((prev) => ({...prev, ...reset}));
    fitCanvasToViewport();
  };

  const handleZoom = (delta: number) => {
    setViewport((prev) => {
      const nextScale = Math.max(0.25, Math.min(1.75, Number((prev.scale + delta).toFixed(2))));
      return {...prev, scale: nextScale};
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 0.08 : -0.08;
      setViewport((prev) => {
        const nextScale = Math.max(0.25, Math.min(1.75, Number((prev.scale + factor).toFixed(2))));
        return {...prev, scale: nextScale};
      });
    }
  };

  const handleBackgroundPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-champion-card]')) return;
    if ((e.target as HTMLElement).closest('[data-canvas-controls]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  };

  const handleCardPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    champion: InsectChampion,
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = positions[champion.id] ?? champion.defaultPosition;
    setDraggingCardId(champion.id);
    cardDragRef.current = {
      id: champion.id,
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cardDragRef.current) {
      const dx = e.clientX - cardDragRef.current.pointerX;
      const dy = e.clientY - cardDragRef.current.pointerY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        cardDragRef.current.moved = true;
      }
      const worldDx = dx / viewport.scale;
      const worldDy = dy / viewport.scale;
      const id = cardDragRef.current.id;
      const originX = cardDragRef.current.originX;
      const originY = cardDragRef.current.originY;
      setPositions((prev) => ({
        ...prev,
        [id]: {
          x: Math.round(originX + worldDx),
          y: Math.round(originY + worldDy),
        },
      }));
      return;
    }

    if (panStartRef.current) {
      const dx = e.clientX - panStartRef.current.pointerX;
      const dy = e.clientY - panStartRef.current.pointerY;
      setViewport((prev) => ({
        ...prev,
        x: panStartRef.current!.originX + dx,
        y: panStartRef.current!.originY + dy,
      }));
    }
  };

  const handlePointerUp = (champion?: InsectChampion) => {
    if (cardDragRef.current) {
      const wasClick = !cardDragRef.current.moved;
      const targetChamp = champion ?? champions.find((c) => c.id === cardDragRef.current?.id);
      cardDragRef.current = null;
      setDraggingCardId(null);
      if (wasClick && targetChamp) {
        onSelectChampion(targetChamp);
      }
      return;
    }

    if (panStartRef.current) {
      panStartRef.current = null;
      setIsPanning(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => handlePointerUp()}
      onPointerCancel={() => handlePointerUp()}
      className={`canvas-grid-bg relative h-[640px] w-full overflow-hidden rounded-xl border border-white/10 select-none touch-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      role="region"
      aria-label="Canvas interactif des 10 champions insectoïdes"
    >
      {/* Transformed world surface */}
      <div
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
        }}
      >
        {champions.map((champ) => {
          const pos = positions[champ.id] ?? champ.defaultPosition;
          const isSelected = selectedId === champ.id;
          const isDragging = draggingCardId === champ.id;

          return (
            <div
              key={champ.id}
              data-champion-card
              onPointerDown={(e) => handleCardPointerDown(e, champ)}
              onPointerUp={(e) => {
                e.stopPropagation();
                handlePointerUp(champ);
              }}
              style={{
                width: `${CARD_WIDTH}px`,
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              }}
              className={`group absolute top-0 left-0 rounded-lg border bg-[#12141B] transition-shadow duration-150 ${
                isDragging
                  ? 'z-30 cursor-grabbing border-[#D9A441] shadow-2xl'
                  : isSelected
                    ? 'z-20 cursor-pointer border-[#D9A441] shadow-xl'
                    : 'z-10 cursor-pointer border-white/12 hover:border-white/30'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-t-[7px]">
                <ChampionImage
                  src={champ.imagePath}
                  alt={`${champ.name}, ${champ.title} (${champ.insectType})`}
                  title={champ.name}
                  accentHex={champ.accentHex}
                  className="h-full w-full transition-transform duration-200 group-hover:scale-[1.03]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
                  aria-hidden="true"
                />
                <span className="font-mono-tabular absolute top-2.5 left-3 text-[11px] font-medium text-[#E8E4DC]/90">
                  {champ.index}
                </span>
                <span className="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-[#F3F1EC] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  Inspecter
                </span>
              </div>

              <div className="p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-[#F3F1EC] truncate">
                    {champ.name}
                  </h3>
                  <span className="text-xs font-medium text-[#D9A441] whitespace-nowrap shrink-0">
                    {champ.role}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#C7C9D1] truncate">
                  {champ.title}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#8E95A5] truncate">
                  <span>{champ.insectType}</span>
                  <span aria-hidden="true">·</span>
                  <span>{champ.region}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom-left subtle canvas guidance */}
      <div
        data-canvas-controls
        className="pointer-events-none absolute bottom-4 left-4 hidden sm:flex items-center gap-3 rounded-lg border border-white/10 bg-[#0D0F14]/90 px-3 py-2 text-xs text-[#9DA3B0] backdrop-blur-sm"
      >
        <span>Glisser le fond pour naviguer</span>
        <span aria-hidden="true">·</span>
        <span>Déplacer les planches</span>
        <span aria-hidden="true">·</span>
        <span>Cliquer pour ouvrir le kit</span>
      </div>

      {/* Bottom-right zoom & layout toolbar */}
      <div
        data-canvas-controls
        className="absolute right-4 bottom-4 flex items-center gap-1 rounded-lg border border-white/10 bg-[#0D0F14]/95 p-1 backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          aria-label="Dézoomer le canvas"
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D9A441]"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="font-mono-tabular min-w-[52px] text-center text-xs font-medium text-[#F3F1EC]">
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          aria-label="Zoomer le canvas"
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D9A441]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
        <button
          type="button"
          onClick={fitCanvasToViewport}
          className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Ajuster</span>
        </button>
        <button
          type="button"
          onClick={handleResetPositions}
          className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441]"
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Aligner</span>
        </button>
      </div>
    </div>
  );
}
