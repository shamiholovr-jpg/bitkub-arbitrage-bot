// Core data model for the relationship tracker.

/** A category of relationship event the user can log (conflict-oriented by default). */
export interface Category {
  /** Stable identifier, used as storage key. Slug-like, lowercase. */
  id: string;
  /** Display name shown in the UI (Russian by default, user-editable for custom ones). */
  label: string;
  /** Short helper text shown under the label when picking a category. */
  description: string;
  /** Hex color used for badges/charts. */
  color: string;
  /** Emoji shown next to the label. */
  emoji: string;
  /** How "heavy" this category is, 1 (light) to 5 (severe). Drives the friction score. */
  severity: number;
  /** Custom categories can be deleted by the user; defaults cannot. */
  isCustom?: boolean;
}

/** A single logged event ("today: misunderstanding"). */
export interface Entry {
  id: string;
  categoryId: string;
  /** Calendar date the event happened, ISO "yyyy-MM-dd" (not a timestamp). */
  date: string;
  /** When the record was created, ISO datetime. */
  createdAt: string;
  /** Short free-text reason ("what happened"). Optional. */
  reason?: string;
  /** Longer free-text notes. Optional. */
  note?: string;
  /** Subjective intensity, 1 (barely noticeable) to 5 (very intense). */
  intensity: number;
}

/** One turn in the AI advisor conversation, persisted locally. */
export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
