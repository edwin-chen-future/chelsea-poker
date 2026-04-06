const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/google — verify Google id_token and return JWT
router.post('/google', async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) {
    return res.status(400).json({ error: 'id_token is required' });
  }

  try {
    // Verify token with Google
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = await response.json();

    // Validate audience matches our client ID(s)
    const clientIds = (process.env.GOOGLE_CLIENT_IDS || '').split(',').map(s => s.trim());
    if (clientIds.length > 0 && clientIds[0] !== '' && !clientIds.includes(payload.aud)) {
      return res.status(401).json({ error: 'Token audience mismatch' });
    }

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

    // Claim any unclaimed sessions for first-time user
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
