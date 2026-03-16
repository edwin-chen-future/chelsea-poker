/**
 * Tests for POST /api/sessions and GET /api/sessions.
 *
 * We mock the `pg` module so tests run without a real database.
 * The mock factory exposes a query spy via _getMockQuery() to avoid
 * variable-hoisting issues with jest.mock.
 */

// Must set env var before db.js is loaded (it throws if missing)
process.env.TEST_DATABASE_URL = 'postgresql://mock/testdb';
process.env.NODE_ENV = 'test';

// Jest hoists jest.mock() above all requires, so we cannot reference outer
// variables inside the factory. Instead we expose the spy via a helper.
jest.mock('pg', () => {
  const mockQueryFn = jest.fn();
  return {
    Pool: jest.fn().mockImplementation(() => ({ query: mockQueryFn })),
    _getMockQuery: () => mockQueryFn,
  };
});

const request = require('supertest');
const pg = require('pg');
const mockQuery = pg._getMockQuery();
// server.js exports app without starting the HTTP server (only runs when main)
const app = require('../server');

// Valid payload used across many tests
const validSession = {
  stake: '1/2',
  duration_minutes: 180,
  result_amount: 250.5,
  location: 'Wynn',
  session_date: '2026-03-16',
  notes: 'Great night',
};

// A row the DB would return after INSERT … RETURNING *
const dbRow = {
  id: 1,
  stake: '1/2',
  duration_minutes: 180,
  result_amount: '250.50',
  location: 'Wynn',
  session_date: '2026-03-16',
  notes: 'Great night',
  created_at: '2026-03-16T12:00:00.000Z',
};

beforeEach(() => {
  mockQuery.mockReset();
});

// ─── POST /api/sessions ───────────────────────────────────────────────────────

describe('POST /api/sessions', () => {
  test('201 — saves a valid session and returns the created record', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const res = await request(app).post('/api/sessions').send(validSession);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.stake).toBe('1/2');
    expect(res.body.location).toBe('Wynn');
  });

  test('201 — saves session without optional notes field', async () => {
    const { notes, ...withoutNotes } = validSession;
    mockQuery.mockResolvedValueOnce({ rows: [{ ...dbRow, notes: null }] });

    const res = await request(app).post('/api/sessions').send(withoutNotes);

    expect(res.status).toBe(201);
    expect(res.body.notes).toBeNull();
  });

  test('201 — accepts a negative result_amount (a loss)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...dbRow, result_amount: '-150.00' }] });

    const res = await request(app).post('/api/sessions').send({ ...validSession, result_amount: -150 });

    expect(res.status).toBe(201);
    expect(res.body.result_amount).toBe('-150.00');
  });

  test('400 — rejects missing stake', async () => {
    const { stake, ...payload } = validSession;
    const res = await request(app).post('/api/sessions').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stake/i);
  });

  test('400 — rejects empty stake string', async () => {
    const res = await request(app).post('/api/sessions').send({ ...validSession, stake: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stake/i);
  });

  test('400 — rejects missing duration_minutes', async () => {
    const { duration_minutes, ...payload } = validSession;
    const res = await request(app).post('/api/sessions').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/duration/i);
  });

  test('400 — rejects zero duration_minutes', async () => {
    const res = await request(app).post('/api/sessions').send({ ...validSession, duration_minutes: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/duration/i);
  });

  test('400 — rejects non-numeric duration_minutes', async () => {
    const res = await request(app).post('/api/sessions').send({ ...validSession, duration_minutes: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/duration/i);
  });

  test('400 — rejects missing result_amount', async () => {
    const { result_amount, ...payload } = validSession;
    const res = await request(app).post('/api/sessions').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/result_amount/i);
  });

  test('400 — rejects non-numeric result_amount', async () => {
    const res = await request(app).post('/api/sessions').send({ ...validSession, result_amount: 'win' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/result_amount/i);
  });

  test('400 — rejects missing location', async () => {
    const { location, ...payload } = validSession;
    const res = await request(app).post('/api/sessions').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/location/i);
  });

  test('400 — rejects missing session_date', async () => {
    const { session_date, ...payload } = validSession;
    const res = await request(app).post('/api/sessions').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/session_date/i);
  });

  test('500 — returns error when DB insert fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).post('/api/sessions').send(validSession);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to save/i);
  });
});

// ─── GET /api/sessions ────────────────────────────────────────────────────────

describe('GET /api/sessions', () => {
  test('200 — returns a list of sessions', async () => {
    const sessions = [dbRow, { ...dbRow, id: 2, result_amount: '-50.00' }];
    mockQuery.mockResolvedValueOnce({ rows: sessions });

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe(1);
  });

  test('200 — returns empty array when no sessions exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('500 — returns error when DB query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Query failed'));

    const res = await request(app).get('/api/sessions');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch/i);
  });
});
