const request = require('supertest');
const app = require('../server');
const Keyword = require('../models/Keyword');
const GlobalWhitelist = require('../models/GlobalWhitelist');

// Load env vars
require('dotenv').config();
const apiKey = process.env.API_SECRET_KEY;

describe('Device Sync API', () => {
  beforeEach(async () => {
    // Clear DB
    await Keyword.deleteMany({});
    await GlobalWhitelist.deleteMany({});
  });

  test('GET /api/v1/sync should return 401 without API key', async () => {
    const res = await request(app).get('/api/v1/sync');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/v1/sync should return 403 with invalid API key', async () => {
    const res = await request(app)
      .get('/api/v1/sync')
      .set('x-api-key', 'wrong-key');
    expect(res.statusCode).toBe(403);
  });

  test('GET /api/v1/sync should return empty arrays when DB is empty', async () => {
    const res = await request(app)
      .get('/api/v1/sync')
      .set('x-api-key', apiKey);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.keywords).toEqual([]);
    expect(res.body.data.whitelist).toEqual([]);
  });

  test('GET /api/v1/sync should return populated data', async () => {
    // Seed DB
    await Keyword.create({ word: 'testword', category: 'PORN', isEnabled: true });
    await GlobalWhitelist.create({ packageName: 'com.test', appName: 'Test App' });

    const res = await request(app)
      .get('/api/v1/sync')
      .set('x-api-key', apiKey);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.keywords).toHaveLength(1);
    expect(res.body.data.keywords[0].word).toBe('testword');
    expect(res.body.data.whitelist).toHaveLength(1);
    expect(res.body.data.whitelist[0].packageName).toBe('com.test');
  });
});
