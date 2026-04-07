const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// POST /api/sessions — record a new poker session
router.post('/', async (req, res) => {
  const { stake, duration_minutes, result_amount, location, session_date, notes } = req.body;

  if (!stake || typeof stake !== 'string' || stake.trim() === '') {
    return res.status(400).json({ error: 'stake is required and must be a non-empty string' });
  }
  if (duration_minutes == null || !Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0) {
    return res.status(400).json({ error: 'duration_minutes is required and must be a positive integer' });
  }
  if (result_amount == null || isNaN(Number(result_amount))) {
    return res.status(400).json({ error: 'result_amount is required and must be a number' });
  }
  if (!location || typeof location !== 'string' || location.trim() === '') {
    return res.status(400).json({ error: 'location is required and must be a non-empty string' });
  }
  if (!session_date || typeof session_date !== 'string' || session_date.trim() === '') {
    return res.status(400).json({ error: 'session_date is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (stake, duration_minutes, result_amount, location, session_date, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        stake.trim(),
        Number(duration_minutes),
        Number(result_amount),
        location.trim(),
        session_date.trim(),
        notes ? notes.trim() : null,
        req.user.userId,
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting session:', err);
    return res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions — list current user's sessions, newest first
router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  try {
    const [dataResult, statsResult] = await Promise.all([
      pool.query(
        'SELECT * FROM sessions WHERE user_id = $1 ORDER BY session_date DESC, created_at DESC LIMIT $2 OFFSET $3',
        [req.user.userId, limit, offset]
      ),
      pool.query(
        'SELECT COUNT(*) AS count, COALESCE(SUM(result_amount), 0) AS total_profit FROM sessions WHERE user_id = $1',
        [req.user.userId]
      ),
    ]);
    const stats = statsResult.rows[0];
    return res.json({
      sessions: dataResult.rows,
      total: parseInt(stats.count, 10),
      stats: {
        count: parseInt(stats.count, 10),
        totalProfit: parseFloat(stats.total_profit),
      },
    });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// PUT /api/sessions/:id — update an existing session (only own sessions)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { stake, duration_minutes, result_amount, location, session_date, notes } = req.body;

  if (!stake || typeof stake !== 'string' || stake.trim() === '') {
    return res.status(400).json({ error: 'stake is required and must be a non-empty string' });
  }
  if (duration_minutes == null || !Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0) {
    return res.status(400).json({ error: 'duration_minutes is required and must be a positive integer' });
  }
  if (result_amount == null || isNaN(Number(result_amount))) {
    return res.status(400).json({ error: 'result_amount is required and must be a number' });
  }
  if (!location || typeof location !== 'string' || location.trim() === '') {
    return res.status(400).json({ error: 'location is required and must be a non-empty string' });
  }
  if (!session_date || typeof session_date !== 'string' || session_date.trim() === '') {
    return res.status(400).json({ error: 'session_date is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE sessions
       SET stake = $1, duration_minutes = $2, result_amount = $3, location = $4, session_date = $5, notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        stake.trim(),
        Number(duration_minutes),
        Number(result_amount),
        location.trim(),
        session_date.trim(),
        notes ? notes.trim() : null,
        id,
        req.user.userId,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating session:', err);
    return res.status(500).json({ error: 'Failed to update session' });
  }
});

module.exports = router;
