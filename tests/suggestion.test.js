const request = require('supertest');
const app = require('../server');
const Suggestion = require('../models/Suggestion');
const Device = require('../models/Device');

// Load env vars
const apiKey = process.env.API_SECRET_KEY;
const adminKey = process.env.ADMIN_API_KEY;

describe('Suggestion API', () => {
  beforeEach(async () => {
    await Suggestion.deleteMany({});
    await Device.deleteMany({});
  });

  // User submits suggestion
  test('POST /api/v1/suggestions should create a suggestion', async () => {
    // Requires deviceId but device doesn't HAVE to exist in DB (controller checks if provided, if exists link it, else just null).
    // Wait, controller logic:
    // if (deviceId) { const device = await Device.findOne({ deviceId }); if (device) deviceObjectId = device._id; }
    // So if device doesn't exist, deviceId is null.

    const res = await request(app)
      .post('/api/v1/suggestions')
      .set('x-api-key', apiKey)
      .send({
        deviceId: 'dev123',
        type: 'BLOCK_WORD',
        content: 'blockthis',
        note: 'please'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify DB
    const suggestion = await Suggestion.findOne({ content: 'blockthis' });
    expect(suggestion).toBeTruthy();
    expect(suggestion.status).toBe('PENDING');
  });

  // Admin lists suggestions
  test('GET /api/v1/suggestions/admin should list suggestions', async () => {
    await Suggestion.create({ type: 'BLOCK_WORD', content: 's1', status: 'PENDING' });
    await Suggestion.create({ type: 'WHITELIST_APP', content: 's2', status: 'APPROVED' });

    const res = await request(app)
      .get('/api/v1/suggestions/admin')
      .set('x-admin-key', adminKey);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.pagination.total).toBe(2);
  });

  // Admin reviews suggestion
  test('PATCH /api/v1/suggestions/admin/review/:id should update status', async () => {
    const suggestion = await Suggestion.create({ type: 'BLOCK_WORD', content: 's1', status: 'PENDING' });

    const res = await request(app)
      .patch(`/api/v1/suggestions/admin/review/${suggestion._id}`)
      .set('x-admin-key', adminKey)
      .send({ status: 'APPROVED' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');

    // Verify DB
    const updated = await Suggestion.findById(suggestion._id);
    expect(updated.status).toBe('APPROVED');
  });
});
