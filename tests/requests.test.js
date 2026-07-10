const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const RequestModel = require('../models/Request');
const connectDB = require('../config/db');
const { createTestAdminToken, createTestUserToken } = require('./helpers/testAuth');
const { runId, track } = require('./helpers/testContext');
const { UserRoles } = require('../config/constant');

describe('Requests API', () => {
  let userToken;
  let adminToken;
  let otherToken;
  let userId;
  let otherUserId;
  let requestId;
  let otherRequestId;

  beforeAll(async () => {
    await connectDB();

    const mainUser = await createTestUserToken();
    userToken = mainUser.token;
    userId = mainUser.userId.toString();

    const admin = await createTestAdminToken();
    adminToken = admin.token;

    const otherUser = await User.create({
      deviceId: `other-user-${runId}`,
      role: UserRoles.USER,
    });
    otherUserId = otherUser._id.toString();
    track('users', otherUser._id);
    otherToken = jwt.sign(
      { id: otherUserId, role: UserRoles.USER },
      process.env.JWT_SECRET,
    );

    const otherRequest = await RequestModel.create({
      userId: otherUserId,
      reason: `other uninstall ${runId}`,
    });
    otherRequestId = otherRequest._id.toString();
    track('requests', otherRequest._id);
  });

  describe('POST /api/v1/requests', () => {
    test('should create uninstall request with user auth', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .auth(userToken, { type: 'bearer' })
        .send({
          reason: `please uninstall ${runId}`,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.request.userId).toBe(userId);
      expect(res.body.data.request.reason).toBe(`please uninstall ${runId}`);
      expect(res.body.data.request.status).toBe('PENDING');
      requestId = res.body.data.request.id;
      track('requests', requestId);
    });

    test('should reject duplicate pending request for same user', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .auth(userToken, { type: 'bearer' })
        .send({
          reason: 'duplicate attempt',
        });

      expect(res.statusCode).toBe(409);
    });

    test('should require reason', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .auth(userToken, { type: 'bearer' })
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/requests', () => {
    test('should require user auth', async () => {
      const res = await request(app).get('/api/v1/requests');
      expect(res.statusCode).toBe(401);
    });

    test('should get own requests with user auth', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .auth(userToken, { type: 'bearer' })
        .query({ search: runId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.pagination.page).toBe(1);
      expect(Array.isArray(res.body.data.deleted)).toBe(true);
      expect(res.body.data.items[0]).toHaveProperty('reason');
    });

    test('should return 403 when querying another userId', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ userId: otherUserId })
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(403);
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ limit: 1, page: 1, search: runId })
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
    });

    test('should return all requests for admin', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ search: runId })
        .auth(adminToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      const userIds = res.body.data.items.map((item) => item.userId);
      expect(userIds).toEqual(expect.arrayContaining([userId, otherUserId]));
    });

    test('should let admin filter by userId', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ userId: otherUserId, search: runId })
        .auth(adminToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(
        res.body.data.items.every((item) => item.userId === otherUserId),
      ).toBe(true);
    });

    test('should filter by status', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ status: 'PENDING', search: runId })
        .auth(adminToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(
        res.body.data.items.every((item) => item.status === 'PENDING'),
      ).toBe(true);
    });

    test('should reject invalid status filter', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ status: 'INVALID' })
        .auth(adminToken, { type: 'bearer' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/v1/requests/:id', () => {
    test('should update own pending request reason', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${requestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ reason: `updated ${runId}` });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.request.reason).toBe(`updated ${runId}`);
    });

    test('should block user from updating status', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${requestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ status: 'APPROVED' });

      expect(res.statusCode).toBe(400);
    });

    test('should block updating another user request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${otherRequestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ reason: 'unauthorized' });

      expect(res.statusCode).toBe(403);
    });

    test('should let admin update status only', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${requestId}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ status: 'APPROVED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.request.status).toBe('APPROVED');
    });

    test('should block user from updating non-pending request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${requestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ reason: 'too late' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/requests/:id', () => {
    test('should delete own request', async () => {
      const res = await request(app)
        .delete(`/api/v1/requests/${requestId}`)
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.deletedRequest.id).toBe(requestId);
    });

    test('should block deleting another user request', async () => {
      const res = await request(app)
        .delete(`/api/v1/requests/${otherRequestId}`)
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(403);
    });
  });
});
