const request = require('supertest');
const app = require('../server');
const Keyword = require('../models/Keyword');
const GlobalWhitelist = require('../models/GlobalWhitelist');
const connectDB = require('../config/db');
const { createTestCategory } = require('./helpers/testFactories');
const { runId, track, testPackage, testWord } = require('./helpers/testContext');

const apiKey = process.env.API_SECRET_KEY;

describe('Device Config API', () => {
  let categoryId;

  beforeAll(async () => {
    await connectDB();
    const category = await createTestCategory('config');
    categoryId = category._id;
  });

  test('GET /api/v1/config should return 401 without API key', async () => {
    const res = await request(app)
      .get('/api/v1/config')
      .set('deviceId', `device-${runId}`);
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/v1/config should return 403 with invalid API key', async () => {
    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', 'wrong-key')
      .set('deviceId', `device-${runId}`);
    expect(res.statusCode).toBe(403);
  });

  test('GET /api/v1/config should include seeded keyword and whitelist', async () => {
    const word = testWord('config');
    const packageName = testPackage('config');

    const keyword = await Keyword.create({
      word,
      category: categoryId,
      isEnabled: true,
    });
    track('keywords', keyword._id);

    const whitelist = await GlobalWhitelist.create({
      packageName,
      appName: `Config App ${runId}`,
    });
    track('whitelist', whitelist._id);

    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', `device-${runId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.keywords.some((k) => k.word === word)).toBe(true);
    expect(res.body.data.whitelist.some((w) => w.packageName === packageName)).toBe(
      true,
    );
  });
});
