const mongoose = require('mongoose');

// Close database connection after all tests are done
afterAll(async () => {
  await mongoose.connection.close();
});
