const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_IDS || '').split(',').map(s => s.trim());
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_TOKENINFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';

function getBaseUrl(req) {
  return process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function getWebClientId() {
  // The web client ID (used for server-side OAuth flow)
  return GOOGLE_CLIENT_ID.find(id => id.length > 0) || '';
}

// GET /api/auth/google/start — redirect user to Google sign-in
router.get('/google/start', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const clientId = process.env.GOOGLE_WEB_CLIENT_ID || getWebClientId();
  // Encode platform (web vs native) in state so callback knows how to respond
  const platform = req.query.platform || 'native';
  const state = Buffer.from(JSON.stringify({ platform })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback — handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.status(400).send('Authentication cancelled or failed.');
  }

  try {
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_WEB_CLIENT_ID || getWebClientId();
    const clientSecret = process.env.GOOGLE_WEB_CLIENT_SECRET;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return res.status(401).send('Token exchange failed.');
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    // Verify id_token
    const verifyResponse = await fetch(`${GOOGLE_TOKENINFO_ENDPOINT}?id_token=${idToken}`);
    if (!verifyResponse.ok) {
      return res.status(401).send('Token verification failed.');
    }

    const payload = await verifyResponse.json();
    const { sub: googleId, email, name, picture } = payload;

    // Upsert user
    const result = await pool.query(
      `INSERT INTO users (google_id, email, display_name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url
       RETURNING *`,
      [googleId, email, name || email, picture || null]
    );
    const user = result.rows[0];

    // Claim any unclaimed sessions
    await pool.query(
      'UPDATE sessions SET user_id = $1 WHERE user_id IS NULL',
      [user.id]
    );

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    };

    // Decode platform from state
    let platform = 'native';
    try {
      const stateObj = JSON.parse(Buffer.from(req.query.state || '', 'base64').toString());
      platform = stateObj.platform || 'native';
    } catch {}

    const appParams = new URLSearchParams({
      token,
      user: JSON.stringify(userData),
    });

    if (platform === 'web') {
      // For web: serve a page that posts the token back to the opener and closes
      const callbackUrl = `${getBaseUrl(req)}/auth/callback?${appParams}`;
      res.send(`<!DOCTYPE html><html><body><script>
        window.opener && window.opener.postMessage({type:'auth-callback',url:${JSON.stringify(callbackUrl)}}, window.opener.location.origin);
        window.close();
      </script></body></html>`);
    } else {
      res.redirect(`chelseapoker://auth?${appParams}`);
    }
  } catch (err) {
    console.error('Error in Google callback:', err);
    return res.status(500).send('Authentication failed.');
  }
});

// POST /api/auth/google — verify Google id_token directly (kept for flexibility)
router.post('/google', async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) {
    return res.status(400).json({ error: 'id_token is required' });
  }

  try {
    const response = await fetch(`${GOOGLE_TOKENINFO_ENDPOINT}?id_token=${id_token}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = await response.json();

    if (GOOGLE_CLIENT_ID.length > 0 && GOOGLE_CLIENT_ID[0] !== '' && !GOOGLE_CLIENT_ID.includes(payload.aud)) {
      return res.status(401).json({ error: 'Token audience mismatch' });
    }

    const { sub: googleId, email, name, picture } = payload;

    const result = await pool.query(
      `INSERT INTO users (google_id, email, display_name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url
       RETURNING *`,
      [googleId, email, name || email, picture || null]
    );
    const user = result.rows[0];

    await pool.query(
      'UPDATE sessions SET user_id = $1 WHERE user_id IS NULL',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Error in Google auth:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me — get current user info
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
