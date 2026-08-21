/**
 * Lightweight unique id generator. Not cryptographically strong — fine for
 * locally-scoped record ids (entries, categories, chat messages), which is
 * all this app needs, so we avoid pulling in a uuid + polyfill dependency.
 */
export function generateId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}
