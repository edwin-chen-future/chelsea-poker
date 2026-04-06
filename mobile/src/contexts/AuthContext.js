import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken, postGoogleAuth } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

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

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response]);

  async function handleGoogleToken(idToken) {
    try {
      setLoading(true);
      const data = await postGoogleAuth(idToken);
      setAuthToken(data.token);
      setUser(data.user);
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    } catch (err) {
      console.error('Auth failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    await promptAsync();
  }

  async function signOut() {
    setUser(null);
    setAuthToken(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, request }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
