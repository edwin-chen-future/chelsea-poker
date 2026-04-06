// Set EXPO_PUBLIC_API_URL in a .env file to point at a different backend.
// For local development: http://localhost:3000
// For production: https://chelsea-poker.onrender.com (or your Render URL)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getSessions() {
  const response = await fetch(`${BASE_URL}/api/sessions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  return response.json();
}

export async function updateSession(id, sessionData) {
  const response = await fetch(`${BASE_URL}/api/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
