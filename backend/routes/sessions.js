const express = require('express');
const router = express.Router();
const { insertSession, getAllSessions } = require('../db');

function validateSession({ stake, duration_minutes, amount, location }) {
  const errors = [];

  if (!stake || typeof stake !== 'string' || stake.trim() === '') {
    errors.push('stake is required and must be a non-empty string');
  }

  if (duration_minutes === undefined || duration_minutes === null) {
    errors.push('duration_minutes is required');
  } else if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) {
    errors.push('duration_minutes must be a positive integer');
  }

  if (amount === undefined || amount === null) {
    errors.push('amount is required');
  } else if (!Number.isInteger(amount)) {
    errors.push('amount must be an integer');
  }

  if (!location || typeof location !== 'string' || location.trim() === '') {
    errors.push('location is required and must be a non-empty string');
  }

  return errors;
}

router.post('/', (req, res) => {
  const { stake, duration_minutes, amount, location } = req.body;
  const errors = validateSession({ stake, duration_minutes, amount, location });

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  try {
    const session = insertSession({
      stake: stake.trim(),
      duration_minutes,
      amount,
      location: location.trim(),
    });
    return res.status(201).json(session);
  } catch (err) {
    console.error('Failed to insert session:', err);
    return res.status(500).json({ error: 'Failed to save session' });
  }
});

router.get('/', (req, res) => {
  try {
    const sessions = getAllSessions();
    return res.status(200).json(sessions);
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;
