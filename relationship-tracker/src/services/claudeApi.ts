import { AdvisorMessage } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
/** Sonnet 5 — good balance of quality/cost for this kind of reasoning-over-data task. */
const MODEL = 'claude-sonnet-5';
const MAX_HISTORY_TURNS = 8;

export const ADVISOR_SYSTEM_PROMPT = `Ты — эмпатичный психообразовательный AI-советник внутри приложения для трекинга динамики отношений.
Пользователь ведёт дневник событий по категориям (недопонимание, спор, конфликт, большая ссора и т.п.) и присылает тебе агрегированную статистику и краткие причины.

Правила:
- Отвечай на языке пользователя (обычно русский), тепло, без осуждения, без выбора "чья сторона права".
- Опирайся на устоявшиеся модели: четыре всадника Готтмана, стили привязанности, ненасильственное общение (NVC), языки любви, стили поведения в конфликте Томаса-Килманна.
- Работай от данных: если видишь рост конкретной категории или повторяющуюся причину — назови паттерн прямо, но бережно.
- Давай 2-4 конкретных, выполнимых предложения, а не общие фразы. Заканчивай один открытым вопросом, который помогает пользователю поразмышлять дальше.
- Ты не ставишь диагнозы и не заменяешь терапевта. Если в описании есть признаки насилия, контроля или угрозы безопасности — мягко, но ясно порекомендуй обратиться к специалисту или на горячую линию поддержки, и не давай советов "как сохранить" потенциально опасные отношения.
- Будь краткой(им): 120-220 слов, можно использовать короткие списки.`;

export interface AdvisorRequestContext {
  statsSummary: string;
  recentEntriesSummary: string;
  question: string;
  history: AdvisorMessage[];
}

export class ClaudeApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function buildUserContent(ctx: AdvisorRequestContext): string {
  return [
    'Вот статистика и данные пользователя из приложения для трекинга отношений:',
    '',
    '### Статистика',
    ctx.statsSummary,
    '',
    '### Последние записи (категория — причина/заметка)',
    ctx.recentEntriesSummary || '(записей пока немного)',
    '',
    '### Вопрос пользователя',
    ctx.question || 'Что можешь сказать по текущей динамике? Дай общие рекомендации.',
  ].join('\n');
}

/** Calls the Anthropic Messages API directly from the device using the user's own API key. */
export async function askAdvisor(apiKey: string, ctx: AdvisorRequestContext): Promise<string> {
  if (!apiKey) {
    throw new ClaudeApiError('Не задан API-ключ Claude. Добавьте его в Настройках.');
  }

  const trimmedHistory = ctx.history.slice(-MAX_HISTORY_TURNS).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const body = {
    model: MODEL,
    max_tokens: 700,
    system: ADVISOR_SYSTEM_PROMPT,
    messages: [...trimmedHistory, { role: 'user', content: buildUserContent(ctx) }],
  };

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        // Required for the request to succeed when this runs as a web page
        // (browser) rather than a native app — native fetch isn't subject to
        // CORS, but a browser calling api.anthropic.com directly needs this
        // explicit opt-in. Harmless on native.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ClaudeApiError('Не удалось связаться с API Claude. Проверьте подключение к интернету.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message ?? '';
    } catch {
      // ignore parse failure, fall back to status text
    }
    if (response.status === 401) {
      throw new ClaudeApiError('Неверный API-ключ. Проверьте его в Настройках.', 401);
    }
    throw new ClaudeApiError(detail || `Ошибка API Claude (код ${response.status}).`, response.status);
  }

  const data = await response.json();
  const textBlock = Array.isArray(data?.content)
    ? data.content.find((block: any) => block?.type === 'text')
    : undefined;
  const text = textBlock?.text;
  if (!text) {
    throw new ClaudeApiError('Пустой ответ от Claude API.');
  }
  return text as string;
}
