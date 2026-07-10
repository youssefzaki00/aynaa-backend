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
      type: 'UNINSTALL',
      message: `other ${runId}`,
    });
    otherRequestId = otherRequest._id.toString();
    track('requests', otherRequest._id);
  });

  describe('POST /api/v1/requests', () => {
    test('should create request with user auth', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .auth(userToken, { type: 'bearer' })
        .send({
          type: 'UNINSTALL',
          message: `please uninstall ${runId}`,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.request.userId).toBe(userId);
      requestId = res.body.data.request.id;
      track('requests', requestId);
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
      expect(res.body.data.requests.length).toBeGreaterThan(0);
      expect(res.body.data.pagination.page).toBe(1);
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
      expect(res.body.data.requests.length).toBeGreaterThanOrEqual(2);
      const userIds = res.body.data.requests.map((item) => item.userId);
      expect(userIds).toEqual(expect.arrayContaining([userId, otherUserId]));
    });

    test('should let admin filter by userId', async () => {
      const res = await request(app)
        .get('/api/v1/requests')
        .query({ userId: otherUserId, search: runId })
        .auth(adminToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.requests.length).toBeGreaterThan(0);
      expect(
        res.body.data.requests.every((item) => item.userId === otherUserId),
      ).toBe(true);
    });
  });

  describe('PATCH /api/v1/requests/:id', () => {
    test('should update own request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${requestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ message: `updated ${runId}` });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.request.message).toBe(`updated ${runId}`);
    });

    test('should block updating another user request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${otherRequestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ message: 'unauthorized' });

      expect(res.statusCode).toBe(403);
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
