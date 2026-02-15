const request = require('supertest');
const app = require('../server');
const GlobalWhitelist = require('../models/GlobalWhitelist');

// Load env vars
// No need to explicitly call dotenv again if server does it, but safer to do it:
// Actually server does it.
const adminKey = process.env.ADMIN_API_KEY;

describe('Admin Whitelist Management API', () => {
  beforeEach(async () => {
    await GlobalWhitelist.deleteMany({});
  });

  // Test Authentication
  test('POST /api/v1/admin/whitelist should return 401 without admin key', async () => {
    const res = await request(app).post('/api/v1/admin/whitelist');
    expect(res.statusCode).toBe(401);
  });

  // Test Create
  test('POST /api/v1/admin/whitelist should add app to whitelist', async () => {
    const res = await request(app)
      .post('/api/v1/admin/whitelist')
      .set('x-admin-key', adminKey)
      .send({ packageName: 'com.test.app', appName: 'My App' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.app.packageName).toBe('com.test.app');

    // Verify in DB
    const whitelistApp = await GlobalWhitelist.findOne({ packageName: 'com.test.app' });
    expect(whitelistApp).toBeTruthy();
    expect(whitelistApp.appName).toBe('My App');
  });

  // Test List
  test('GET /api/v1/admin/whitelist should retrieve whitelist', async () => {
    // Seed
    await GlobalWhitelist.create({ packageName: 'p1', appName: 'App 1' });
    await GlobalWhitelist.create({ packageName: 'p2', appName: 'App 2' });

    const res = await request(app)
      .get('/api/v1/admin/whitelist')
      .set('x-admin-key', adminKey);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.whitelist).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  // Test Remove
  test('DELETE /api/v1/admin/whitelist/:id should remove app', async () => {
    const whitelistApp = await GlobalWhitelist.create({ packageName: 'todelete', appName: 'Del App' });

    const res = await request(app)
      .delete(`/api/v1/admin/whitelist/${whitelistApp._id}`)
      .set('x-admin-key', adminKey);

    expect(res.statusCode).toBe(200);

    // Verify deletion
    const check = await GlobalWhitelist.findById(whitelistApp._id);
    expect(check).toBeNull();
  });

  // Test Update
  test('PATCH /api/v1/admin/whitelist/:id should update app', async () => {
    const whitelistApp = await GlobalWhitelist.create({ packageName: 'old', appName: 'Old App' });

    const res = await request(app)
      .patch(`/api/v1/admin/whitelist/${whitelistApp._id}`)
      .set('x-admin-key', adminKey)
      .send({ appName: 'New App' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.app.appName).toBe('New App');
  });
});
