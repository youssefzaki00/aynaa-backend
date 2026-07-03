const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 1. هات الرابط مباشرة من غير أي تعديل
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("❌ MONGO_URI is missing in environment variables!");
    }

    // 2. اتصل (بمهلة 5 ثواني عشان لو فيه مشكلة تبان بسرعة)
    // maxPoolSize: افتراضي Mongoose هو 10 اتصالات بس، وده يسبب Queue/Bottleneck
    // تحت الحمل العالي (مثال: 200 مستخدم بيضربوا في نفس الثانية). رفعناه عشان
    // نسمح بعدد أكبر من العمليات المتزامنة على الداتابيز بدون ما الطلبات تستنى.
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 200,
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 10,
      socketTimeoutMS: 45000,
    });

    // Query debug logging بيبقى مكلف جداً تحت الحمل (بيطبع كل Query في الـ Console)
    // لازم يشتغل بس في التطوير، مش في الـ Production.
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn; // رجع الاتصال عشان server.js يكمل شغل
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // 3. اقفل البرنامج عشان Coolify يعمل Restart
    process.exit(1);
  }
};

module.exports = connectDB;
