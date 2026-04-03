const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/db');
const { UserRoles } = require('../config/constant');

require('dotenv').config();

describe('Auth API', () => {
  beforeAll(async () => {
    db = await connectDB()
    await User.deleteMany({});
  });

  test('POST /api/v1/auth/signup should create user with deviceId', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ deviceId: 'test-device-123' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.deviceId).toBe('test-device-123');
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.token).toBeTruthy();
  });

  test('POST /api/v1/auth/login?role=user should succeed for existing deviceId', async () => {
    await User.create({ deviceId: 'device-abc', role: 'user' });

    const res = await request(app)
      .post('/api/v1/auth/login?role=user')
      .send({ deviceId: 'device-abc' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.deviceId).toBe('device-abc');
    expect(res.body.data.token).toBeTruthy();
  });

  test('POST /api/v1/auth/login?role=admin should succeed with username/password', async () => {
    await User.create({ username: 'admin', password: 'Password1!', role: UserRoles.ADMIN });

    const res = await request(app)
      .post('/api/v1/auth/login?role=admin')
      .send({ username: 'admin', password: 'Password1!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admin.username).toBe('admin');
    expect(res.body.data.token).toBeTruthy();
  });

  test('GET /api/v1/auth/me should return current authenticated user', async () => {
    const user = await User.create({ deviceId: 'device-xyz', role: 'user' });
    const loginRes = await request(app)
      .post('/api/v1/auth/login?role=user')
      .send({ deviceId: 'device-xyz' });

    expect(loginRes.body.data.token).toBeTruthy();
    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.deviceId).toBe('device-xyz');
  });
});