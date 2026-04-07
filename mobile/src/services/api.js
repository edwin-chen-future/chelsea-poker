// Set EXPO_PUBLIC_API_URL in a .env file to point at a different backend.
// For local development: http://localhost:3000
// For production: https://chelsea-poker.onrender.com (or your Render URL)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// Auth

export async function postGoogleAuth(idToken) {
  const response = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!response.ok) {
    let message;
    try {
      const body = await response.json();
      message = body.error || `Auth failed: ${response.status}`;
    } catch {
      message = `Auth failed: ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json();
}

// Sessions

export async function getSessions({ limit = 20, offset = 0 } = {}) {
  const response = await fetch(`${BASE_URL}/api/sessions?limit=${limit}&offset=${offset}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  return response.json();
}

export async function getAllSessions() {
  let all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const response = await fetch(`${BASE_URL}/api/sessions?limit=${limit}&offset=${offset}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.status}`);
    }
    const data = await response.json();
    all = all.concat(data.sessions);
    if (all.length >= data.total) break;
    offset += limit;
  }
  return all;
}

export async function updateSession(id, sessionData) {
  const response = await fetch(`${BASE_URL}/api/sessions/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(sessionData),
  });
  if (!response.ok) {
    let message;
    try {
      const body = await response.json();
      message = body.error || `Request failed: ${response.status}`;
    } catch {
      message = `Request failed: ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json();
}

export async function createSession(sessionData) {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(sessionData),
  });
  if (!response.ok) {
    let message;
    try {
      const body = await response.json();
      message = body.error || `Request failed: ${response.status}`;
    } catch {
      message = `Request failed: ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json();
}
