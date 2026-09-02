import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_KEY_STORE_KEY = 'anthropic_api_key';

/**
 * The Claude API key never leaves the device except in requests the user's
 * own device/browser makes directly to Anthropic's API — there is no backend
 * in this app that could leak it.
 *
 * On native (iOS/Android) it lives in the platform's secure storage
 * (Keychain / Keystore-backed EncryptedSharedPreferences) via expo-secure-store,
 * which has no web implementation. On web we fall back to localStorage —
 * still private to this browser profile, just not hardware-backed.
 */
const isWeb = Platform.OS === 'web';

export async function getApiKey(): Promise<string | null> {
  try {
    if (isWeb) return window.localStorage.getItem(API_KEY_STORE_KEY);
    return await SecureStore.getItemAsync(API_KEY_STORE_KEY);
  } catch (e) {
    console.warn('Не удалось прочитать ключ из хранилища:', e);
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (isWeb) {
    window.localStorage.setItem(API_KEY_STORE_KEY, trimmed);
    return;
  }
  await SecureStore.setItemAsync(API_KEY_STORE_KEY, trimmed);
}

export async function clearApiKey(): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(API_KEY_STORE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(API_KEY_STORE_KEY);
}
