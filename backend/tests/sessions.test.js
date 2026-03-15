const request = require('supertest');
const app = require('../server');
const { closeDb } = require('../db');

const VALID_SESSION = {
  stake: '$1/$2',
  duration_minutes: 180,
  amount: 250,
  location: 'Bike Casino',
};

afterEach(() => {
  closeDb();
});

describe('POST /api/sessions', () => {
  it('returns 201 with the created session on valid input', async () => {
    const res = await request(app).post('/api/sessions').send(VALID_SESSION);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.stake).toBe('$1/$2');
    expect(res.body.duration_minutes).toBe(180);
    expect(res.body.amount).toBe(250);
    expect(res.body.location).toBe('Bike Casino');
    expect(res.body.played_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });

  it('trims whitespace from stake and location', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, stake: '  $1/$2  ', location: '  Bike Casino  ' });
    expect(res.status).toBe(201);
    expect(res.body.stake).toBe('$1/$2');
    expect(res.body.location).toBe('Bike Casino');
  });

  it('accepts negative amount (loss)', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, amount: -100 });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(-100);
  });

  it('accepts zero amount (breakeven)', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, amount: 0 });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(0);
  });

  it('returns 400 when stake is missing', async () => {
    const { stake, ...body } = VALID_SESSION;
    const res = await request(app).post('/api/sessions').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when stake is an empty string', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, stake: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when duration_minutes is missing', async () => {
    const { duration_minutes, ...body } = VALID_SESSION;
    const res = await request(app).post('/api/sessions').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when duration_minutes is zero', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, duration_minutes: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when duration_minutes is negative', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, duration_minutes: -30 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when duration_minutes is a float', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, duration_minutes: 1.5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when amount is missing', async () => {
    const { amount, ...body } = VALID_SESSION;
    const res = await request(app).post('/api/sessions').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when amount is a float', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, amount: 10.5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when location is missing', async () => {
    const { location, ...body } = VALID_SESSION;
    const res = await request(app).post('/api/sessions').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when location is an empty string', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, location: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/sessions', () => {
  it('returns 200 with an empty array when no sessions exist', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all sessions after they are created', async () => {
    await request(app).post('/api/sessions').send(VALID_SESSION);
    await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, stake: '$2/$5', amount: -50 });

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns sessions newest first', async () => {
    await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, location: 'First' });
    await request(app)
      .post('/api/sessions')
      .send({ ...VALID_SESSION, location: 'Second' });

    const res = await request(app).get('/api/sessions');
    expect(res.body[0].location).toBe('Second');
    expect(res.body[1].location).toBe('First');
  });

  it('returns sessions with ISO 8601 played_at timestamps', async () => {
    await request(app).post('/api/sessions').send(VALID_SESSION);
    const res = await request(app).get('/api/sessions');
    expect(res.body[0].played_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});
