import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEntries } from '../context/EntriesContext';
import { CategoryPicker } from '../components/CategoryPicker';
import { RootStackParamList } from '../navigation/types';
import { isValidIsoDate, todayIso, yesterdayIso } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

export function AddEntryScreen({ navigation, route }: Props) {
  const { categories, addEntry } = useEntries();
  const [categoryId, setCategoryId] = useState<string | null>(route.params?.initialCategoryId ?? categories[0]?.id ?? null);
  const [date, setDate] = useState(todayIso());
  const [customDateText, setCustomDateText] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [intensity, setIntensity] = useState(3);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const effectiveDate = useCustomDate ? customDateText : date;
  const dateIsValid = isValidIsoDate(effectiveDate);

  const onSave = async () => {
    if (!categoryId) {
      Alert.alert('Выберите категорию', 'Нужно выбрать, что произошло.');
      return;
    }
    if (!dateIsValid) {
      Alert.alert('Неверная дата', 'Укажите дату в формате ГГГГ-ММ-ДД.');
      return;
    }
    setSaving(true);
    try {
      await addEntry({
        categoryId,
        date: effectiveDate,
        intensity,
        reason: reason.trim() || undefined,
        note: note.trim() || undefined,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Категория</Text>
        <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />

        <Text style={styles.label}>Когда</Text>
        <View style={styles.dateRow}>
          <DateChip label="Сегодня" active={!useCustomDate && date === todayIso()} onPress={() => { setUseCustomDate(false); setDate(todayIso()); }} />
          <DateChip label="Вчера" active={!useCustomDate && date === yesterdayIso()} onPress={() => { setUseCustomDate(false); setDate(yesterdayIso()); }} />
          <DateChip label="Другая дата" active={useCustomDate} onPress={() => { setUseCustomDate(true); setCustomDateText(date); }} />
        </View>
        {useCustomDate ? (
          <TextInput
            style={styles.input}
            placeholder="ГГГГ-ММ-ДД, напр. 2026-08-15"
            value={customDateText}
            onChangeText={setCustomDateText}
            autoCapitalize="none"
          />
        ) : null}

        <Text style={styles.label}>Интенсивность: {intensity}/5</Text>
        <View style={styles.intensityRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.intensityButton, n <= intensity && styles.intensityButtonActive]}
              onPress={() => setIntensity(n)}
            >
              <Text style={[styles.intensityText, n <= intensity && styles.intensityTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Что произошло? (коротко)</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: не согласовали планы на выходные"
          value={reason}
          onChangeText={setReason}
          maxLength={140}
        />

        <Text style={styles.label}>Заметка (необязательно)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Подробности, если хочется зафиксировать — это поможет советнику видеть контекст"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={onSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Сохраняю…' : 'Сохранить'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DateChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.dateChip, active && styles.dateChipActive]} onPress={onPress}>
      <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40, gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateChip: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dateChipActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  dateChipText: { fontSize: 13, color: '#1C1C1E', fontWeight: '600' },
  dateChipTextActive: { color: '#fff' },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  intensityButtonActive: { backgroundColor: '#5B9BD5', borderColor: '#5B9BD5' },
  intensityText: { fontWeight: '700', color: '#1C1C1E' },
  intensityTextActive: { color: '#fff' },
  saveButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
