import { getSessions, createSession } from '../services/api';

describe('getSessions', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed sessions on success', async () => {
    const mockSessions = [{ id: 1, stake: '1/2', result_amount: 100 }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockSessions),
    });

    const result = await getSessions();

    expect(result).toEqual(mockSessions);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/sessions')
    );
  });

  it('returns empty array when no sessions exist', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const result = await getSessions();

    expect(result).toEqual([]);
  });

  it('throws with status code on non-ok response', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(getSessions()).rejects.toThrow('Failed to fetch sessions: 500');
  });

  it('throws on network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getSessions()).rejects.toThrow('Network error');
  });
});

describe('createSession', () => {
  const validSession = {
    stake: '1/2',
    location: 'Bicycle Club',
    session_date: '2026-01-01',
    duration_minutes: 120,
    result_amount: 50,
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns created session on success', async () => {
    const created = { id: 1, ...validSession };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(created),
    });

    const result = await createSession(validSession);

    expect(result).toEqual(created);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/sessions'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSession),
      })
    );
  });

  it('throws with server error message on 400', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({ error: 'stake is required' }),
    });

    await expect(createSession({})).rejects.toThrow('stake is required');
  });

  it('throws generic message when response body is not JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValueOnce(new Error('not json')),
    });

    await expect(createSession(validSession)).rejects.toThrow('Request failed: 500');
  });

  it('handles negative result_amount (loss)', async () => {
    const lossSession = { ...validSession, result_amount: -75 };
    const created = { id: 2, ...lossSession };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(created),
    });

    const result = await createSession(lossSession);

    expect(result.result_amount).toBe(-75);
  });

  it('throws on network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(createSession(validSession)).rejects.toThrow('Connection refused');
  });
});
