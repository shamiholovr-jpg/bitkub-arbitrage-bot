import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Category, Entry } from '../types';
import { CategoryBadge } from './CategoryBadge';
import { formatHuman } from '../utils/date';

export function EntryCard({
  entry,
  category,
  onDelete,
}: {
  entry: Entry;
  category?: Category;
  onDelete?: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {category ? (
          <CategoryBadge category={category} size="small" />
        ) : (
          <Text style={styles.unknownCategory}>Категория удалена</Text>
        )}
        <Text style={styles.date}>{formatHuman(entry.date)}</Text>
      </View>
      {entry.reason ? <Text style={styles.reason}>{entry.reason}</Text> : null}
      {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
      <View style={styles.footerRow}>
        <View style={styles.intensityDots}>
          {[1, 2, 3, 4, 5].map((n) => (
            <View
              key={n}
              style={[
                styles.dot,
                { backgroundColor: n <= entry.intensity ? (category?.color ?? '#999') : '#E5E5E5' },
              ]}
            />
          ))}
        </View>
        {onDelete ? (
          <TouchableOpacity onPress={() => onDelete(entry.id)} hitSlop={8}>
            <Text style={styles.deleteText}>Удалить</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unknownCategory: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  date: { fontSize: 12, color: '#8A8A8E' },
  reason: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  note: { fontSize: 13, color: '#5A5A5E', marginBottom: 4 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  intensityDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  deleteText: { fontSize: 12, color: '#D64545', fontWeight: '600' },
});
