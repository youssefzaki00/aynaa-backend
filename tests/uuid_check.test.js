const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Device = require('../models/Device');
const Keyword = require('../models/Keyword');

// Mock db config
jest.mock('../config/db', () => jest.fn());

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('UUID Refactor Verification', () => {
  it('Device should have UUID _id', async () => {
    const device = await Device.create({ deviceId: 'test-uuid-device' });
    console.log('Device ID:', device._id);
    expect(typeof device._id).toBe('string');
    expect(device._id.length).toBeGreaterThan(20); // UUID is 36 chars
    expect(device._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('Keyword should have UUID _id', async () => {
    const keyword = await Keyword.create({ word: 'uuid-test', category: 'OTHER' });
    console.log('Keyword ID:', keyword._id);
    expect(typeof keyword._id).toBe('string');
    expect(keyword._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
