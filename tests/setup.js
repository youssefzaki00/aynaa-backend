const mongoose = require('mongoose');

const matchers = require('jest-date')
expect.extend(matchers)

// Close database connection after all tests are done
afterAll(async () => {
  await mongoose.connection.close();
});
