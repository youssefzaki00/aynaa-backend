/**
 * Tests for Device Configuration Endpoint
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock the database connection to prevent server.js from connecting to real DB
// and keeping the process alive with retry logic
jest.mock('../config/db', () => jest.fn());

const app = require('../server'); // Adjust path to server.js
const Device = require('../models/Device');
const Keyword = require('../models/Keyword');
const GlobalWhitelist = require('../models/GlobalWhitelist');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Device.deleteMany({});
  await Keyword.deleteMany({});
  await GlobalWhitelist.deleteMany({});
});

describe('GET /api/v1/config', () => {
  const apiKey = process.env.API_SECRET_KEY || 'test-api-key'; // Ensure this matches env or mock it

  beforeAll(() => {
    // Mock the env key if needed, or assume setup
    process.env.API_SECRET_KEY = apiKey;
  });

  it('should return global keywords and whitelist for new device', async () => {
    // Setup global data
    await Keyword.create({ word: 'porn', category: 'PORN' });
    await GlobalWhitelist.create({ packageName: 'com.learning', appName: 'Learning App' });

    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', 'device-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.keywords).toHaveLength(1);
    expect(res.body.data.keywords[0].word).toBe('porn');
    expect(res.body.data.whitelist).toHaveLength(1);
    expect(res.body.data.whitelist[0].packageName).toBe('com.learning');
  });

  it('should include custom blocked keywords', async () => {
    await Keyword.create({ word: 'porn', category: 'PORN' });
    // Create device with custom blocked keyword
    await Device.create({
      deviceId: 'device-123',
      customBlockedKeywords: ['badword']
    });

    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', 'device-123');

    expect(res.body.data.keywords).toHaveLength(2);
    const words = res.body.data.keywords.map(k => k.word);
    expect(words).toContain('porn');
    expect(words).toContain('badword');
  });

  it('should exclude custom allowed keywords', async () => {
    await Keyword.create({ word: 'porn', category: 'PORN' });
    // Create device with custom allowed keyword (override global)
    await Device.create({
      deviceId: 'device-123',
      customAllowedKeywords: ['porn']
    });

    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', 'device-123');

    expect(res.body.data.keywords).toHaveLength(0);
  });

  it('should include custom whitelisted apps', async () => {
    await GlobalWhitelist.create({ packageName: 'com.learning', appName: 'Learning App' });
    
    await Device.create({
      deviceId: 'device-123',
      customWhitelistedApps: ['com.game']
    });

    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', 'device-123');

    expect(res.body.data.whitelist).toHaveLength(2);
    const pkgs = res.body.data.whitelist.map(w => w.packageName);
    expect(pkgs).toContain('com.learning');
    expect(pkgs).toContain('com.game');
  });

  it('should exclude custom blacklisted apps', async () => {
    await GlobalWhitelist.create({ packageName: 'com.learning', appName: 'Learning App' });
    
    await Device.create({
      deviceId: 'device-123',
      customBlacklistedApps: ['com.learning']
    });

    const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', 'device-123');

    expect(res.body.data.whitelist).toHaveLength(0);
  });

  it('should update lastSeen for the device', async () => {
     const deviceId = 'device-new-time';
     const startTime = new Date();
     
     const res = await request(app)
      .get('/api/v1/config')
      .set('x-api-key', apiKey)
      .set('deviceId', deviceId);

     const device = await Device.findOne({ deviceId });
     expect(device).toBeTruthy();
     expect(new Date(device.lastSeen).getTime()).toBeGreaterThanOrEqual(startTime.getTime());
  });
});
