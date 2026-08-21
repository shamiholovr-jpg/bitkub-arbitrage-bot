import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart, PieChart, StackedBarChart } from 'react-native-chart-kit';
import { useEntries } from '../context/EntriesContext';
import { StatCard } from '../components/StatCard';
import {
  FRICTION_LEVEL_EMOJI,
  FRICTION_LEVEL_LABEL,
  categoryTotals,
  dailyFrictionSeries,
  frictionLevel,
  frictionTrend,
  weeklyBreakdown,
} from '../utils/stats';
import { getCategoryById } from '../constants/categories';
import { formatShort } from '../utils/date';

const WINDOWS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
];

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32;

export function StatsScreen() {
  const { entries, categories } = useEntries();
  const [windowDays, setWindowDays] = useState(30);

  const trend = useMemo(() => frictionTrend(entries, categories, windowDays), [entries, categories, windowDays]);
  const level = frictionLevel(trend.current);
  const totals = useMemo(() => categoryTotals(entries, windowDays), [entries, windowDays]);
  const series = useMemo(() => dailyFrictionSeries(entries, categories, windowDays), [entries, categories, windowDays]);
  const weeks = useMemo(() => weeklyBreakdown(entries, 8), [entries]);

  const totalCount = Object.values(totals).reduce((a, b) => a + b, 0);

  const pieData = categories
    .map((c) => ({
      name: c.label,
      count: totals[c.id] ?? 0,
      color: c.color,
      legendFontColor: '#4A4A4A',
      legendFontSize: 12,
    }))
    .filter((d) => d.count > 0);

  const lineLabels = series
    .map((p, i) => (i % Math.max(1, Math.floor(series.length / 5)) === 0 ? formatShort(p.dateIso) : ''));

  const stackedLegend = categories.map((c) => c.label);
  const stackedColors = categories.map((c) => c.color);
  const stackedData = weeks.map((w) => categories.map((c) => w.totalsByCategory[c.id] ?? 0));
  const stackedLabels = weeks.map((w) => w.label);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.windowRow}>
        {WINDOWS.map((w) => (
          <TouchableOpacity
            key={w.days}
            style={[styles.windowChip, windowDays === w.days && styles.windowChipActive]}
            onPress={() => setWindowDays(w.days)}
          >
            <Text style={[styles.windowChipText, windowDays === w.days && styles.windowChipTextActive]}>{w.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Индекс напряжения"
          value={`${FRICTION_LEVEL_EMOJI[level]} ${trend.current}/100`}
          subtitle={FRICTION_LEVEL_LABEL[level]}
        />
        <StatCard
          title="Динамика"
          value={trend.worsened == null ? '— без изменений' : trend.worsened ? `▲ +${trend.deltaPoints}` : `▼ ${trend.deltaPoints}`}
          subtitle={trend.worsened == null ? 'то же, что раньше' : trend.worsened ? 'стало напряжённее' : 'стало спокойнее'}
          accentColor={trend.worsened ? '#D64545' : '#6FCF97'}
        />
      </View>

      {totalCount === 0 ? (
        <Text style={styles.emptyText}>
          За этот период записей нет. Добавляйте события на вкладке «Дашборд» — здесь появится динамика.
        </Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Тренд напряжения (скользящее среднее за 7 дней)</Text>
          <LineChart
            data={{ labels: lineLabels, datasets: [{ data: series.map((p) => p.score) }] }}
            width={chartWidth}
            height={200}
            fromZero
            yAxisSuffix=""
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />

          <Text style={styles.sectionTitle}>Распределение по категориям</Text>
          <PieChart
            data={pieData}
            width={chartWidth}
            height={190}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="8"
            chartConfig={chartConfig}
          />

          <Text style={styles.sectionTitle}>По неделям (последние 8 недель)</Text>
          <StackedBarChart
            data={{ labels: stackedLabels, legend: stackedLegend, data: stackedData, barColors: stackedColors }}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            hideLegend={false}
          />
        </>
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(91, 155, 213, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(74, 74, 74, ${opacity})`,
  propsForDots: { r: '3' },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FA' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  windowRow: { flexDirection: 'row', gap: 8 },
  windowChip: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  windowChipActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  windowChipText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  windowChipTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginTop: 12 },
  chart: { borderRadius: 14 },
  emptyText: { fontSize: 14, color: '#8A8A8E', marginTop: 24, textAlign: 'center' },
});
