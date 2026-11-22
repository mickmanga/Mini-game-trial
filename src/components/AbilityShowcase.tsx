import {InsectChampion} from '../data/champions';
import {ChampionImage} from './ChampionImage';

interface AbilityShowcaseProps {
  champions: InsectChampion[];
  activeChampion: InsectChampion;
  onSelectActive: (champion: InsectChampion) => void;
  onOpenModal: (champion: InsectChampion) => void;
}

export function AbilityShowcase({
  champions,
  activeChampion,
  onSelectActive,
  onOpenModal,
}: AbilityShowcaseProps) {
  return (
    <section
      id="competences"
      className="border-t border-white/10 pt-14"
      aria-labelledby="abilities-section-title"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium text-[#D9A441]">
            Anatomie &amp; Compétences
          </p>
          <h2
            id="abilities-section-title"
            className="font-display mt-1 text-3xl font-semibold tracking-tight text-[#F3F1EC] sm:text-4xl"
          >
            Architecture tactique des 10 insectes
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#9DA3B0]">
          Sélectionnez un concept ci-dessous pour examiner son kit complet
          (Passif, A, Z, E, R) et la biomécanique qui inspire ses mécaniques de jeu.
        </p>
      </div>

      {/* Horizontal Champion Picker */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
        {champions.map((champ) => {
          const isActive = champ.id === activeChampion.id;
          return (
            <button
              key={champ.id}
              type="button"
              onClick={() => onSelectActive(champ)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                isActive
                  ? 'border-[#D9A441] bg-[#161922] text-[#F3F1EC]'
                  : 'border-white/10 bg-[#101218] text-[#9DA3B0] hover:border-white/25 hover:text-[#F3F1EC]'
              }`}
            >
              <span className="font-mono-tabular text-[11px] text-[#D9A441]">
                {champ.index}
              </span>
              <span className="text-xs font-semibold">{champ.name}</span>
              <span className="text-[11px] text-[#737988]">· {champ.role}</span>
            </button>
          );
        })}
      </div>

      {/* Active Champion Deep Breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Spotlight Card */}
        <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#12141B] lg:col-span-5">
          <div>
            <button
              type="button"
              onClick={() => onOpenModal(activeChampion)}
              className="group relative block aspect-video w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-[#D9A441]"
            >
              <ChampionImage
                src={activeChampion.imagePath}
                alt={`${activeChampion.name}, ${activeChampion.title}`}
                title={activeChampion.name}
                accentHex={activeChampion.accentHex}
                className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-[#9DA3B0]">
                <span className="text-[#D9A441] font-medium">
                  {activeChampion.role}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeChampion.insectType}</span>
                <span aria-hidden="true">·</span>
                <span>{activeChampion.region}</span>
              </div>
              <h3 className="font-display mt-2 text-2xl font-semibold text-[#F3F1EC]">
                {activeChampion.name} — {activeChampion.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#A7ADBA]">
                {activeChampion.lore}
              </p>
              <div className="mt-5 border-t border-white/8 pt-4">
                <p className="text-xs font-semibold text-[#9DA3B0]">
                  Inspiration biologique ({activeChampion.scientificInspo})
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#D6D3CB]">
                  {activeChampion.biomechanics}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 px-6 py-4">
            <button
              type="button"
              onClick={() => onOpenModal(activeChampion)}
              className="rounded-lg bg-[#D9A441] px-4 py-2 text-xs font-semibold text-[#090A0D] transition-colors hover:bg-[#E4B458] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
            >
              Ouvrir en plein écran
            </button>
          </div>
        </div>

        {/* Right: 5-Ability Specification List */}
        <div className="flex flex-col divide-y divide-white/8 overflow-hidden rounded-xl border border-white/10 bg-[#12141B] lg:col-span-7">
          {activeChampion.abilities.map((ability) => (
            <div
              key={ability.key}
              className="flex flex-col justify-center gap-1.5 p-5 sm:flex-row sm:items-start sm:gap-5"
            >
              <div className="flex items-center gap-3 sm:w-20 sm:shrink-0">
                <span className="flex h-8 min-w-[44px] items-center justify-center rounded-md border border-[#D9A441]/35 bg-[#D9A441]/10 px-2 text-xs font-semibold text-[#D9A441]">
                  {ability.key}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#F3F1EC]">
                    {ability.name}
                  </h4>
                  <div className="font-mono-tabular flex items-center gap-2 text-xs text-[#8E95A5]">
                    <span>Délai : {ability.cooldown}</span>
                    <span aria-hidden="true">·</span>
                    <span>Coût : {ability.cost}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#A7ADBA]">
                  {ability.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
