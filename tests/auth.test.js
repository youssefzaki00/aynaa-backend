const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/db');
const { UserRoles } = require('../config/constant');
const { runId, track } = require('./helpers/testContext');

describe('Auth API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  test('POST /api/v1/auth/signup should create user with deviceId', async () => {
    const deviceId = `signup-${runId}`;
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ deviceId });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.deviceId).toBe(deviceId);
    track('users', res.body.data.user.id);
  });

  test('POST /api/v1/auth/user/login should succeed for existing deviceId', async () => {
    const deviceId = `login-${runId}`;
    const user = await User.create({ deviceId, role: 'user' });
    track('users', user._id);

    const res = await request(app)
      .post('/api/v1/auth/user/login')
      .send({ deviceId });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.deviceId).toBe(deviceId);
    expect(res.body.data.token).toBeTruthy();
  });

  test('POST /api/v1/auth/admin/login should succeed with username/password', async () => {
    const username = `admin-${runId}`;
    const user = await User.create({
      username,
      password: 'Password1!',
      role: UserRoles.ADMIN,
    });
    track('users', user._id);

    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ username, password: 'Password1!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.admin.username).toBe(username);
    expect(res.body.data.token).toBeTruthy();
  });

  test('GET /api/v1/auth/me should return current authenticated user', async () => {
    const deviceId = `me-${runId}`;
    const user = await User.create({ deviceId, role: 'user' });
    track('users', user._id);

    const loginRes = await request(app)
      .post('/api/v1/auth/user/login')
      .send({ deviceId });

    const token = loginRes.body.data.token;
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.user.deviceId).toBe(deviceId);
  });
});
