const request = require('supertest');
const app = require('../server');
const connectDB = require('../config/db');
const Site = require('../models/Site');
const { createAdminToken } = require('../utils/createAdminToken');
const User = require('../models/User');

describe('Sites API', () => {
  let db;
  let adminToken;

  beforeAll(async () => {
    db = await connectDB();
    await Site.deleteMany({});

    adminToken = await createAdminToken();

  });

  afterAll(async () => {
    await Site.deleteMany({});
    await User.deleteMany({});
    await db.connection.close();
  });

  test('POST /api/v1/sites (admin) creates site', async () => {
    const res = await request(app)
      .post('/api/v1/sites')
      .auth(adminToken, { type: 'bearer' })
      .send({ url: 'https://example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.site.id).toBeDefined();
    expect(res.body.data.site.url).toBe('https://example.com');
  });

  test('GET /api/v1/sites (admin) can see all by isActive query', async () => {
    await Site.create({ url: 'https://inactive.com', isActive: false });

    const resTrue = await request(app)
      .get('/api/v1/sites?isActive=true')
      .auth(adminToken, { type: 'bearer' });

    expect(resTrue.statusCode).toBe(200);
    expect(Array.isArray(resTrue.body.data.sites)).toBe(true);
    expect(resTrue.body.data.sites.every((s) => s.isActive === true)).toBe(true);

    const resAll = await request(app)
      .get('/api/v1/sites')
      .auth(adminToken, { type: 'bearer' });

    expect(resAll.body.data.sites.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/v1/sites (non-superadmin) only gets active', async () => {
    const res = await request(app)
      .get('/api/v1/sites')
      .auth(adminToken, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.sites.every((s) => s.isActive === true)).toBe(true);
  });

  test('PATCH /api/v1/sites/:id (admin) updates site', async () => {
    const site = await Site.create({ url: 'https://update-me.com' });

    const res = await request(app)
      .patch(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ url: 'https://updated.com', isActive: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.site.url).toBe('https://updated.com');
    expect(res.body.data.site.isActive).toBe(false);
  });

  test('DELETE /api/v1/sites/:id (admin) removes site', async () => {
    const site = await Site.create({ url: 'https://delete.com' });

    const res = await request(app)
      .delete(`/api/v1/sites/${site._id}`)
      .auth(adminToken, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(site._id.toString());

    const removed = await Site.findById(site._id);
    expect(removed).toBeNull();
  });
});
