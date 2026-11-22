export type ChampionRole =
  | 'Assassin'
  | 'Combattant'
  | 'Tank'
  | 'Mage'
  | 'Tireur'
  | 'Support';

export interface ChampionAbility {
  key: 'Passif' | 'A' | 'Z' | 'E' | 'R';
  name: string;
  cooldown: string;
  cost: string;
  summary: string;
}

export interface ChampionStats {
  offense: number; // 1-10
  defense: number; // 1-10
  control: number; // 1-10
  mobility: number; // 1-10
}

export interface InsectChampion {
  id: string;
  index: string;
  name: string;
  title: string;
  insectType: string;
  scientificInspo: string;
  role: ChampionRole;
  lane: string;
  region: string;
  artStyle: string;
  accentHex: string;
  imagePath: string;
  spriteSheetPath: string;
  defaultPosition: {x: number; y: number};
  lore: string;
  biomechanics: string;
  stats: ChampionStats;
  abilities: ChampionAbility[];
}

export const CHAMPIONS: InsectChampion[] = [
  {
    id: 'kaelvex',
    index: '01',
    name: "Kael'Vex",
    title: "La Mante d'Obsidienne",
    insectType: 'Mante Orchidée Nocturne',
    scientificInspo: 'Hymenopus coronatus',
    role: 'Assassin',
    lane: 'Jungle · Mid',
    region: 'Ionia Nocturne',
    artStyle: 'Lavis sombre, lames dorées et pétales tranchés',
    accentHex: '#D4A853',
    imagePath: '/src/assets/images/champ_mantis_assassin_1795383799083.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_kaelvex_1795385573410.jpg',
    defaultPosition: {x: 80, y: 80},
    lore: "Née dans les sanctuaires oubliés d'Ionia, Kael'Vex chasse à la lueur du croissant de lune. Ses avant-bras en chitine vitrifiée fendent l'air plus vite que le regard humain, ne laissant derrière elle que des pétales de cerisier coupés net.",
    biomechanics:
      "Yeux composés à vision stéréoscopique nocturne et faux ravisseuses articulées capables de verrouiller sa proie en moins de 12 millisecondes.",
    stats: {offense: 9, defense: 3, control: 4, mobility: 9},
    abilities: [
      {
        key: 'Passif',
        name: 'Embuscade Florale',
        cooldown: '14 - 6 s',
        cost: 'Aucun',
        summary:
          "Après 1,5 s hors champ de vision ennemi, la prochaine attaque de Kael'Vex bondit sur sa cible et inflige des dégâts bruts bonus.",
      },
      {
        key: 'A',
        name: 'Faux Croisées',
        cooldown: '6 / 5,5 / 5 / 4,5 / 4 s',
        cost: '35 Énergie',
        summary:
          "Fend l'espace en arc devant elle avec ses deux lames ; les cibles au point d'intersection subissent un saignement critique.",
      },
      {
        key: 'Z',
        name: 'Mue de Brume',
        cooldown: '14 / 13 / 12 / 11 / 10 s',
        cost: '50 Énergie',
        summary:
          "Se camoufle brièvement en laissant une exuvie d'obsidienne qui explose en pétales tranchants si elle est détruite.",
      },
      {
        key: 'E',
        name: 'Pas de la Tige',
        cooldown: '11 / 10 / 9 / 8 / 7 s',
        cost: '40 Énergie',
        summary:
          "Bondit vers un mur ou un champion ennemi ; si la cible porte moins de 40 % de PV, le délai est réduit de moitié.",
      },
      {
        key: 'R',
        name: 'Éclipse des Lames',
        cooldown: '110 / 90 / 70 s',
        cost: 'Aucune',
        summary:
          "S'élance à travers jusqu'à 3 ennemis dans une zone, figeant les ombres avant de déclencher une exécution simultanée.",
      },
    ],
  },
  {
    id: 'brimkor',
    index: '02',
    name: "Brim'Kor",
    title: 'Le Scarabée Forgeron',
    insectType: 'Scarabée Rhinocéros Goliath',
    scientificInspo: 'Dynastes hercules',
    role: 'Tank',
    lane: 'Top',
    region: 'Forges de Shurima',
    artStyle: 'Bronze martelé, lapis-lazuli et braises runiques',
    accentHex: '#E07A3A',
    imagePath: '/src/assets/images/champ_scarab_juggernaut_1795383799031.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_brimkor_1795385573284.jpg',
    defaultPosition: {x: 470, y: 80},
    lore: "Ancien gardien des citadelles ensevelies sous le désert, Brim'Kor a fusionné sa carapace de lapis-lazuli avec les métaux en fusion des forges solaires. Il avance comme un bélier vivant, insensible aux flèches et aux lames.",
    biomechanics:
      "Exosquelette stratifié capable de supporter 850 fois son propre poids et corne céphalique servant de levier sismique.",
    stats: {offense: 6, defense: 10, control: 8, mobility: 3},
    abilities: [
      {
        key: 'Passif',
        name: 'Carapace Trempée',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Subir des dégâts chauffe sa forge interne, augmentant son armure et sa résistance magique jusqu'à 25 %.",
      },
      {
        key: 'A',
        name: 'Marteau de Chitine',
        cooldown: '8 / 7 / 6 / 5 / 4 s',
        cost: '45 Mana',
        summary:
          "Frappe le sol avec son marteau-corne, ouvrant une fissure de magma qui ralentit les ennemis touchés.",
      },
      {
        key: 'Z',
        name: 'Élytres Verrouillés',
        cooldown: '16 / 15 / 14 / 13 / 12 s',
        cost: '60 Mana',
        summary:
          "Déploie un bouclier frontal en bronze incandescent réduisant les dégâts reçus de face et renvoyant des étincelles.",
      },
      {
        key: 'E',
        name: 'Charge de la Corne',
        cooldown: '14 / 13 / 12 / 11 / 10 s',
        cost: '55 Mana',
        summary:
          "Fonce en ligne droite et soulève le premier champion heurté par-dessus son dos grâce à sa corne géante.",
      },
      {
        key: 'R',
        name: 'Enclume du Désert',
        cooldown: '130 / 110 / 90 s',
        cost: '100 Mana',
        summary:
          "Saute puis s'écrase avec une onde sismique en trois vagues successives qui projettent l'équipe adverse.",
      },
    ],
  },
  {
    id: 'sylphera',
    index: '03',
    name: 'Sylphéra',
    title: 'La Luciole Astrale',
    insectType: 'Luciole Bioluminescente',
    scientificInspo: 'Photinus pyralis',
    role: 'Support',
    lane: 'Support',
    region: 'Clairières de Bandle',
    artStyle: 'Vitrail opalescent, lueur stellaire et brume féerique',
    accentHex: '#6EC8B5',
    imagePath: '/src/assets/images/champ_firefly_enchanter_1795383798700.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_sylphera_1795385573392.jpg',
    defaultPosition: {x: 860, y: 80},
    lore: "Lorsque les voyageurs s'égarent dans les forêts crépusculaires entre Targon et Bandle, une lueur dorée apparaît entre les fougères. Sylphéra guide les âmes perdues à l'aide de sa lanterne à luciférine stellaire.",
    biomechanics:
      "Organe photogénique abdominal produisant une lumière froide à 98 % de rendement, modulée en signaux harmoniques soignants.",
    stats: {offense: 3, defense: 5, control: 7, mobility: 7},
    abilities: [
      {
        key: 'Passif',
        name: 'Luciférine Partagée',
        cooldown: '12 s',
        cost: 'Aucun',
        summary:
          "Les sorts lancés sur un allié déposent une luciole orbitale qui révèle les buissons proches et régénère ses PV.",
      },
      {
        key: 'A',
        name: 'Trait de Nectar',
        cooldown: '9 / 8 / 7 / 6 / 5 s',
        cost: '50 Mana',
        summary:
          "Projette un filament lumineux qui blesse les ennemis et marque la cible, permettant aux alliés de la soigner en la frappant.",
      },
      {
        key: 'Z',
        name: 'Voile de Vitrail',
        cooldown: '12 / 11 / 10 / 9 / 8 s',
        cost: '65 Mana',
        summary:
          "Enveloppe un allié dans une aura d'ailes irisées qui absorbe les dégâts et augmente sa vitesse de déplacement.",
      },
      {
        key: 'E',
        name: 'Essaim de Spores',
        cooldown: '15 / 14 / 13 / 12 / 11 s',
        cost: '70 Mana',
        summary:
          "Libère un nuage bioluminescent qui étourdit les ennemis restant plus de 1,2 s dans la lumière.",
      },
      {
        key: 'R',
        name: 'Aurore de la Clairière',
        cooldown: '120 / 100 / 80 s',
        cost: '100 Mana',
        summary:
          "Éclaire une large zone pendant 4 s : dissipe les entraves sur les alliés et réduit la portée de vision des adversaires.",
      },
    ],
  },
  {
    id: 'vesperon',
    index: '04',
    name: 'Vespéron',
    title: 'Le Frelon Mécanique',
    insectType: 'Frelon Géant Hextech',
    scientificInspo: 'Vespa mandarinia',
    role: 'Tireur',
    lane: 'Bot (ADC)',
    region: 'Piltover · Zaun',
    artStyle: 'Laiton victorien, fioles émeraude et pluie nocturne',
    accentHex: '#4FA872',
    imagePath: '/src/assets/images/champ_hornet_marksman_1795383798211.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_vesperon_1795385573917.jpg',
    defaultPosition: {x: 1250, y: 80},
    lore: "Ancien tireur d'élite de Piltover reconstruit avec des prothèses d'horlogerie et du chimico-venin de Zaun, Vespéron patrouille au-dessus des ponts brumeux. Chaque balle de son fusil-dard injecte une toxine pressurisée.",
    biomechanics:
      "Ailes membraneuses assistées par micro-turbines à engrenages permettant le vol stationnaire lors de tirs de précision.",
    stats: {offense: 10, defense: 2, control: 3, mobility: 7},
    abilities: [
      {
        key: 'Passif',
        name: 'Dard à Répétition',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Chaque 4e tir de base injecte une dose d'alchimie qui cumule du poison et réduit l'armure de la cible.",
      },
      {
        key: 'A',
        name: 'Salve Pressurisée',
        cooldown: '7 / 6,5 / 6 / 5,5 / 5 s',
        cost: '40 Mana',
        summary:
          "Tire trois aiguillons perforants en éventail ; toucher un ennemi déjà empoisonné prolonge les effets.",
      },
      {
        key: 'Z',
        name: 'Vol Stationnaire',
        cooldown: '16 / 14 / 12 / 10 / 8 s',
        cost: '50 Mana',
        summary:
          "Active ses ailes d'horlogerie pendant 4 s pour survoler les murets bas et gagner +125 de portée d'attaque.",
      },
      {
        key: 'E',
        name: 'Recul Chimique',
        cooldown: '13 / 12 / 11 / 10 / 9 s',
        cost: '60 Mana',
        summary:
          "Propulse Vespéron en arrière en tirant une grenade de venin qui ralentit les poursuivants.",
      },
      {
        key: 'R',
        name: 'Calibre de la Reine',
        cooldown: '100 / 85 / 70 s',
        cost: '100 Mana',
        summary:
          "Verrouille une cible à très longue distance et décoche un dard Hextech supersonique traversant les sbires.",
      },
    ],
  },
  {
    id: 'noxthalys',
    index: '05',
    name: "Nox'Thalys",
    title: 'Le Papillon du Néant',
    insectType: 'Sphinx Tête-de-Mort',
    scientificInspo: 'Acherontia atropos',
    role: 'Mage',
    lane: 'Mid',
    region: 'Vallées des Ombres',
    artStyle: 'Velours cendre, poussière d’écailles argentées et clair-obscur',
    accentHex: '#9C8CC4',
    imagePath: '/src/assets/images/champ_moth_mage_1795383799203.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_noxthalys_1795385574562.jpg',
    defaultPosition: {x: 1640, y: 80},
    lore: "Attiré par les failles arcaniques plutôt que par les flammes, Nox'Thalys tisse des illusions à partir des écailles microscopiques de ses ailes. Quiconque inhale sa poussière nocturne confond ses alliés avec des mirages.",
    biomechanics:
      "Antennes plumeuses ultra-sensibles captant les vibrations magiques à plusieurs kilomètres et motifs ocellaires hypnotiques.",
    stats: {offense: 8, defense: 4, control: 9, mobility: 5},
    abilities: [
      {
        key: 'Passif',
        name: 'Poussière d’Écailles',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Les sorts de Nox'Thalys laissent des traînées scintillantes au sol qui révèlent les ennemis et réduisent leur vision.",
      },
      {
        key: 'A',
        name: 'Essaim Lunaire',
        cooldown: '6,5 / 6 / 5,5 / 5 / 4,5 s',
        cost: '55 Mana',
        summary:
          "Envoie une nuée de papillons spectraux en spirale vers un point ciblé, explosant à l'arrivée.",
      },
      {
        key: 'Z',
        name: 'Ocelles Hypnotiques',
        cooldown: '15 / 14 / 13 / 12 / 11 s',
        cost: '70 Mana',
        summary:
          "Déploie ses ailes : les ennemis qui le regardent directement sont charmés vers lui pendant 1,5 s.",
      },
      {
        key: 'E',
        name: 'Vortex Cendré',
        cooldown: '13 / 12 / 11 / 10 / 9 s',
        cost: '65 Mana',
        summary:
          "Crée un tourbillon de poussière qui attire doucement les ennemis vers son centre et inflige des dégâts sur la durée.",
      },
      {
        key: 'R',
        name: 'Nuit des Monolithes',
        cooldown: '130 / 110 / 90 s',
        cost: '100 Mana',
        summary:
          "Plonge le champ de bataille dans un crépuscule spectral ; les illusions de papillons attaquent chaque champion isolé.",
      },
    ],
  },
  {
    id: 'krizarak',
    index: '06',
    name: "Kri'Zarak",
    title: 'Le Criquet des Sables',
    insectType: 'Criquet Migrateur Cuirassé',
    scientificInspo: 'Schistocerca gregaria',
    role: 'Combattant',
    lane: 'Top · Jungle',
    region: 'Canyons de Shurima',
    artStyle: 'Ocre solaire, vortex de sable et action cinétique',
    accentHex: '#D99B4E',
    imagePath: '/src/assets/images/champ_locust_skirmisher_1795383798185.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_krizarak_1795385572963.jpg',
    defaultPosition: {x: 80, y: 430},
    lore: "Seul survivant d'une nuée millénaire scellée dans les failles arides, Kri'Zarak bondit de falaise en falaise avec la force d'une catapulte. Là où ses pattes touchent la roche, un cyclone de sable s'élève.",
    biomechanics:
      "Tendons de résiline comprimés dans les fémurs postérieurs permettant une accélération explosive de 20 G au décollage.",
    stats: {offense: 8, defense: 6, control: 5, mobility: 10},
    abilities: [
      {
        key: 'Passif',
        name: 'Élan de Résiline',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Se déplacer et bondir charge ses pattes arrière ; à 100 charges, sa prochaine attaque propulse une onde de sable.",
      },
      {
        key: 'A',
        name: 'Glaives Crénelés',
        cooldown: '5 / 4,5 / 4 / 3,5 / 3 s',
        cost: '30 Mana',
        summary:
          "Double entaille rapide en avançant ; touche deux fois si Kri'Zarak vient de terminer un bond.",
      },
      {
        key: 'Z',
        name: 'Saut Catapulte',
        cooldown: '10 / 9 / 8 / 7 / 6 s',
        cost: '45 Mana',
        summary:
          "Compresse ses ressorts puis bondit à longue portée ; réactivable une fois sur un mur pour changer de direction.",
      },
      {
        key: 'E',
        name: 'Stridulation Sèche',
        cooldown: '14 / 13 / 12 / 11 / 10 s',
        cost: '50 Mana',
        summary:
          "Fait vibrer ses élytres et crée un tourbillon local qui dévie les projectiles de base pendant 1,25 s.",
      },
      {
        key: 'R',
        name: 'Tempête de la Nuée',
        cooldown: '110 / 95 / 80 s',
        cost: '100 Mana',
        summary:
          "Enchaîne trois bonds fulgurants en zone, soulevant une tempête de sable qui aveugle et lacère les ennemis.",
      },
    ],
  },
  {
    id: 'aurelia',
    index: '07',
    name: 'Aurelia',
    title: 'La Libellule Chromatique',
    insectType: 'Libellule Empereur Irisée',
    scientificInspo: 'Anax imperator',
    role: 'Mage',
    lane: 'Mid · Jungle',
    region: "Bassins d'Ixtal",
    artStyle: 'Reflets prismatiques, lotus sous la pluie et lance d’eau',
    accentHex: '#43B0B8',
    imagePath: '/src/assets/images/champ_dragonfly_battlemage_1795383799157.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_aurelia_1795385572851.jpg',
    defaultPosition: {x: 470, y: 430},
    lore: "Gardienne des bassins sacrés d'Ixtal, Aurelia rase la surface des eaux immobiles à une vitesse vertigineuse. Ses quatre ailes indépendantes réfractent la lumière en arcs-en-ciel tandis qu'elle sculpte l'eau de pluie en lances cristallines.",
    biomechanics:
      "Quatre ailes pilotées séparément offrant des changements de cap instantanés à 360° et vol à reculons.",
    stats: {offense: 8, defense: 4, control: 6, mobility: 9},
    abilities: [
      {
        key: 'Passif',
        name: 'Réfraction Quadri-Ailes',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Aurelia peut lancer ses sorts sans interrompre son mouvement et gagne de la vitesse sur les zones d'eau ou de pluie.",
      },
      {
        key: 'A',
        name: 'Lance de Rosée',
        cooldown: '5,5 / 5 / 4,5 / 4 / 3,5 s',
        cost: '40 Mana',
        summary:
          "Projette une lance d'eau cristalline qui éclate derrière la première cible en cône prismatique.",
      },
      {
        key: 'Z',
        name: 'Vol Rasant',
        cooldown: '11 / 10 / 9 / 8 / 7 s',
        cost: '50 Mana',
        summary:
          "Glisse latéralement sur une courte distance et laisse un miroir d'eau qui reflète son prochain sort.",
      },
      {
        key: 'E',
        name: 'Onde de Lotus',
        cooldown: '14 / 13 / 12 / 11 / 10 s',
        cost: '60 Mana',
        summary:
          "Frappe la surface et génère des cercles concentriques qui repoussent légèrement les ennemis hors du centre.",
      },
      {
        key: 'R',
        name: 'Prisme Diluvien',
        cooldown: '120 / 100 / 80 s',
        cost: '100 Mana',
        summary:
          "Invoque un rideau de pluie réfractée : ses ailes tirent 6 rayons irisés guidés sur les ennemis mouillés.",
      },
    ],
  },
  {
    id: 'myrmex',
    index: '08',
    name: 'Myrmex',
    title: 'Le Commandant Fourmi-Balle',
    insectType: 'Fourmi Balle Légionnaire',
    scientificInspo: 'Paraponera clavata',
    role: 'Tank',
    lane: 'Support · Top',
    region: 'Fosses de Noxus',
    artStyle: 'Chitine cramoisie, basalte volcanique et phalange martiale',
    accentHex: '#C94A4A',
    imagePath: '/src/assets/images/champ_ant_vanguard_1795383798289.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_myrmex_1795385573514.jpg',
    defaultPosition: {x: 860, y: 430},
    lore: "Dans les galeries basaltiques sous les bastions noxiens, aucune ligne ne cède tant que l'étendard de Myrmex reste planté. Il mène ses ouvrières cuirassées par phéromones tactiques et brise les boucliers de ses mandibules hydrauliques.",
    biomechanics:
      "Mandibules à verrouillage musculaire capable de broyer l'acier trempé et communication chimique instantanée de colonie.",
    stats: {offense: 5, defense: 9, control: 8, mobility: 4},
    abilities: [
      {
        key: 'Passif',
        name: 'Phéromone de Légion',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Les alliés à proximité de son étendard gagnent de la ténacité et invoquent périodiquement un drone-fourmi.",
      },
      {
        key: 'A',
        name: 'Étau Mandibulaire',
        cooldown: '8 / 7,5 / 7 / 6,5 / 6 s',
        cost: '45 Mana',
        summary:
          "Claque ses mandibules devant lui, immobilisant brièvement la cible et détruisant 50 % de ses boucliers.",
      },
      {
        key: 'Z',
        name: 'Bannière de Basalte',
        cooldown: '16 / 15 / 14 / 13 / 12 s',
        cost: '55 Mana',
        summary:
          "Plante son étendard dans le sol : les drones-fourmis convergent pour encaisser les projectiles destinés aux alliés.",
      },
      {
        key: 'E',
        name: 'Piqûre de Braise',
        cooldown: '12 / 11 / 10 / 9 / 8 s',
        cost: '50 Mana',
        summary:
          "Charge sur une courte distance et inflige une douleur fulgurante qui réduit les dégâts de la cible de 25 %.",
      },
      {
        key: 'R',
        name: 'Marée de la Colonie',
        cooldown: '130 / 110 / 90 s',
        cost: '100 Mana',
        summary:
          "Ordonne une charge coordonnée de la colonie : tous les alliés gagnent un mur de chitine et propulsent l'avant-garde.",
      },
    ],
  },
  {
    id: 'cymoth',
    index: '09',
    name: 'Cymoth',
    title: 'Le Phasme des Brumes',
    insectType: 'Phasme Feuille Épineux',
    scientificInspo: 'Extatosoma tiaratum',
    role: 'Tireur',
    lane: 'Top · Support',
    region: 'Bois Anciens d’Ionia',
    artStyle: 'Écorce vivante, mousse émeraude et feuilles d’automne',
    accentHex: '#7BA65D',
    imagePath: '/src/assets/images/champ_stickinsect_specialist_1795383799547.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_cymoth_1795385574279.jpg',
    defaultPosition: {x: 1250, y: 430},
    lore: "Même les pisteurs aguerris traversent la forêt pendant des heures sans deviner que la branche au-dessus d'eux respire. Cymoth tend son arc de ronce vivante depuis les frondaisons et piège les intrus dans des racines dormantes.",
    biomechanics:
      "Mimétisme cryptique parfait imitant le balancement d'une brindille au vent et épines chitineuses servant de carquois naturel.",
    stats: {offense: 7, defense: 4, control: 8, mobility: 5},
    abilities: [
      {
        key: 'Passif',
        name: 'Mimétisme Forestier',
        cooldown: '4 s',
        cost: 'Aucun',
        summary:
          "Rester immobile 1,5 s près d'un mur ou dans un buisson rend Cymoth indétectable jusqu'à son prochain tir.",
      },
      {
        key: 'A',
        name: 'Flèche de Ronce',
        cooldown: '7 / 6,5 / 6 / 5,5 / 5 s',
        cost: '45 Mana',
        summary:
          "Tire une épine boisée à longue portée ; si elle traverse un piège, elle s'enracine et immobilise la cible.",
      },
      {
        key: 'Z',
        name: 'Mâchoire de Lierre',
        cooldown: '16 / 14 / 12 / 10 / 8 s',
        cost: '50 Mana',
        summary:
          "Pose jusqu'à 4 pièges végétaux dissimulés qui se referment sur les ennemis et accordent la vision.",
      },
      {
        key: 'E',
        name: 'Balancement du Vent',
        cooldown: '14 / 13 / 12 / 11 / 10 s',
        cost: '60 Mana',
        summary:
          "Se projette vers une paroi ou un arbre à l'aide d'un fil de soie végétale, réinitialisant Mimétisme Forestier.",
      },
      {
        key: 'R',
        name: 'Canopée Vivante',
        cooldown: '120 / 100 / 80 s',
        cost: '100 Mana',
        summary:
          "Fait jaillir une forêt de ronces et de feuilles mimétiques sur une large zone, camouflant tous les alliés à l'intérieur.",
      },
    ],
  },
  {
    id: 'zephyrion',
    index: '10',
    name: 'Zéphyrion',
    title: 'La Cigale Sonique',
    insectType: 'Cigale Cristalline Périodique',
    scientificInspo: 'Magicicada septendecim',
    role: 'Mage',
    lane: 'Mid',
    region: 'Pics de Freljord',
    artStyle: 'Quartz givré, côtes de cuivre et ondes acoustiques bleutées',
    accentHex: '#6CA8DC',
    imagePath: '/src/assets/images/champ_cicada_artillery_1795383799019.jpg',
    spriteSheetPath: '/src/assets/images/game_sprite_zephyrion_1795385573223.jpg',
    defaultPosition: {x: 1640, y: 430},
    lore: "Enfouie dix-sept hivers sous les glaciers du Freljord, la cigale Zéphyrion n'émerge qu'à l'aube des grandes guerres. Lorsque ses cymbales thoraciques résonnent, le chant cristallin brise la glace et les armures à des lieues à la ronde.",
    biomechanics:
      "Tympan abdominal en quartz biologique capable de générer des impulsions acoustiques dépassant 140 décibels focalisés.",
    stats: {offense: 9, defense: 3, control: 7, mobility: 4},
    abilities: [
      {
        key: 'Passif',
        name: 'Résonance de Quartz',
        cooldown: 'Continu',
        cost: 'Aucun',
        summary:
          "Chaque sort qui touche un champion fait vibrer sa carapace, augmentant la portée du sort suivant de 15 % (cumulable 3 fois).",
      },
      {
        key: 'A',
        name: 'Impulsion Tympanale',
        cooldown: '5 / 4,5 / 4 / 3,5 / 3 s',
        cost: '45 Mana',
        summary:
          "Émet un anneau sonore rapide qui traverse les unités et éclate en éclats de givre à portée maximale.",
      },
      {
        key: 'Z',
        name: 'Diapason de Glace',
        cooldown: '14 / 13 / 12 / 11 / 10 s',
        cost: '65 Mana',
        summary:
          "Crée un pilier de glace chantant ; les Impulsions qui le touchent ricochent et doublent leur rayon.",
      },
      {
        key: 'E',
        name: 'Onde de Rupture',
        cooldown: '13 / 12 / 11 / 10 / 9 s',
        cost: '60 Mana',
        summary:
          "Libère une déflagration acoustique autour de lui qui repousse les assaillants et les réduit au silence 1 s.",
      },
      {
        key: 'R',
        name: 'Chant du Dix-Septième Hiver',
        cooldown: '130 / 110 / 90 s',
        cost: '100 Mana',
        summary:
          "Canalisant un cri harmonique à très longue portée, déclenche 4 ondes soniques successives qui fissurent le terrain.",
      },
    ],
  },
];
