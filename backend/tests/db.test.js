const {
  getDb,
  insertSession,
  getAllSessions,
  getSessionById,
  closeDb,
} = require('../db');

const SAMPLE = {
  stake: '$1/$2',
  duration_minutes: 120,
  amount: 150,
  location: 'Test Casino',
};

afterEach(() => {
  closeDb();
});

describe('schema', () => {
  it('creates the sessions table on initialization', () => {
    const db = getDb();
    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
      )
      .get();
    expect(table).toBeDefined();
    expect(table.name).toBe('sessions');
  });
});

describe('insertSession', () => {
  it('inserts a session and returns it with a generated id', () => {
    const session = insertSession(SAMPLE);
    expect(session.id).toBe(1);
    expect(session.stake).toBe('$1/$2');
    expect(session.duration_minutes).toBe(120);
    expect(session.amount).toBe(150);
    expect(session.location).toBe('Test Casino');
    expect(session.played_at).toBeDefined();
  });

  it('auto-increments id for multiple inserts', () => {
    const s1 = insertSession({ ...SAMPLE, location: 'A' });
    const s2 = insertSession({ ...SAMPLE, location: 'B' });
    expect(s1.id).toBe(1);
    expect(s2.id).toBe(2);
  });

  it('stores negative amounts (losses)', () => {
    const session = insertSession({ ...SAMPLE, amount: -200 });
    expect(session.amount).toBe(-200);
  });

  it('stores zero amount (breakeven)', () => {
    const session = insertSession({ ...SAMPLE, amount: 0 });
    expect(session.amount).toBe(0);
  });

  it('formats played_at as an ISO 8601 UTC string', () => {
    const session = insertSession(SAMPLE);
    expect(session.played_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});

describe('getAllSessions', () => {
  it('returns an empty array when no sessions exist', () => {
    expect(getAllSessions()).toEqual([]);
  });

  it('returns all sessions ordered newest first (by id DESC)', () => {
    insertSession({ ...SAMPLE, location: 'First' });
    insertSession({ ...SAMPLE, location: 'Second' });
    const sessions = getAllSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].location).toBe('Second');
    expect(sessions[1].location).toBe('First');
  });

  it('returns all inserted sessions', () => {
    insertSession(SAMPLE);
    insertSession(SAMPLE);
    insertSession(SAMPLE);
    expect(getAllSessions()).toHaveLength(3);
  });
});

describe('getSessionById', () => {
  it('returns the correct session', () => {
    const inserted = insertSession(SAMPLE);
    const found = getSessionById(inserted.id);
    expect(found).toEqual(inserted);
  });

  it('returns undefined for a non-existent id', () => {
    expect(getSessionById(999)).toBeUndefined();
  });
});
