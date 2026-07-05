const request = require('supertest');
const app = require('../server');
const Suggestion = require('../models/Suggestion');
const connectDB = require('../config/db');
const { createTestAdminToken } = require('./helpers/testAuth');
const { runId, track } = require('./helpers/testContext');

const apiKey = process.env.API_SECRET_KEY;

describe('Suggestion API', () => {
  let adminToken;

  beforeAll(async () => {
    await connectDB();
    adminToken = (await createTestAdminToken()).token;
  });

  const createTrackedSuggestion = async (content, status = 'PENDING', type = 'BLOCK_WORD') => {
    const suggestion = await Suggestion.create({ type, content, status });
    track('suggestions', suggestion._id);
    return suggestion;
  };

  test('POST /api/v1/suggestions should create a suggestion', async () => {
    const content = `blockthis-${runId}`;
    const res = await request(app)
      .post('/api/v1/suggestions')
      .set('x-api-key', apiKey)
      .send({
        deviceId: `dev-${runId}`,
        type: 'BLOCK_WORD',
        content,
        note: 'please',
      });

    expect(res.statusCode).toBe(201);

    const suggestion = await Suggestion.findOne({ content });
    track('suggestions', suggestion._id);
    expect(suggestion.status).toBe('PENDING');
  });

  test('GET /api/v1/suggestions/admin should list suggestions', async () => {
    await createTrackedSuggestion(`s1-${runId}`, 'PENDING');
    await createTrackedSuggestion(`s2-${runId}`, 'APPROVED', 'WHITELIST_APP');

    const res = await request(app)
      .get('/api/v1/suggestions/admin')
      .auth(adminToken, { type: 'bearer' })
      .query({ search: `s1-${runId}` });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
  });

  test('PATCH /api/v1/suggestions/admin/review/:id should update status', async () => {
    const suggestion = await createTrackedSuggestion(`review-${runId}`);

    const res = await request(app)
      .patch(`/api/v1/suggestions/admin/review/${suggestion.uuid}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ status: 'APPROVED' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');

    const updated = await Suggestion.findById(suggestion._id);
    expect(updated.status).toBe('APPROVED');
  });
});
