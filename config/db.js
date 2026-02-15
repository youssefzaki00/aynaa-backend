const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Use test database for testing
    if (process.env.NODE_ENV === 'test') {
      uri = uri.replace(/\/[^/?]+(\?|$)/, '/wekayaa-test$1');
      // If URI doesn't match regex (e.g. localhost/db), append -test
      if (uri === process.env.MONGODB_URI) {
        uri = process.env.MONGODB_URI + '-test';
      }
      console.log('🧪 Using Test Database:', uri);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
