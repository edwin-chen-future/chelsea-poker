const express = require('express');
const { pool } = require('../db');

const router = express.Router();

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
      `INSERT INTO sessions (stake, duration_minutes, result_amount, location, session_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        stake.trim(),
        Number(duration_minutes),
        Number(result_amount),
        location.trim(),
        session_date.trim(),
        notes ? notes.trim() : null,
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting session:', err);
    return res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions — list all sessions, newest first
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sessions ORDER BY session_date DESC, created_at DESC'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;
