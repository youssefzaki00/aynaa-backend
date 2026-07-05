const mongoose = require("mongoose");
const cluster = require("cluster");
const os = require("os");
const {
  MONGODB_URI,
  NODE_ENV,
  MONGO_MAX_POOL_SIZE,
  MONGO_MIN_POOL_SIZE,
} = require("./env");

// لو إحنا شغالين جوه Cluster Worker، كل Worker بيفتح Pool اتصالات لوحده.
// عشان إجمالي الاتصالات على الداتابيز يفضل قريب من الرقم اللي محدده في
// الـ .env (مش يتضاعف على عدد الـ Cores)، بنقسم الـ Pool Size على عدد الـ
// Workers. بنحط حد أدنى (Floor) عشان مايبقاش الـ Pool صغير قوي على كل Worker.
const getPerWorkerPoolSize = (totalSize, floor) => {
  if (!cluster.isWorker) return totalSize;

  const numWorkers = os.cpus().length;
  return Math.max(floor, Math.floor(totalSize / numWorkers));
};

const connectDB = async () => {
  try {
    const uri = MONGODB_URI;

    if (!uri) {
      throw new Error("❌ MONGODB_URI is missing in environment variables!");
    }

    if (NODE_ENV === "test") {
      const { assertTestDatabase } = require("../tests/helpers/assertTestDatabase");
      assertTestDatabase();
    }

    const totalMaxPoolSize = MONGO_MAX_POOL_SIZE;
    const totalMinPoolSize = MONGO_MIN_POOL_SIZE;
    const maxPoolSize = getPerWorkerPoolSize(totalMaxPoolSize, 5);
    const minPoolSize = Math.min(maxPoolSize, getPerWorkerPoolSize(totalMinPoolSize, 2));

    // 2. اتصل (بمهلة 5 ثواني عشان لو فيه مشكلة تبان بسرعة)
    // maxPoolSize: افتراضي Mongoose هو 10 اتصالات بس، وده يسبب Queue/Bottleneck
    // تحت الحمل العالي (مثال: 200 مستخدم بيضربوا في نفس الثانية). رفعناه عشان
    // نسمح بعدد أكبر من العمليات المتزامنة على الداتابيز بدون ما الطلبات تستنى.
    // (القيمة دي هي الإجمالي المطلوب على مستوى السيرفر كله؛ لو شغالين Cluster
    // بتتقسم أوتوماتيك على عدد الـ Workers فوق في getPerWorkerPoolSize.)
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize,
      minPoolSize,
      socketTimeoutMS: 45000,
    });

    // Query debug logging بيبقى مكلف جداً تحت الحمل (بيطبع كل Query في الـ Console)
    // لازم يشتغل بس في التطوير، مش في الـ Production.
    if (NODE_ENV === "development") {
      mongoose.set("debug", true);
    }

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} (pool: ${minPoolSize}-${maxPoolSize})`
    );
    return conn; // رجع الاتصال عشان server.js يكمل شغل
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // 3. اقفل البرنامج عشان Coolify يعمل Restart
    process.exit(1);
  }
};

module.exports = connectDB;
