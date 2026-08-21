import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Category } from '../types';

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((c) => {
        const selected = c.id === selectedId;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelect(c.id)}
            style={[
              styles.chip,
              { borderColor: c.color },
              selected && { backgroundColor: c.color },
            ]}
          >
            <Text style={styles.emoji}>{c.emoji}</Text>
            <Text style={[styles.label, { color: selected ? '#fff' : c.color }]}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  emoji: { fontSize: 15 },
  label: { fontWeight: '600', fontSize: 13 },
});
