import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userJson = await SecureStore.getItemAsync(USER_KEY);
        if (token && userJson) {
          setAuthToken(token);
          setUser(JSON.parse(userJson));
        }
      } catch {
        // Stored data invalid, ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function signIn() {
    try {
      const authUrl = `${API_URL}/api/auth/google/start`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'chelseapoker://auth'
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const userJson = url.searchParams.get('user');

        if (token && userJson) {
          const userData = JSON.parse(userJson);
          setAuthToken(token);
          setUser(userData);
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        }
      }
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  }

  async function signOut() {
    setUser(null);
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
