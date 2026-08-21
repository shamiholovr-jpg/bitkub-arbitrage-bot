import { format, parseISO, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns';
import { ru } from 'date-fns/locale';

/** yyyy-MM-dd for "today", used as the canonical Entry.date format. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function yesterdayIso(): string {
  return format(addDays(new Date(), -1), 'yyyy-MM-dd');
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISO(value).getTime());
}

export function formatHuman(dateIso: string): string {
  try {
    return format(parseISO(dateIso), 'd MMMM yyyy', { locale: ru });
  } catch {
    return dateIso;
  }
}

export function formatShort(dateIso: string): string {
  try {
    return format(parseISO(dateIso), 'd MMM', { locale: ru });
  } catch {
    return dateIso;
  }
}

/** Monday-start ISO week key, e.g. "2026-08-17", used to bucket entries by week. */
export function weekKey(dateIso: string): string {
  const d = parseISO(dateIso);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  return format(start, 'yyyy-MM-dd');
}

export function weekLabel(weekStartIso: string): string {
  const start = parseISO(weekStartIso);
  const end = addDays(start, 6);
  return `${format(start, 'd MMM', { locale: ru })}–${format(end, 'd MMM', { locale: ru })}`;
}

export function daysAgo(dateIso: string, referenceDate: Date = new Date()): number {
  return differenceInCalendarDays(referenceDate, parseISO(dateIso));
}
