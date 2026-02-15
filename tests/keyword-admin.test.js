const request = require('supertest');
const app = require('../server');
const Keyword = require('../models/Keyword');

// Load env vars
// No need to explicitly call dotenv again if server does it, but safer to do it:
// Actually server does it.
const adminKey = process.env.ADMIN_API_KEY;

describe('Admin Keyword Management API', () => {
  beforeEach(async () => {
    await Keyword.deleteMany({});
  });

  // Test Authentication
  test('POST /api/v1/admin/keywords should return 401 without admin key', async () => {
    const res = await request(app).post('/api/v1/admin/keywords');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/v1/admin/keywords should return 403 with invalid admin key', async () => {
    const res = await request(app)
      .post('/api/v1/admin/keywords')
      .set('x-admin-key', 'wrong-key')
      .send({ word: 'test', category: 'PORN' });
    expect(res.statusCode).toBe(403);
  });

  // Test Create
  test('POST /api/v1/admin/keywords should create a keyword', async () => {
    const res = await request(app)
      .post('/api/v1/admin/keywords')
      .set('x-admin-key', adminKey)
      .send({ word: 'violence', category: 'VIOLENCE' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.keyword.word).toBe('violence');

    // Verify in DB
    const keyword = await Keyword.findOne({ word: 'violence' });
    expect(keyword).toBeTruthy();
    expect(keyword.category).toBe('VIOLENCE');
  });

  // Test List
  test('GET /api/v1/admin/keywords should retrieve keywords', async () => {
    // Seed
    await Keyword.create({ word: 'word1', category: 'PORN' });
    await Keyword.create({ word: 'word2', category: 'GAMBLING' });

    const res = await request(app)
      .get('/api/v1/admin/keywords')
      .set('x-admin-key', adminKey);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.keywords).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  // Test Delete
  test('DELETE /api/v1/admin/keywords/:id should delete keyword', async () => {
    const keyword = await Keyword.create({ word: 'todelete', category: 'OTHER' });

    const res = await request(app)
      .delete(`/api/v1/admin/keywords/${keyword._id}`)
      .set('x-admin-key', adminKey);

    expect(res.statusCode).toBe(200);

    // Verify deletion
    const check = await Keyword.findById(keyword._id);
    expect(check).toBeNull();
  });

  // Test Update
  test('PATCH /api/v1/admin/keywords/:id should update keyword', async () => {
    const keyword = await Keyword.create({ word: 'old', category: 'OTHER' });

    const res = await request(app)
      .patch(`/api/v1/admin/keywords/${keyword._id}`)
      .set('x-admin-key', adminKey)
      .send({ word: 'new', category: 'PORN' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.keyword.word).toBe('new');
    expect(res.body.data.keyword.category).toBe('PORN');
  });
});
