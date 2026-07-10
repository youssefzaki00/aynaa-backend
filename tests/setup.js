const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
  override: true,
});
process.env.NODE_ENV = "test";

// Single .env file: Jest uses a *_test database on the same cluster
const uri = process.env.MONGODB_URI || "";
if (uri) {
  const [base, ...queryParts] = uri.split("?");
  const query = queryParts.length ? `?${queryParts.join("?")}` : "";
  const dbName = base.split("/").pop() || "";
  if (dbName && !/test/i.test(dbName)) {
    process.env.MONGODB_URI = `${base.replace(/\/[^/]+$/, `/${dbName}_test`)}${query}`;
  }
}

const { assertTestDatabase } = require("./helpers/assertTestDatabase");

assertTestDatabase();

const matchers = require('jest-date')
const { cleanupTestData } = require("./helpers/cleanup");

expect.extend(matchers)

afterAll(async () => {
  await cleanupTestData();
  await mongoose.connection.close();
});
