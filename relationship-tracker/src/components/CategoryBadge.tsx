import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Category } from '../types';

export function CategoryBadge({ category, size = 'medium' }: { category: Category; size?: 'small' | 'medium' }) {
  const small = size === 'small';
  return (
    <View
      style={[
        styles.badge,
        small && styles.badgeSmall,
        { backgroundColor: withAlpha(category.color, 0.16), borderColor: withAlpha(category.color, 0.4) },
      ]}
    >
      <Text style={small ? styles.emojiSmall : styles.emoji}>{category.emoji}</Text>
      <Text style={[styles.label, small && styles.labelSmall, { color: category.color }]} numberOfLines={1}>
        {category.label}
      </Text>
    </View>
  );
}

function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  badgeSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  emoji: { fontSize: 14 },
  emojiSmall: { fontSize: 11 },
  label: { fontWeight: '600', fontSize: 13 },
  labelSmall: { fontSize: 11 },
});
