const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../server');
const CustomizationRequest = require('../models/CustomizationRequest');
const Device = require('../models/Device');

// Mock db config to prevent real connection
jest.mock('../config/db', () => jest.fn());

let mongoServer;
const apiKey = 'test-api-key';
const adminKey = 'test-admin-key';

beforeAll(async () => {
  process.env.API_SECRET_KEY = apiKey;
  process.env.ADMIN_API_KEY = adminKey;
  
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await CustomizationRequest.deleteMany({});
  await Device.deleteMany({});
});

describe('Customization Request API', () => {
  const deviceId = 'test-device-123';
  
  beforeEach(async () => {
    // Create device for testing
    await Device.create({ deviceId });
  });

  describe('POST /api/v1/customization/request', () => {
    it('should submit a valid request', async () => {
      const res = await request(app)
        .post('/api/v1/customization/request')
        .set('x-api-key', apiKey)
        .send({
          deviceId,
          type: 'CUSTOM_BLOCK_KEYWORD',
          content: 'badword',
          reason: 'It is bad',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');

      // Verify DB
      const req = await CustomizationRequest.findOne({ deviceId, content: 'badword' });
      expect(req).toBeTruthy();
    });

    it('should fail if device does not exist', async () => {
        const res = await request(app)
          .post('/api/v1/customization/request')
          .set('x-api-key', apiKey)
          .send({
            deviceId: 'unknown-device',
            type: 'CUSTOM_BLOCK_KEYWORD',
            content: 'badword',
            reason: 'It is bad',
          });
  
        expect(res.status).toBe(404);
    });

    it('should validate request type', async () => {
        const res = await request(app)
          .post('/api/v1/customization/request')
          .set('x-api-key', apiKey)
          .send({
            deviceId,
            type: 'INVALID_TYPE',
            content: 'badword',
            reason: 'It is bad',
          });
  
        expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/customization/status', () => {
      it('should return requests for device', async () => {
          await CustomizationRequest.create({
              deviceId,
              type: 'CUSTOM_BLOCK_KEYWORD',
              content: 'test',
              reason: 'reason',
              status: 'PENDING'
          });

          const res = await request(app)
            .get(`/api/v1/customization/status?deviceId=${deviceId}`)
            .set('x-api-key', apiKey);

          expect(res.status).toBe(200);
          expect(res.body.data.requests).toHaveLength(1);
      });
  });

  describe('PATCH /api/v1/admin/customization/review/:id', () => {
      it('should approve request and update device', async () => {
          const customReq = await CustomizationRequest.create({
              deviceId,
              type: 'CUSTOM_BLOCK_KEYWORD',
              content: 'blockedword',
              reason: 'please block',
              status: 'PENDING'
          });

          const res = await request(app)
            .patch(`/api/v1/admin/customization/review/${customReq._id}`)
            .set('x-admin-key', adminKey)
            .send({ status: 'APPROVED' });

          expect(res.status).toBe(200);
          expect(res.body.data.status).toBe('APPROVED');

          // Verify device updated
          const device = await Device.findOne({ deviceId });
          expect(device.customBlockedKeywords).toContain('blockedword');
      });

      it('should reject request without updating device', async () => {
        const customReq = await CustomizationRequest.create({
            deviceId,
            type: 'CUSTOM_ALLOW_KEYWORD',
            content: 'allowedword',
            reason: 'please allow',
            status: 'PENDING'
        });

        const res = await request(app)
          .patch(`/api/v1/admin/customization/review/${customReq._id}`)
          .set('x-admin-key', adminKey)
          .send({ status: 'REJECTED' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('REJECTED');

        // Verify device NOT updated
        const device = await Device.findOne({ deviceId });
        expect(device.customAllowedKeywords).not.toContain('allowedword');
    });
  });
});
