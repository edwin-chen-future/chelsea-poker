import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';
import { getItem, setItem, deleteItem } from '../services/storage';
import { maybeCompleteAuthSession, openAuthSession } from '../services/auth-browser';

maybeCompleteAuthSession();

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem(TOKEN_KEY);
        const userJson = await getItem(USER_KEY);
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

  async function handleAuthResult(url) {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    const userJson = parsed.searchParams.get('user');

    if (token && userJson) {
      const userData = JSON.parse(userJson);
      setAuthToken(token);
      setUser(userData);
      await setItem(TOKEN_KEY, token);
      await setItem(USER_KEY, JSON.stringify(userData));
    }
  }

  async function signIn() {
    try {
      await openAuthSession(handleAuthResult);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  }

  async function signOut() {
    setUser(null);
    setAuthToken(null);
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
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
