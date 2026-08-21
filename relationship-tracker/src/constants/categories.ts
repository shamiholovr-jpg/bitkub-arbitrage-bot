import { Category } from '../types';

/**
 * Default categories, ordered from lightest to heaviest.
 * `severity` drives the friction score in src/utils/stats.ts — keep it 1..5.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'misunderstanding',
    label: 'Недопонимание',
    description: 'Не поняли друг друга, разошлись в мелочи',
    color: '#5B9BD5',
    emoji: '🤔',
    severity: 1,
  },
  {
    id: 'argument',
    label: 'Спор',
    description: 'Разногласие, повысили тон, но быстро остыли',
    color: '#F2B134',
    emoji: '💬',
    severity: 2,
  },
  {
    id: 'conflict',
    label: 'Конфликт',
    description: 'Серьёзное столкновение интересов или чувств',
    color: '#ED7D3A',
    emoji: '⚡',
    severity: 3,
  },
  {
    id: 'major_fight',
    label: 'Большая ссора',
    description: 'Крупный конфликт, тяжёлые эмоции, последствия',
    color: '#D64545',
    emoji: '🔥',
    severity: 4,
  },
];

/** Palette offered when the user creates a custom category. */
export const CUSTOM_CATEGORY_COLORS = [
  '#5B9BD5',
  '#6FCF97',
  '#F2B134',
  '#ED7D3A',
  '#D64545',
  '#9B59B6',
  '#16A085',
  '#7F8C8D',
];

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
