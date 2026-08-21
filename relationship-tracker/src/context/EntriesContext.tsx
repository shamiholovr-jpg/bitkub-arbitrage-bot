import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Category, Entry } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import * as storage from '../storage/storage';
import { generateId } from '../utils/id';

interface EntriesContextValue {
  loading: boolean;
  entries: Entry[];
  categories: Category[];
  addEntry: (input: Omit<Entry, 'id' | 'createdAt'>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCustomCategory: (input: Omit<Category, 'isCustom'>) => Promise<void>;
  removeCustomCategory: (id: string) => Promise<void>;
  hideDefaultCategory: (id: string) => Promise<void>;
  restoreDefaultCategory: (id: string) => Promise<void>;
  hiddenDefaultCategoryIds: string[];
  reload: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [hiddenDefaultCategoryIds, setHiddenDefaultCategoryIds] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedEntries, loadedCustom, loadedHidden] = await Promise.all([
        storage.getEntries(),
        storage.getCustomCategories(),
        storage.getHiddenDefaultCategoryIds(),
      ]);
      setEntries(loadedEntries);
      setCustomCategories(loadedCustom);
      setHiddenDefaultCategoryIds(loadedHidden);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const categories = useMemo(() => {
    const visibleDefaults = DEFAULT_CATEGORIES.filter((c) => !hiddenDefaultCategoryIds.includes(c.id));
    return [...visibleDefaults, ...customCategories];
  }, [customCategories, hiddenDefaultCategoryIds]);

  const addEntry = useCallback(async (input: Omit<Entry, 'id' | 'createdAt'>) => {
    const entry: Entry = { ...input, id: generateId(), createdAt: new Date().toISOString() };
    const next = await storage.addEntry(entry);
    setEntries(next);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const next = await storage.deleteEntry(id);
    setEntries(next);
  }, []);

  const addCustomCategory = useCallback(async (input: Omit<Category, 'isCustom'>) => {
    const next = [...customCategories, { ...input, isCustom: true }];
    await storage.saveCustomCategories(next);
    setCustomCategories(next);
  }, [customCategories]);

  const removeCustomCategory = useCallback(async (id: string) => {
    const next = customCategories.filter((c) => c.id !== id);
    await storage.saveCustomCategories(next);
    setCustomCategories(next);
  }, [customCategories]);

  const hideDefaultCategory = useCallback(async (id: string) => {
    const next = Array.from(new Set([...hiddenDefaultCategoryIds, id]));
    await storage.saveHiddenDefaultCategoryIds(next);
    setHiddenDefaultCategoryIds(next);
  }, [hiddenDefaultCategoryIds]);

  const restoreDefaultCategory = useCallback(async (id: string) => {
    const next = hiddenDefaultCategoryIds.filter((x) => x !== id);
    await storage.saveHiddenDefaultCategoryIds(next);
    setHiddenDefaultCategoryIds(next);
  }, [hiddenDefaultCategoryIds]);

  const clearAll = useCallback(async () => {
    await storage.clearAllData();
    await reload();
  }, [reload]);

  const value: EntriesContextValue = {
    loading,
    entries,
    categories,
    addEntry,
    deleteEntry,
    addCustomCategory,
    removeCustomCategory,
    hideDefaultCategory,
    restoreDefaultCategory,
    hiddenDefaultCategoryIds,
    reload,
    clearAll,
  };

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntries(): EntriesContextValue {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used within an EntriesProvider');
  return ctx;
}
