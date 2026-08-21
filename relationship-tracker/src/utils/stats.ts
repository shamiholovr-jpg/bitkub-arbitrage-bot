import { Category, Entry } from '../types';
import { daysAgo, weekKey, weekLabel } from './date';

/** Entries whose date falls within the last `windowDays` (inclusive of today). */
export function entriesInWindow(entries: Entry[], windowDays: number, reference: Date = new Date()): Entry[] {
  return entries.filter((e) => {
    const age = daysAgo(e.date, reference);
    return age >= 0 && age < windowDays;
  });
}

/**
 * "Friction score": a 0-100 measure of how much relationship friction was
 * logged in a window, derived from category severity × intensity, averaged
 * per day and scaled. 0 = nothing logged, 100 = a lot of heavy events daily.
 * This is intentionally a simple, transparent heuristic — not a validated
 * clinical instrument — and is shown to the user as such.
 */
export function frictionScore(entries: Entry[], categories: Category[], windowDays: number, reference: Date = new Date()): number {
  const windowed = entriesInWindow(entries, windowDays, reference);
  if (windowed.length === 0) return 0;

  const severityById = new Map(categories.map((c) => [c.id, c.severity]));
  const weighted = windowed.reduce((sum, e) => {
    const severity = severityById.get(e.categoryId) ?? 2;
    return sum + severity * (e.intensity / 5);
  }, 0);

  const perDay = weighted / windowDays;
  // Scale so that ~1 major_fight-equivalent (severity 4, intensity 5) per day => 100.
  const scaled = (perDay / 4) * 100;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

export type FrictionLevel = 'calm' | 'mild' | 'elevated' | 'high';

export function frictionLevel(score: number): FrictionLevel {
  if (score < 10) return 'calm';
  if (score < 30) return 'mild';
  if (score < 55) return 'elevated';
  return 'high';
}

export const FRICTION_LEVEL_LABEL: Record<FrictionLevel, string> = {
  calm: 'Спокойно',
  mild: 'Лёгкое напряжение',
  elevated: 'Повышенное напряжение',
  high: 'Высокое напряжение',
};

export const FRICTION_LEVEL_EMOJI: Record<FrictionLevel, string> = {
  calm: '🟢',
  mild: '🟡',
  elevated: '🟠',
  high: '🔴',
};

export interface TrendResult {
  current: number;
  previous: number;
  deltaPoints: number;
  /** true = friction went up (worse), false = down (better), null = flat/no data */
  worsened: boolean | null;
}

/** Compares friction over the last `windowDays` vs. the equally-sized window before it. */
export function frictionTrend(entries: Entry[], categories: Category[], windowDays: number, reference: Date = new Date()): TrendResult {
  const current = frictionScore(entries, categories, windowDays, reference);
  const earlierReference = new Date(reference);
  earlierReference.setDate(earlierReference.getDate() - windowDays);
  const previous = frictionScore(entries, categories, windowDays, earlierReference);
  const deltaPoints = current - previous;
  return {
    current,
    previous,
    deltaPoints,
    worsened: deltaPoints === 0 ? null : deltaPoints > 0,
  };
}

/** Count of entries per category id within a window (window = null means all-time). */
export function categoryTotals(entries: Entry[], windowDays: number | null, reference: Date = new Date()): Record<string, number> {
  const windowed = windowDays == null ? entries : entriesInWindow(entries, windowDays, reference);
  const totals: Record<string, number> = {};
  for (const e of windowed) {
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + 1;
  }
  return totals;
}

export interface WeeklyBucket {
  weekStartIso: string;
  label: string;
  totalsByCategory: Record<string, number>;
}

/** Buckets entries into the last `numWeeks` Monday-start weeks (oldest first). */
export function weeklyBreakdown(entries: Entry[], numWeeks: number, reference: Date = new Date()): WeeklyBucket[] {
  const buckets = new Map<string, WeeklyBucket>();
  const order: string[] = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const d = new Date(reference);
    d.setDate(d.getDate() - i * 7);
    const key = weekKey(d.toISOString().slice(0, 10));
    if (!buckets.has(key)) {
      buckets.set(key, { weekStartIso: key, label: weekLabel(key), totalsByCategory: {} });
      order.push(key);
    }
  }
  const validKeys = new Set(order);
  for (const e of entries) {
    const key = weekKey(e.date);
    const bucket = buckets.get(key);
    if (bucket && validKeys.has(key)) {
      bucket.totalsByCategory[e.categoryId] = (bucket.totalsByCategory[e.categoryId] ?? 0) + 1;
    }
  }
  return order.map((k) => buckets.get(k)!);
}

/** Daily friction series for the last `numDays` days (oldest first) — used for the trend line chart. */
export function dailyFrictionSeries(entries: Entry[], categories: Category[], numDays: number, reference: Date = new Date()): { dateIso: string; score: number }[] {
  const result: { dateIso: string; score: number }[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(reference);
    d.setDate(d.getDate() - i);
    // Rolling 7-day friction score ending on day `d`, so single spikes don't
    // make the whole chart unreadable while still tracking day-to-day movement.
    const score = frictionScore(entries, categories, 7, d);
    result.push({ dateIso: d.toISOString().slice(0, 10), score });
  }
  return result;
}
