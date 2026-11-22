import {Maximize2} from 'lucide-react';
import {InsectChampion} from '../data/champions';
import {ChampionImage} from './ChampionImage';

interface ChampionGridProps {
  champions: InsectChampion[];
  onSelectChampion: (champion: InsectChampion) => void;
}

export function ChampionGrid({champions, onSelectChampion}: ChampionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {champions.map((champ, idx) => {
        const isLeadFeature = idx === 0 && champions.length >= 4;
        return (
          <article
            key={champ.id}
            className={`group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12141B] transition-colors duration-150 hover:border-[#D9A441]/60 ${
              isLeadFeature ? 'md:col-span-2' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectChampion(champ)}
              className="flex h-full flex-col text-left focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <div
                className={`relative w-full overflow-hidden ${
                  isLeadFeature ? 'aspect-[16/8.5]' : 'aspect-video'
                }`}
              >
                <ChampionImage
                  src={champ.imagePath}
                  alt={`${champ.name}, ${champ.title} (${champ.insectType})`}
                  title={champ.name}
                  accentHex={champ.accentHex}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded bg-black/75 px-2.5 py-1 text-xs font-medium text-[#F3F1EC] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Voir la fiche</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8E95A5]">
                    <span className="font-mono-tabular text-[#D9A441]">{champ.index}</span>
                    <span aria-hidden="true">·</span>
                    <span>{champ.insectType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{champ.role}</span>
                  </div>
                  <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[#F3F1EC]">
                    {champ.name} — {champ.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#A7ADBA]">
                    {champ.lore}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-[#8E95A5]">
                  <span>{champ.region}</span>
                  <span>{champ.artStyle}</span>
                </div>
              </div>
            </button>
          </article>
        );
      })}
    </div>
  );
}
