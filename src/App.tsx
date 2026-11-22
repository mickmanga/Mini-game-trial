import {useMemo, useState} from 'react';
import {Download, Grid, Layers} from 'lucide-react';
import {CHAMPIONS, ChampionRole, InsectChampion} from './data/champions';
import {GameArena} from './components/GameArena';
import {InteractiveCanvas} from './components/InteractiveCanvas';
import {ChampionGrid} from './components/ChampionGrid';
import {ChampionModal} from './components/ChampionModal';
import {AbilityShowcase} from './components/AbilityShowcase';
import {SpriteSheetStudio} from './components/SpriteSheetStudio';
import {exportRosterToCanvasPng} from './utils/exportBoard';

type ViewMode = 'canvas' | 'grid';
type RoleFilter = 'Tous' | ChampionRole;

const ROLE_FILTERS: RoleFilter[] = [
  'Tous',
  'Assassin',
  'Combattant',
  'Tank',
  'Mage',
  'Tireur',
  'Support',
];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('Tous');
  const [modalChampion, setModalChampion] = useState<InsectChampion | null>(null);
  const [showcaseChampion, setShowcaseChampion] = useState<InsectChampion>(
    CHAMPIONS[0],
  );
  const [isExporting, setIsExporting] = useState(false);

  const filteredChampions = useMemo(() => {
    if (roleFilter === 'Tous') return CHAMPIONS;
    return CHAMPIONS.filter((c) => c.role === roleFilter);
  }, [roleFilter]);

  const handleOpenChampion = (champion: InsectChampion) => {
    setShowcaseChampion(champion);
    setModalChampion(champion);
  };

  const handleJumpToSpriteSheet = (champion: InsectChampion) => {
    setShowcaseChampion(champion);
    setModalChampion(null);
    const el = document.getElementById('spritesheets');
    el?.scrollIntoView({behavior: 'smooth'});
  };

  const handleExportPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportRosterToCanvasPng(CHAMPIONS);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F3F1EC]">
      {/* Top Bar Contract: strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090A0D]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single-element wordmark */}
          <a
            href="#jeu-arene"
            className="font-display text-xl font-semibold tracking-tight text-[#F3F1EC] whitespace-nowrap shrink-0"
          >
            Chitin &amp; Runes
          </a>

          {/* Zone 2: 5 single-line nav links */}
          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A7ADBA]"
          >
            <a
              href="#jeu-arene"
              className="transition-colors hover:text-[#F3F1EC] whitespace-nowrap shrink-0"
            >
              Arène Jouable
            </a>
            <a
              href="#canvas-workspace"
              onClick={() => setViewMode('canvas')}
              className="transition-colors hover:text-[#F3F1EC] whitespace-nowrap shrink-0"
            >
              Canvas
            </a>
            <a
              href="#spritesheets"
              className="transition-colors hover:text-[#F3F1EC] whitespace-nowrap shrink-0"
            >
              Sprite Sheets
            </a>
            <a
              href="#competences"
              className="transition-colors hover:text-[#F3F1EC] whitespace-nowrap shrink-0"
            >
              Compétences
            </a>
            <a
              href="#apropos"
              className="transition-colors hover:text-[#F3F1EC] whitespace-nowrap shrink-0"
            >
              À propos
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2 text-xs font-semibold text-[#090A0D] transition-colors hover:bg-[#E4B458] disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isExporting ? 'Export en cours…' : 'Exporter PNG'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-6 py-8">
        {/* Playable 2D Arena Game — Primary Interactive Experience */}
        <GameArena
          champions={CHAMPIONS}
          selectedChampion={showcaseChampion}
          onSelectChampion={setShowcaseChampion}
        />

        {/* Editorial Header for Concepts & Concept Canvas */}
        <section className="mt-14 flex flex-col justify-between gap-6 border-t border-white/10 pt-12 pb-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-[#D9A441]">
              10 Concepts Originaux · Inspiration League of Legends · Faune Insectoïde
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight text-balance text-[#F3F1EC] sm:text-5xl">
              Dix champions insectoïdes sculptés pour la Faille
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#A7ADBA]">
              Chaque créature incarne une espèce d’insecte distincte, une direction
              artistique dédiée, un kit de compétences complet et sa propre sprite
              sheet 2D cel-shading utilisable en jeu et exportable.
            </p>
          </div>

          {/* Workspace View Mode Switcher */}
          <div
            role="group"
            aria-label="Mode d’affichage"
            className="flex items-center gap-1 self-start rounded-lg border border-white/10 bg-[#12141B] p-1 lg:self-end"
          >
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                viewMode === 'canvas'
                  ? 'bg-[#D9A441] text-[#090A0D]'
                  : 'text-[#A7ADBA] hover:text-[#F3F1EC]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Canvas libre</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                viewMode === 'grid'
                  ? 'bg-[#D9A441] text-[#090A0D]'
                  : 'text-[#A7ADBA] hover:text-[#F3F1EC]'
              }`}
            >
              <Grid className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Grille éditoriale</span>
            </button>
          </div>
        </section>

        {/* Role Filter Bar */}
        <section
          id="canvas-workspace"
          className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-3.5"
        >
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer par rôle">
            {ROLE_FILTERS.map((role) => {
              const isActive = roleFilter === role;
              const count =
                role === 'Tous'
                  ? CHAMPIONS.length
                  : CHAMPIONS.filter((c) => c.role === role).length;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9A441] ${
                    isActive
                      ? 'bg-white/12 text-[#F3F1EC]'
                      : 'text-[#8E95A5] hover:bg-white/6 hover:text-[#F3F1EC]'
                  }`}
                >
                  {role}{' '}
                  <span className="font-mono-tabular text-[#8E95A5]">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <p className="font-mono-tabular text-xs text-[#8E95A5]">
            {filteredChampions.length} sur {CHAMPIONS.length} champions affichés
          </p>
        </section>

        {/* Primary Focal Anchor: Interactive Canvas or Editorial Grid */}
        <section aria-label="Espace visuel des champions">
          {viewMode === 'canvas' ? (
            <InteractiveCanvas
              champions={filteredChampions}
              selectedId={modalChampion?.id ?? null}
              onSelectChampion={handleOpenChampion}
            />
          ) : (
            <ChampionGrid
              champions={filteredChampions}
              onSelectChampion={handleOpenChampion}
            />
          )}
        </section>

        {/* Interactive Game-Ready Sprite Sheet Studio */}
        <div className="mt-14">
          <SpriteSheetStudio
            champions={CHAMPIONS}
            activeChampion={showcaseChampion}
            onSelectActive={setShowcaseChampion}
          />
        </div>

        {/* Tactical Ability & Biomechanics Showcase */}
        <div className="mt-14">
          <AbilityShowcase
            champions={CHAMPIONS}
            activeChampion={showcaseChampion}
            onSelectActive={setShowcaseChampion}
            onOpenModal={handleOpenChampion}
          />
        </div>

        {/* Quiet Editorial Overview */}
        <section
          id="apropos"
          className="mt-16 grid grid-cols-1 gap-8 border-t border-white/10 pt-12 md:grid-cols-3"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#F3F1EC]">
              Dix espèces, dix silhouettes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9DA3B0]">
              De la mante orchidée d’obsidienne au phasme des brumes en passant par
              le frelon mécanique et la cigale cristalline, chaque champion traduit
              une morphologie entomologique réelle en silhouette lisible en combat.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#F3F1EC]">
              Sprite Sheets cel-shading prêtes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9DA3B0]">
              Chaque personnage dispose de sprites cel-shading aux contours nets,
              étendues en 5 animations de 12 images (Garde, Course, Attaque, Ultime,
              Impact/K.O.) sur fond transparent RGBA avec atlas JSON Phaser, Pixi,
              Unity et Godot.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#F3F1EC]">
              Arène jouable &amp; Export complet
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9DA3B0]">
              Jouez immédiatement chaque champion dans l’arène avec son ultime dédié
              contre 5 vagues d’ennemis, ou téléchargez l’ensemble des sprite sheets
              et descripteurs JSON en un clic.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-4 px-6 text-xs text-[#737988] sm:flex-row sm:items-center">
          <p>Chitin &amp; Runes — Recueil de 10 concepts originaux de champions insectoïdes.</p>
          <button
            type="button"
            onClick={handleExportPng}
            className="text-[#A7ADBA] underline-offset-4 transition-colors hover:text-[#F3F1EC] hover:underline whitespace-nowrap shrink-0"
          >
            Télécharger la planche complète (PNG)
          </button>
        </div>
      </footer>

      {/* Fullscreen Lightbox & Kit Modal */}
      <ChampionModal
        champion={modalChampion}
        champions={CHAMPIONS}
        onClose={() => setModalChampion(null)}
        onSelectChampion={(champ) => {
          setShowcaseChampion(champ);
          setModalChampion(champ);
        }}
        onOpenSpriteSheet={handleJumpToSpriteSheet}
      />
    </div>
  );
}
