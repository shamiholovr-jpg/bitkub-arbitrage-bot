import * as SecureStore from 'expo-secure-store';

const API_KEY_STORE_KEY = 'anthropic_api_key';

/**
 * The Claude API key lives in the device's secure storage (Keychain on iOS,
 * Keystore-backed EncryptedSharedPreferences on Android) — it never leaves
 * the device except in requests the user's own device makes directly to
 * Anthropic's API. There is no backend in this app that could leak it.
 */
export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_KEY_STORE_KEY);
  } catch (e) {
    console.warn('Не удалось прочитать ключ из SecureStore:', e);
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORE_KEY, key.trim());
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORE_KEY);
}
