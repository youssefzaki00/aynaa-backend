const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 1. هات الرابط مباشرة من غير أي تعديل
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("❌ MONGO_URI is missing in environment variables!");
    }

    // 2. اتصل (بمهلة 5 ثواني عشان لو فيه مشكلة تبان بسرعة)
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn; // رجع الاتصال عشان server.js يكمل شغل
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // 3. اقفل البرنامج عشان Coolify يعمل Restart
    process.exit(1);
  }
};

module.exports = connectDB;
