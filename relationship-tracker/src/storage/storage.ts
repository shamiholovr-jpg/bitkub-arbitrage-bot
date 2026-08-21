import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Entry, AdvisorMessage } from '../types';

const KEYS = {
  entries: '@relationship_tracker/entries',
  customCategories: '@relationship_tracker/custom_categories',
  hiddenDefaultCategoryIds: '@relationship_tracker/hidden_default_categories',
  advisorHistory: '@relationship_tracker/advisor_history',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Не удалось прочитать ${key}:`, e);
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---- Entries -------------------------------------------------------------

export async function getEntries(): Promise<Entry[]> {
  return readJson<Entry[]>(KEYS.entries, []);
}

export async function saveEntries(entries: Entry[]): Promise<void> {
  await writeJson(KEYS.entries, entries);
}

export async function addEntry(entry: Entry): Promise<Entry[]> {
  const entries = await getEntries();
  const next = [entry, ...entries];
  await saveEntries(next);
  return next;
}

export async function updateEntry(updated: Entry): Promise<Entry[]> {
  const entries = await getEntries();
  const next = entries.map((e) => (e.id === updated.id ? updated : e));
  await saveEntries(next);
  return next;
}

export async function deleteEntry(id: string): Promise<Entry[]> {
  const entries = await getEntries();
  const next = entries.filter((e) => e.id !== id);
  await saveEntries(next);
  return next;
}

// ---- Categories ------------------------------------------------------------
// Defaults live in code (constants/categories.ts); we only persist custom
// categories the user adds, plus which defaults they chose to hide.

export async function getCustomCategories(): Promise<Category[]> {
  return readJson<Category[]>(KEYS.customCategories, []);
}

export async function saveCustomCategories(categories: Category[]): Promise<void> {
  await writeJson(KEYS.customCategories, categories);
}

export async function getHiddenDefaultCategoryIds(): Promise<string[]> {
  return readJson<string[]>(KEYS.hiddenDefaultCategoryIds, []);
}

export async function saveHiddenDefaultCategoryIds(ids: string[]): Promise<void> {
  await writeJson(KEYS.hiddenDefaultCategoryIds, ids);
}

// ---- Advisor conversation --------------------------------------------------

export async function getAdvisorHistory(): Promise<AdvisorMessage[]> {
  return readJson<AdvisorMessage[]>(KEYS.advisorHistory, []);
}

export async function saveAdvisorHistory(messages: AdvisorMessage[]): Promise<void> {
  await writeJson(KEYS.advisorHistory, messages);
}

// ---- Bulk export/import (Settings screen) ----------------------------------

export interface ExportedData {
  version: 1;
  exportedAt: string;
  entries: Entry[];
  customCategories: Category[];
  hiddenDefaultCategoryIds: string[];
}

export async function exportAllData(): Promise<ExportedData> {
  const [entries, customCategories, hiddenDefaultCategoryIds] = await Promise.all([
    getEntries(),
    getCustomCategories(),
    getHiddenDefaultCategoryIds(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    customCategories,
    hiddenDefaultCategoryIds,
  };
}

export async function importAllData(data: ExportedData): Promise<void> {
  if (!data || data.version !== 1 || !Array.isArray(data.entries)) {
    throw new Error('Неверный формат файла резервной копии');
  }
  await Promise.all([
    saveEntries(data.entries),
    saveCustomCategories(data.customCategories ?? []),
    saveHiddenDefaultCategoryIds(data.hiddenDefaultCategoryIds ?? []),
  ]);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeMany([
    KEYS.entries,
    KEYS.customCategories,
    KEYS.hiddenDefaultCategoryIds,
    KEYS.advisorHistory,
  ]);
}
