const path = require("path");
const mongoose = require("mongoose");

// Always load .env.test for Jest — never the production .env
require("dotenv").config({
  path: path.resolve(__dirname, "../.env.test"),
  override: true,
});
process.env.NODE_ENV = "test";

const { assertTestDatabase } = require("./helpers/assertTestDatabase");

assertTestDatabase();

const matchers = require('jest-date')
const { cleanupTestData } = require("./helpers/cleanup");

expect.extend(matchers)

afterAll(async () => {
  await cleanupTestData();
  await mongoose.connection.close();
});
