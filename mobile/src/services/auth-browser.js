import * as WebBrowser from 'expo-web-browser';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export function maybeCompleteAuthSession() {
  WebBrowser.maybeCompleteAuthSession();
}

export async function openAuthSession(handleAuthResult) {
  const authUrl = `${API_URL}/api/auth/google/start`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, 'chelseapoker://auth');
  if (result.type === 'success' && result.url) {
    await handleAuthResult(result.url);
  }
}
