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
expect.extend(matchers)

// Close database connection after all tests are done
afterAll(async () => {
  await mongoose.connection.close();
});
