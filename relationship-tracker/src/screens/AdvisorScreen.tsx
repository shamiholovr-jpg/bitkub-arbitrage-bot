import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEntries } from '../context/EntriesContext';
import { AdvisorMessage, Category, Entry } from '../types';
import { getApiKey } from '../storage/secureStorage';
import { getAdvisorHistory, saveAdvisorHistory } from '../storage/storage';
import { ClaudeApiError, askAdvisor } from '../services/claudeApi';
import { PSYCH_CONCEPTS, ADVISOR_DISCLAIMER, PsychConcept } from '../constants/psychology';
import { categoryTotals, frictionLevel, frictionScore, FRICTION_LEVEL_LABEL } from '../utils/stats';
import { getCategoryById } from '../constants/categories';
import { generateId } from '../utils/id';
import { TabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<TabParamList, 'Advisor'>;
type Tab = 'ai' | 'library';

export function AdvisorScreen({ navigation }: Props) {
  const { entries, categories } = useEntries();
  const [tab, setTab] = useState<Tab>('ai');
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [checkingKey, setCheckingKey] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [key, history] = await Promise.all([getApiKey(), getAdvisorHistory()]);
      setApiKeyState(key);
      setMessages(history);
      setCheckingKey(false);
    })();
  }, []);

  // Re-check whenever the tab regains focus, so coming back from Settings after
  // saving a key updates this screen without a full reload.
  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      setApiKeyState(await getApiKey());
    });
    return unsub;
  }, [navigation]);

  const statsSummary = useMemo(() => buildStatsSummary(entries, categories), [entries, categories]);
  const recentEntriesSummary = useMemo(() => buildRecentEntriesSummary(entries, categories), [entries, categories]);

  const onSend = async () => {
    if (!apiKey) return;
    const userMessage: AdvisorMessage = {
      id: generateId(),
      role: 'user',
      content: question.trim() || 'Что можешь сказать по текущей динамике?',
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion('');
    setErrorText(null);
    setSending(true);
    try {
      const answer = await askAdvisor(apiKey, {
        statsSummary,
        recentEntriesSummary,
        question: userMessage.content,
        history: messages,
      });
      const assistantMessage: AdvisorMessage = {
        id: generateId(),
        role: 'assistant',
        content: answer,
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      await saveAdvisorHistory(finalMessages);
    } catch (e) {
      const message = e instanceof ClaudeApiError ? e.message : 'Не удалось получить ответ.';
      setErrorText(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.tabRow}>
        <TabButton label="🤖 AI-советник" active={tab === 'ai'} onPress={() => setTab('ai')} />
        <TabButton label="📚 Психология" active={tab === 'library'} onPress={() => setTab('library')} />
      </View>

      {tab === 'library' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.disclaimer}>{ADVISOR_DISCLAIMER}</Text>
          {PSYCH_CONCEPTS.map((c) => (
            <ConceptCard key={c.id} concept={c} />
          ))}
        </ScrollView>
      ) : checkingKey ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : !apiKey ? (
        <View style={styles.centered}>
          <Text style={styles.noKeyTitle}>Нужен API-ключ Claude</Text>
          <Text style={styles.noKeyText}>
            Советник использует Claude API, чтобы разбирать вашу статистику и давать рекомендации. Добавьте свой
            ключ Anthropic на вкладке «Настройки» — он хранится только на этом устройстве.
          </Text>
          <TouchableOpacity style={styles.goToSettings} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.goToSettingsText}>Перейти в настройки</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.disclaimer}>{ADVISOR_DISCLAIMER}</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Что увидит советник</Text>
              <Text style={styles.summaryText}>{statsSummary}</Text>
            </View>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>
                Задайте вопрос или просто нажмите «Спросить советника» — он проанализирует вашу статистику.
              </Text>
            ) : (
              messages.map((m) => (
                <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={m.role === 'user' ? styles.bubbleUserText : styles.bubbleAssistantText}>{m.content}</Text>
                </View>
              ))
            )}
            {sending ? (
              <View style={styles.centeredInline}>
                <ActivityIndicator />
                <Text style={styles.thinkingText}>Советник думает…</Text>
              </View>
            ) : null}
            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Спросите совет или опишите ситуацию…"
              value={question}
              onChangeText={setQuestion}
              multiline
            />
            <TouchableOpacity style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={onSend} disabled={sending}>
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ConceptCard({ concept }: { concept: PsychConcept }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.conceptCard} onPress={() => setExpanded((v) => !v)} activeOpacity={0.85}>
      <Text style={styles.conceptTitle}>
        {concept.emoji} {concept.title}
      </Text>
      <Text style={styles.conceptSummary}>{concept.summary}</Text>
      {expanded ? (
        <View style={{ marginTop: 8 }}>
          {concept.points.map((p, i) => (
            <Text key={i} style={styles.conceptPoint}>
              •  {p}
            </Text>
          ))}
          <Text style={styles.conceptSource}>{concept.source}</Text>
        </View>
      ) : (
        <Text style={styles.expandHint}>Развернуть</Text>
      )}
    </TouchableOpacity>
  );
}

function buildStatsSummary(entries: Entry[], categories: Category[]): string {
  const windows = [7, 30];
  const lines: string[] = [];
  for (const days of windows) {
    const score = frictionScore(entries, categories, days);
    const level = frictionLevel(score);
    const totals = categoryTotals(entries, days);
    const totalsText = categories.map((c) => `${c.label}: ${totals[c.id] ?? 0}`).join(', ');
    lines.push(`За последние ${days} дн.: индекс напряжения ${score}/100 (${FRICTION_LEVEL_LABEL[level]}). По категориям — ${totalsText}.`);
  }
  return lines.join('\n');
}

function buildRecentEntriesSummary(entries: Entry[], categories: Category[]): string {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
  return sorted
    .map((e) => {
      const cat = getCategoryById(categories, e.categoryId);
      const reason = e.reason ? ` — ${e.reason}` : '';
      return `${e.date}: ${cat?.label ?? e.categoryId} (интенсивность ${e.intensity}/5)${reason}`;
    })
    .join('\n');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FA' },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  tabButtonText: { fontWeight: '600', color: '#1C1C1E', fontSize: 13 },
  tabButtonTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  disclaimer: { fontSize: 12, color: '#8A8A8E', lineHeight: 17, marginBottom: 6 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  centeredInline: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  noKeyTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  noKeyText: { fontSize: 14, color: '#5A5A5E', textAlign: 'center', lineHeight: 20 },
  goToSettings: { marginTop: 8, backgroundColor: '#1C1C1E', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  goToSettingsText: { color: '#fff', fontWeight: '600' },
  summaryBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#8A8A8E', marginBottom: 4 },
  summaryText: { fontSize: 13, color: '#4A4A4A', lineHeight: 18 },
  emptyText: { fontSize: 14, color: '#8A8A8E', textAlign: 'center', marginTop: 20 },
  bubble: { borderRadius: 14, padding: 12, maxWidth: '92%' },
  bubbleUser: { backgroundColor: '#1C1C1E', alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EFEFEF' },
  bubbleUserText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleAssistantText: { color: '#1C1C1E', fontSize: 14, lineHeight: 20 },
  thinkingText: { fontSize: 12, color: '#8A8A8E' },
  errorText: { fontSize: 13, color: '#D64545', textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  conceptCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  conceptTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  conceptSummary: { fontSize: 13, color: '#5A5A5E', lineHeight: 18 },
  conceptPoint: { fontSize: 13, color: '#4A4A4A', lineHeight: 19, marginBottom: 2 },
  conceptSource: { fontSize: 11, color: '#B0B0B5', marginTop: 6, fontStyle: 'italic' },
  expandHint: { fontSize: 12, color: '#5B9BD5', marginTop: 6, fontWeight: '600' },
});
