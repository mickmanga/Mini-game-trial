import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import {InsectChampion} from '../data/champions';
import {ChampionImage} from './ChampionImage';

interface ChampionModalProps {
  champion: InsectChampion | null;
  champions: InsectChampion[];
  onClose: () => void;
  onSelectChampion: (champion: InsectChampion) => void;
  onOpenSpriteSheet?: (champion: InsectChampion) => void;
}

export function ChampionModal({
  champion,
  champions,
  onClose,
  onSelectChampion,
  onOpenSpriteSheet,
}: ChampionModalProps) {
  const [activeAbilityIdx, setActiveAbilityIdx] = useState(0);

  useEffect(() => {
    setActiveAbilityIdx(0);
  }, [champion?.id]);

  useEffect(() => {
    if (!champion) return;
    const currentIndex = champions.findIndex((c) => c.id === champion.id);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && currentIndex >= 0) {
        const next = champions[(currentIndex + 1) % champions.length];
        onSelectChampion(next);
      } else if (e.key === 'ArrowLeft' && currentIndex >= 0) {
        const prev =
          champions[(currentIndex - 1 + champions.length) % champions.length];
        onSelectChampion(prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [champion, champions, onClose, onSelectChampion]);

  if (!champion) return null;

  const currentIndex = champions.findIndex((c) => c.id === champion.id);
  const prevChampion =
    champions[(currentIndex - 1 + champions.length) % champions.length];
  const nextChampion = champions[(currentIndex + 1) % champions.length];
  const activeAbility = champion.abilities[activeAbilityIdx] ?? champion.abilities[0];

  const statItems = [
    {label: 'Offense', value: champion.stats.offense},
    {label: 'Défense', value: champion.stats.defense},
    {label: 'Contrôle', value: champion.stats.control},
    {label: 'Mobilité', value: champion.stats.mobility},
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="champion-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/12 bg-[#0E1016] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3 text-xs text-[#9DA3B0]">
            <span className="font-mono-tabular text-[#D9A441]">
              {champion.index} / {String(champions.length).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{champion.insectType}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate italic text-[#8E95A5]">
              {champion.scientificInspo}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectChampion(prevChampion)}
              aria-label="Champion précédent"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onSelectChampion(nextChampion)}
              aria-label="Champion suivant"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#C7C9D1] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="grid grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left: Full Splash Artwork */}
          <div className="flex flex-col border-b border-white/10 bg-[#090A0D] lg:col-span-7 lg:border-r lg:border-b-0">
            <div className="relative aspect-video w-full">
              <ChampionImage
                src={champion.imagePath}
                alt={`${champion.name}, ${champion.title}`}
                title={champion.name}
                accentHex={champion.accentHex}
                className="h-full w-full"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 px-6 py-4 text-xs text-[#9DA3B0]">
              <div>
                <span className="text-[#737988]">Direction artistique : </span>
                <span className="text-[#E8E4DC]">{champion.artStyle}</span>
              </div>
              <div>
                <span className="text-[#737988]">Région : </span>
                <span className="text-[#E8E4DC]">{champion.region}</span>
              </div>
            </div>

            {onOpenSpriteSheet && (
              <div className="flex items-center justify-between gap-4 border-t border-white/8 px-6 py-4">
                <span className="text-xs text-[#9DA3B0]">
                  Sprite sheet 2D peinte (5 mouvements × 12 images · 60 frames RGBA)
                </span>
                <button
                  type="button"
                  onClick={() => onOpenSpriteSheet(champion)}
                  className="rounded-lg bg-[#D9A441] px-4 py-2 text-xs font-semibold text-[#090A0D] transition-colors hover:bg-[#E4B458] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
                >
                  Ouvrir la Sprite Sheet
                </button>
              </div>
            )}
          </div>

          {/* Right: Lore, Biomechanics, Stats & Ability Kit */}
          <div className="flex flex-col gap-6 p-6 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#D9A441]">
                <span>{champion.role}</span>
                <span aria-hidden="true">·</span>
                <span>{champion.lane}</span>
              </div>
              <h2
                id="champion-modal-title"
                className="font-display mt-1 text-3xl font-semibold tracking-tight text-[#F3F1EC]"
              >
                {champion.name} — {champion.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#B5BAC7]">
                {champion.lore}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-xs font-semibold tracking-wide text-[#9DA3B0]">
                Biomécanique de l’insecte
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#D6D3CB]">
                {champion.biomechanics}
              </p>
            </div>

            {/* Combat Profile */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-xs font-semibold tracking-wide text-[#9DA3B0]">
                Profil tactique
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
                {statItems.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A7ADBA]">{stat.label}</span>
                      <span className="font-mono-tabular text-[#F3F1EC]">
                        {stat.value}/10
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
                      <div
                        className="h-full bg-[#D9A441]"
                        style={{width: `${stat.value * 10}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Ability Tabs */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-xs font-semibold tracking-wide text-[#9DA3B0]">
                Compétences du champion
              </h3>
              <div className="mt-3 flex items-center gap-1.5">
                {champion.abilities.map((ability, idx) => {
                  const isActive = idx === activeAbilityIdx;
                  return (
                    <button
                      key={ability.key}
                      type="button"
                      onClick={() => setActiveAbilityIdx(idx)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                        isActive
                          ? 'bg-[#D9A441] text-[#090A0D]'
                          : 'bg-white/6 text-[#C7C9D1] hover:bg-white/12 hover:text-white'
                      }`}
                    >
                      {ability.key}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-[#141720] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[#F3F1EC]">
                    {activeAbility.key} — {activeAbility.name}
                  </span>
                  <div className="font-mono-tabular flex items-center gap-2 text-[11px] text-[#9DA3B0]">
                    <span>{activeAbility.cooldown}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeAbility.cost}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#B5BAC7]">
                  {activeAbility.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
