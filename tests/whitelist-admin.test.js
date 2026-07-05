const request = require('supertest');
const app = require('../server');
const GlobalWhitelist = require('../models/GlobalWhitelist');
const connectDB = require('../config/db');
const { createTestAdminToken } = require('./helpers/testAuth');
const { runId, track, testPackage } = require('./helpers/testContext');

describe('Admin Whitelist Management API', () => {
  let adminToken;

  beforeAll(async () => {
    await connectDB();
    adminToken = (await createTestAdminToken()).token;
  });

  const createTrackedWhitelist = async (slug, appName) => {
    const doc = await GlobalWhitelist.create({
      packageName: testPackage(slug),
      appName,
    });
    track('whitelist', doc._id);
    return doc;
  };

  test('POST /api/v1/admin/whitelist should return 401 without auth', async () => {
    const res = await request(app).post('/api/v1/admin/whitelist');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/v1/admin/whitelist should add app to whitelist', async () => {
    const packageName = testPackage('whitelist-create');
    const res = await request(app)
      .post('/api/v1/admin/whitelist')
      .auth(adminToken, { type: 'bearer' })
      .send({ packageName, appName: `App ${runId}` });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.app.packageName).toBe(packageName);

    const whitelistApp = await GlobalWhitelist.findOne({ packageName });
    track('whitelist', whitelistApp._id);
    expect(whitelistApp.appName).toBe(`App ${runId}`);
  });

  test('GET /api/v1/admin/whitelist should retrieve whitelist', async () => {
    await createTrackedWhitelist('list-1', 'App 1');
    await createTrackedWhitelist('list-2', 'App 2');

    const res = await request(app)
      .get('/api/v1/admin/whitelist')
      .auth(adminToken, { type: 'bearer' })
      .query({ search: 'list-1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.whitelist).toHaveLength(1);
    expect(res.body.data.whitelist[0].packageName).toContain('list-1');
  });

  test('DELETE /api/v1/admin/whitelist/:id should remove app', async () => {
    const whitelistApp = await createTrackedWhitelist('delete', 'Del App');

    const res = await request(app)
      .delete(`/api/v1/admin/whitelist/${whitelistApp.uuid}`)
      .auth(adminToken, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const check = await GlobalWhitelist.findById(whitelistApp._id);
    expect(check).toBeNull();
  });

  test('PATCH /api/v1/admin/whitelist/:id should update app', async () => {
    const whitelistApp = await createTrackedWhitelist('patch', 'Old App');

    const res = await request(app)
      .patch(`/api/v1/admin/whitelist/${whitelistApp.uuid}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ appName: 'New App' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.app.appName).toBe('New App');
  });
});
