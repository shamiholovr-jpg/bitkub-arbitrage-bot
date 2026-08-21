import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEntries } from '../context/EntriesContext';
import { EntryCard } from '../components/EntryCard';
import { getCategoryById } from '../constants/categories';
import { Entry } from '../types';

interface FilterOption {
  id: string | null;
  label: string;
  emoji: string;
  color: string;
}

export function HistoryScreen() {
  const { entries, categories, deleteEntry } = useEntries();
  const [filterId, setFilterId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
    return filterId ? sorted.filter((e) => e.categoryId === filterId) : sorted;
  }, [entries, filterId]);

  const onDelete = (entry: Entry) => {
    Alert.alert('Удалить запись?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const filterOptions: FilterOption[] = [{ id: null, label: 'Все', emoji: '📋', color: '#1C1C1E' }, ...categories];

  return (
    <View style={styles.screen}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterOptions}
        keyExtractor={(item) => item.id ?? 'all'}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = filterId === item.id;
          return (
            <TouchableOpacity
              style={[styles.filterChip, { borderColor: item.color }, active && { backgroundColor: item.color }]}
              onPress={() => setFilterId(item.id)}
            >
              <Text style={[styles.filterChipText, { color: active ? '#fff' : item.color }]}>
                {item.emoji} {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <EntryCard entry={item} category={getCategoryById(categories, item.categoryId)} onDelete={() => onDelete(item)} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Записей не найдено.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FA' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  emptyText: { fontSize: 14, color: '#8A8A8E', textAlign: 'center', marginTop: 40 },
});
