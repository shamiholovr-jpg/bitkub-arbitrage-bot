import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEntries } from '../context/EntriesContext';
import { CategoryBadge } from '../components/CategoryBadge';
import { EntryCard } from '../components/EntryCard';
import { StatCard } from '../components/StatCard';
import { FRICTION_LEVEL_EMOJI, FRICTION_LEVEL_LABEL, frictionLevel, frictionScore } from '../utils/stats';
import { getCategoryById } from '../constants/categories';
import { RootStackParamList, TabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function DashboardScreen({ navigation }: Props) {
  const { entries, categories, loading, reload } = useEntries();

  const score = useMemo(() => frictionScore(entries, categories, 7), [entries, categories]);
  const level = frictionLevel(score);
  const recent = entries.slice(0, 4);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
    >
      <Text style={styles.heading}>Как сегодня?</Text>
      <Text style={styles.subheading}>Отметьте, что произошло — это займёт секунду</Text>

      <View style={styles.quickGrid}>
        {categories.slice(0, 4).map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.quickCell}
            onPress={() => navigation.navigate('AddEntry', { initialCategoryId: c.id })}
          >
            <CategoryBadge category={c} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEntry', undefined)}>
        <Text style={styles.addButtonText}>+ Добавить запись</Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <StatCard
          title="Напряжение за 7 дней"
          value={`${FRICTION_LEVEL_EMOJI[level]} ${FRICTION_LEVEL_LABEL[level]}`}
          subtitle={`Индекс: ${score}/100`}
          accentColor={score > 55 ? '#D64545' : score > 30 ? '#ED7D3A' : score > 10 ? '#F2B134' : '#6FCF97'}
        />
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Недавние записи</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'History' })}>
          <Text style={styles.link}>Вся история →</Text>
        </TouchableOpacity>
      </View>

      {recent.length === 0 ? (
        <Text style={styles.emptyText}>Пока нет записей. Добавьте первую выше — так начнёт собираться статистика.</Text>
      ) : (
        recent.map((e) => <EntryCard key={e.id} entry={e} category={getCategoryById(categories, e.categoryId)} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FA' },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  subheading: { fontSize: 14, color: '#8A8A8E', marginBottom: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCell: {},
  addButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  link: { fontSize: 13, color: '#5B9BD5', fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#8A8A8E', paddingVertical: 12 },
});
