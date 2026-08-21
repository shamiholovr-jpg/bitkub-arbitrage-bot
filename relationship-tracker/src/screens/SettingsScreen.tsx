import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEntries } from '../context/EntriesContext';
import { clearApiKey, getApiKey, setApiKey } from '../storage/secureStorage';
import { exportAllData, importAllData, saveAdvisorHistory } from '../storage/storage';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORY_COLORS } from '../constants/categories';
import { generateId } from '../utils/id';

export function SettingsScreen() {
  const { categories, hiddenDefaultCategoryIds, addCustomCategory, removeCustomCategory, hideDefaultCategory, restoreDefaultCategory, clearAll } = useEntries();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [importText, setImportText] = useState('');

  useEffect(() => {
    (async () => {
      const stored = await getApiKey();
      setHasStoredKey(!!stored);
      if (stored) setApiKeyInput(stored);
    })();
  }, []);

  const onSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Введите ключ', 'Вставьте API-ключ Anthropic, начинающийся с "sk-ant-".');
      return;
    }
    await setApiKey(apiKeyInput.trim());
    setHasStoredKey(true);
    Alert.alert('Готово', 'Ключ сохранён локально на устройстве.');
  };

  const onClearKey = async () => {
    await clearApiKey();
    setApiKeyInput('');
    setHasStoredKey(false);
  };

  const onAddCategory = async () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const color = CUSTOM_CATEGORY_COLORS[categories.length % CUSTOM_CATEGORY_COLORS.length];
    await addCustomCategory({ id: generateId(), label, description: '', color, emoji: '✨', severity: 2 });
    setNewCategoryLabel('');
  };

  const onExport = async () => {
    const data = await exportAllData();
    try {
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'Резервная копия трекера отношений' });
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось поделиться файлом.');
    }
  };

  const onImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      await importAllData(parsed);
      setImportText('');
      Alert.alert('Готово', 'Данные импортированы. Перейдите на другую вкладку и вернитесь, чтобы увидеть их.');
    } catch (e: any) {
      Alert.alert('Не получилось импортировать', e?.message ?? 'Проверьте формат JSON.');
    }
  };

  const onClearAll = () => {
    Alert.alert('Удалить все данные?', 'Все записи, категории и история советника будут удалены безвозвратно.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить всё',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          await saveAdvisorHistory([]);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="AI-советник (Claude API)">
        <Text style={styles.helpText}>
          Ключ хранится только на этом устройстве (в защищённом хранилище) и используется для прямых запросов к
          api.anthropic.com. Получить ключ можно в консоли Anthropic (console.anthropic.com).
        </Text>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          autoCapitalize="none"
          secureTextEntry
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={onSaveKey}>
            <Text style={styles.primaryButtonText}>Сохранить ключ</Text>
          </TouchableOpacity>
          {hasStoredKey ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={onClearKey}>
              <Text style={styles.secondaryButtonText}>Удалить</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.statusText}>{hasStoredKey ? '✅ Ключ сохранён' : 'Ключ не задан'}</Text>
      </Section>

      <Section title="Категории">
        {DEFAULT_CATEGORIES.map((c) => {
          const hidden = hiddenDefaultCategoryIds.includes(c.id);
          return (
            <View key={c.id} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>
                {c.emoji} {c.label}
              </Text>
              <Switch value={!hidden} onValueChange={(v) => (v ? restoreDefaultCategory(c.id) : hideDefaultCategory(c.id))} />
            </View>
          );
        })}
        {categories
          .filter((c) => c.isCustom)
          .map((c) => (
            <View key={c.id} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>
                {c.emoji} {c.label}
              </Text>
              <TouchableOpacity onPress={() => removeCustomCategory(c.id)}>
                <Text style={styles.deleteLink}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ))}
        <View style={styles.addCategoryRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Своя категория, напр. Ревность"
            value={newCategoryLabel}
            onChangeText={setNewCategoryLabel}
          />
          <TouchableOpacity style={styles.primaryButtonSmall} onPress={onAddCategory}>
            <Text style={styles.primaryButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </Section>

      <Section title="Данные">
        <TouchableOpacity style={styles.secondaryButton} onPress={onExport}>
          <Text style={styles.secondaryButtonText}>Экспортировать (JSON)</Text>
        </TouchableOpacity>
        <Text style={[styles.helpText, { marginTop: 10 }]}>Импорт: вставьте ранее экспортированный JSON</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="{ ... }"
          value={importText}
          onChangeText={setImportText}
          multiline
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={onImport}>
          <Text style={styles.secondaryButtonText}>Импортировать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={onClearAll}>
          <Text style={styles.dangerButtonText}>Удалить все данные</Text>
        </TouchableOpacity>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FA' },
  content: { padding: 16, paddingBottom: 40, gap: 20 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  helpText: { fontSize: 12, color: '#8A8A8E', lineHeight: 17 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: '#1C1C1E', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  primaryButtonSmall: { backgroundColor: '#1C1C1E', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#1C1C1E', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#1C1C1E', fontWeight: '700' },
  dangerButton: { borderWidth: 1, borderColor: '#D64545', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  dangerButtonText: { color: '#D64545', fontWeight: '700' },
  statusText: { fontSize: 12, color: '#8A8A8E' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  categoryLabel: { fontSize: 14, color: '#1C1C1E' },
  deleteLink: { fontSize: 13, color: '#D64545', fontWeight: '600' },
  addCategoryRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
