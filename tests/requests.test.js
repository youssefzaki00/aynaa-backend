const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const RequestModel = require('../models/Request');
const connectDB = require('../config/db');
const { createUserToken } = require('../utils/createUserToken.js');
const { UserRoles } = require('../config/constant');

describe('Requests API', () => {
  let db;
  let userToken;
  let otherToken;
  let userId;
  let otherUserId;
  let requestId;
  let otherRequestId;

  beforeAll(async () => {
    db = await connectDB();
    await RequestModel.deleteMany({});

    userToken = await createUserToken();
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    userId = decoded.id;

    const otherUser = await User.create({
      deviceId: `other-user-${Date.now()}`,
      role: UserRoles.USER,
    });
    otherUserId = otherUser._id.toString();
    otherToken = jwt.sign({ id: otherUserId, role: UserRoles.USER }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await RequestModel.deleteMany({});
    await User.deleteOne({ _id: otherUserId });
  });

  describe('POST /api/v1/requests', () => {
    test('should create request with user auth', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .auth(userToken, { type: 'bearer' })
        .send({
          type: 'UNINSTALL',
          message: 'please uninstall',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.userId).toBe(userId);
      requestId = res.body.data.request.id;
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
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.requests)).toBe(true);
      expect(res.body.data.requests.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();
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
        .query({ limit: 1, page: 1 })
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.page).toBe(1);
    });
  });

  describe('PATCH /api/v1/requests/:id', () => {
    beforeAll(async () => {
      const otherRequest = await RequestModel.create({
        userId: otherUserId,
        type: 'UNINSTALL',
      });
      otherRequestId = otherRequest._id.toString();
    });

    test('should update own request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${requestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ message: 'updated message' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.message).toBe('updated message');
    });

    test('should block updating another user request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${otherRequestId}`)
        .auth(userToken, { type: 'bearer' })
        .send({ message: 'unauthorized' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/v1/request/:id', () => {
    test('should delete own request via singular route', async () => {
      const res = await request(app)
        .delete(`/api/v1/request/${requestId}`)
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedRequest.id).toBe(requestId);
    });

    test('should block deleting another user request', async () => {
      const res = await request(app)
        .delete(`/api/v1/request/${otherRequestId}`)
        .auth(userToken, { type: 'bearer' });

      expect(res.statusCode).toBe(403);
    });
  });
});
