export type SpriteAnimationId = 'idle' | 'run' | 'attack' | 'ult' | 'hit_ko';

export interface SpriteAnimationSpec {
  id: SpriteAnimationId;
  row: number;
  label: string;
  engineKey: string;
  frameCount: number;
  defaultFps: number;
  loop: boolean;
  description: string;
}

export type FrameSizeOption = 128 | 256;

export const SPRITE_COLS = 12;
export const SPRITE_ROWS = 5;

export const SPRITE_ANIMATIONS: SpriteAnimationSpec[] = [
  {
    id: 'idle',
    row: 0,
    label: 'Garde (Idle)',
    engineKey: 'idle',
    frameCount: SPRITE_COLS,
    defaultFps: 12,
    loop: true,
    description: 'Boucle fluide de 12 images : respiration, posture et battement continu.',
  },
  {
    id: 'run',
    row: 1,
    label: 'Course (Run)',
    engineKey: 'run',
    frameCount: SPRITE_COLS,
    defaultFps: 16,
    loop: true,
    description: 'Cycle progressif de locomotion sur 12 images avec raccord en boucle.',
  },
  {
    id: 'attack',
    row: 2,
    label: 'Attaque & Sort',
    engineKey: 'attack',
    frameCount: SPRITE_COLS,
    defaultFps: 15,
    loop: false,
    description: 'Progression complète en 12 images : appel, frappe peinte et retour.',
  },
  {
    id: 'ult',
    row: 3,
    label: 'Ultime (R)',
    engineKey: 'ult',
    frameCount: SPRITE_COLS,
    defaultFps: 12,
    loop: false,
    description: 'Montée en puissance progressive, apogée ultime et retombée (12 images).',
  },
  {
    id: 'hit_ko',
    row: 4,
    label: 'Impact & K.O.',
    engineKey: 'hit_ko',
    frameCount: SPRITE_COLS,
    defaultFps: 12,
    loop: false,
    description: 'Choc initial, déséquilibre progressif et chute au sol (12 images).',
  },
];

export const SPRITE_PIVOT = {x: 0.5, y: 0.88};
