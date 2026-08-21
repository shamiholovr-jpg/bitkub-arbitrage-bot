import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function StatCard({
  title,
  value,
  subtitle,
  accentColor = '#5B9BD5',
}: {
  title: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderLeftWidth: 4,
    flex: 1,
  },
  title: { fontSize: 12, color: '#8A8A8E', marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 12, color: '#8A8A8E', marginTop: 2 },
});
