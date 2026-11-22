export type CombatStyle = 'melee' | 'ranged';

export type SkillMechanic =
  | 'shadow_dash'
  | 'bronze_shield'
  | 'spore_heal'
  | 'venom_evade'
  | 'ash_vortex'
  | 'catapult_leap'
  | 'aqua_dash'
  | 'banner_stun'
  | 'vine_trap'
  | 'frost_pillar';

export type UltMechanic =
  | 'eclipse_blades'
  | 'desert_anvil'
  | 'glade_aurora'
  | 'queen_railgun'
  | 'monolith_storm'
  | 'swarm_cyclone'
  | 'prism_barrage'
  | 'colony_surge'
  | 'living_canopy'
  | 'sonic_winter';

export interface ChampionCombatKit {
  championId: string;
  maxHp: number;
  speed: number; // px / s
  attackDamage: number;
  attackCooldown: number; // seconds
  attackRange: number;
  combatStyle: CombatStyle;
  projectileSpeed?: number;
  projectileColor?: string;
  piercingBasic?: boolean;
  skillName: string;
  skillKeyLabel: string;
  skillCooldown: number; // seconds
  skillDescription: string;
  skillMechanic: SkillMechanic;
  ultName: string;
  ultDescription: string;
  ultMechanic: UltMechanic;
}

export const CHAMPION_COMBAT_KITS: Record<string, ChampionCombatKit> = {
  kaelvex: {
    championId: 'kaelvex',
    maxHp: 380,
    speed: 285,
    attackDamage: 46,
    attackCooldown: 0.32,
    attackRange: 96,
    combatStyle: 'melee',
    skillName: 'Pas de la Tige',
    skillKeyLabel: 'E',
    skillCooldown: 4.5,
    skillDescription:
      'Bondit vivement vers le curseur et entaille tous les ennemis traversés.',
    skillMechanic: 'shadow_dash',
    ultName: 'Éclipse des Lames',
    ultDescription:
      "Déchaîne un tourbillon d'ombres dorées qui lacère tous les ennemis proches en rafale.",
    ultMechanic: 'eclipse_blades',
  },
  brimkor: {
    championId: 'brimkor',
    maxHp: 620,
    speed: 205,
    attackDamage: 56,
    attackCooldown: 0.56,
    attackRange: 108,
    combatStyle: 'melee',
    skillName: 'Élytres Verrouillés',
    skillKeyLabel: 'E',
    skillCooldown: 6.5,
    skillDescription:
      'Gagne un bouclier de bronze incandescent (+140 PV temporaires) et repousse autour de lui.',
    skillMechanic: 'bronze_shield',
    ultName: 'Enclume du Désert',
    ultDescription:
      'Saute vers la cible et déclenche 3 ondes sismiques géantes qui étourdissent la horde.',
    ultMechanic: 'desert_anvil',
  },
  sylphera: {
    championId: 'sylphera',
    maxHp: 390,
    speed: 248,
    attackDamage: 32,
    attackCooldown: 0.38,
    attackRange: 380,
    combatStyle: 'ranged',
    projectileSpeed: 540,
    projectileColor: '#6EC8B5',
    skillName: 'Essaim de Spores',
    skillKeyLabel: 'E',
    skillCooldown: 5.5,
    skillDescription:
      'Régénère 85 PV et libère une aura stellaire qui étourdit les ennemis proches.',
    skillMechanic: 'spore_heal',
    ultName: 'Aurore de la Clairière',
    ultDescription:
      'Restaure 180 PV et projette 12 filaments astraux guidés qui frappent et figent les assaillants.',
    ultMechanic: 'glade_aurora',
  },
  vesperon: {
    championId: 'vesperon',
    maxHp: 340,
    speed: 255,
    attackDamage: 38,
    attackCooldown: 0.27,
    attackRange: 470,
    combatStyle: 'ranged',
    projectileSpeed: 760,
    projectileColor: '#4FA872',
    skillName: 'Recul Chimique',
    skillKeyLabel: 'E',
    skillCooldown: 4.8,
    skillDescription:
      'Se propulse hors de danger en tirant une salve de 3 aiguillons de venin ralentissants.',
    skillMechanic: 'venom_evade',
    ultName: 'Calibre de la Reine',
    ultDescription:
      'Tire un rayon Hextech supersonique géant traversant toute l’arène en ligne droite.',
    ultMechanic: 'queen_railgun',
  },
  noxthalys: {
    championId: 'noxthalys',
    maxHp: 375,
    speed: 235,
    attackDamage: 40,
    attackCooldown: 0.4,
    attackRange: 420,
    combatStyle: 'ranged',
    projectileSpeed: 500,
    projectileColor: '#B8A6EA',
    skillName: 'Vortex Cendré',
    skillKeyLabel: 'E',
    skillCooldown: 6.0,
    skillDescription:
      "Crée une singularité spectrale qui attire les ennemis au centre et les brûle sur la durée.",
    skillMechanic: 'ash_vortex',
    ultName: 'Nuit des Monolithes',
    ultDescription:
      'Déploie une nuée orbitale de papillons spectraux qui traquent et détruisent les cibles.',
    ultMechanic: 'monolith_storm',
  },
  krizarak: {
    championId: 'krizarak',
    maxHp: 460,
    speed: 278,
    attackDamage: 44,
    attackCooldown: 0.35,
    attackRange: 94,
    combatStyle: 'melee',
    skillName: 'Saut Catapulte',
    skillKeyLabel: 'E',
    skillCooldown: 4.2,
    skillDescription:
      'Exécute un bond fulgurant et soulève une bourrasque de sable à l’atterrissage.',
    skillMechanic: 'catapult_leap',
    ultName: 'Tempête de la Nuée',
    ultDescription:
      'Invoque un cyclone de sable dévastateur qui parcourt l’arène en lacérant les ennemis.',
    ultMechanic: 'swarm_cyclone',
  },
  aurelia: {
    championId: 'aurelia',
    maxHp: 385,
    speed: 268,
    attackDamage: 42,
    attackCooldown: 0.38,
    attackRange: 430,
    combatStyle: 'ranged',
    projectileSpeed: 640,
    projectileColor: '#56D5DF',
    piercingBasic: true,
    skillName: 'Vol Rasant',
    skillKeyLabel: 'E',
    skillCooldown: 4.5,
    skillDescription:
      "Glisse instantanément sur l'eau et laisse un éclat de lotus explosif derrière elle.",
    skillMechanic: 'aqua_dash',
    ultName: 'Prisme Diluvien',
    ultDescription:
      'Fait jaillir 8 rayons prismatiques irisés qui balaient et percent toutes les cibles autour d’elle.',
    ultMechanic: 'prism_barrage',
  },
  myrmex: {
    championId: 'myrmex',
    maxHp: 580,
    speed: 215,
    attackDamage: 48,
    attackCooldown: 0.48,
    attackRange: 102,
    combatStyle: 'melee',
    skillName: 'Étau Mandibulaire',
    skillKeyLabel: 'E',
    skillCooldown: 5.5,
    skillDescription:
      'Claque le sol avec son étendard pour étourdir les ennemis devant lui pendant 1,6 s.',
    skillMechanic: 'banner_stun',
    ultName: 'Marée de la Colonie',
    ultDescription:
      'Invoque 5 drones-fourmis légionnaires alliés qui chargent et combattent à ses côtés + bouclier.',
    ultMechanic: 'colony_surge',
  },
  cymoth: {
    championId: 'cymoth',
    maxHp: 360,
    speed: 245,
    attackDamage: 44,
    attackCooldown: 0.34,
    attackRange: 490,
    combatStyle: 'ranged',
    projectileSpeed: 720,
    projectileColor: '#8BC36A',
    skillName: 'Mâchoire de Lierre',
    skillKeyLabel: 'E',
    skillCooldown: 5.0,
    skillDescription:
      'Pose un piège de ronces qui explose et immobilise les ennemis qui marchent dessus.',
    skillMechanic: 'vine_trap',
    ultName: 'Canopée Vivante',
    ultDescription:
      "Déclenche une pluie continue de 18 flèches de ronce en éventail + vitesse d'attaque doublée.",
    ultMechanic: 'living_canopy',
  },
  zephyrion: {
    championId: 'zephyrion',
    maxHp: 390,
    speed: 235,
    attackDamage: 43,
    attackCooldown: 0.42,
    attackRange: 440,
    combatStyle: 'ranged',
    projectileSpeed: 560,
    projectileColor: '#79C3FF',
    piercingBasic: true,
    skillName: 'Diapason de Glace',
    skillKeyLabel: 'E',
    skillCooldown: 5.8,
    skillDescription:
      'Érige un cristal résonant qui pulse 4 ondes soniques de givre ralentissantes.',
    skillMechanic: 'frost_pillar',
    ultName: 'Chant du Dix-Septième Hiver',
    ultDescription:
      'Libère 3 gigantesques anneaux acoustiques qui traversent toute l’arène et brisent l’armure.',
    ultMechanic: 'sonic_winter',
  },
};

export function getChampionCombatKit(championId: string): ChampionCombatKit {
  return CHAMPION_COMBAT_KITS[championId] ?? CHAMPION_COMBAT_KITS.kaelvex;
}
