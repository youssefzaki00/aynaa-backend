require("dotenv").config();
const { PORT, NODE_ENV, ENABLE_CLUSTER } = require("./config/env");
const path = require("path");
const cluster = require("cluster");
const os = require("os");
const mongoose = require("mongoose");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const { loadMobileSwaggerSpec, loadDashboardSwaggerSpec } = require("./config/swagger");
const connectDB = require("./config/db");
const { connectRedis, disconnectRedis } = require("./config/redis");
const { refreshListCachesOnDeploy } = require("./utils/cacheInvalidate");
const { globalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");
const sanitizeRequest = require("./middleware/sanitization"); // نقلت الاستدعاء هنا للترتيب

// Initialize Express app
const app = express();

// Swagger — reload YAML on each request so doc changes apply without restart
const mountSwaggerUi = (mountPath, loadSpec) => {
  app.use(mountPath, swaggerUi.serve);
  app.get(mountPath, (req, res, next) => {
    swaggerUi.setup(loadSpec())(req, res, next);
  });
  app.get(`${mountPath}/swagger.json`, (req, res) => {
    res.json(loadSpec());
  });
};

mountSwaggerUi("/api-docs", loadMobileSwaggerSpec);
mountSwaggerUi("/api-docs-dashboard", loadDashboardSwaggerSpec);

const corsOptions = {
  origin: [
    "https://dashboard.aynaa.org",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(helmet());

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input Sanitization
app.use(sanitizeRequest);

// Logging
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Apply global rate limiter
app.use(globalLimiter);

// API Routes
app.use("/api/v1", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to aynaa API",
    version: "1.0.2",
    healthCheck: "/api/v1/health",
    documentation: {
      mobile: "/api-docs",
      dashboard: "/api-docs-dashboard",
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(errorHandler);

// --- Start Server Logic (The Correct Way) ---

// شغل السيرفر في الـ Worker ده (سواء كان Worker جوه Cluster أو Process لوحده)
function startWorker() {
  // 1. استنى الداتا بيز تتصل الأول
  connectDB()
    .then(async () => {
      await connectRedis();
      await refreshListCachesOnDeploy();

      // 2. لما تنجح، شغل السيرفر
      const server = app.listen(PORT, () => {
        console.log(
          `🚀 [Worker ${process.pid}] Server running on port ${PORT} in ${NODE_ENV} mode`
        );
      });

      // 3. اقفل السيرفر بأمان لو الـ Process اتقفل (Deploy/Restart/Crash)
      const gracefulShutdown = (signal) => {
        console.log(`🛑 [Worker ${process.pid}] Received ${signal}, shutting down gracefully...`);
        server.close(() => {
          Promise.all([
            mongoose.connection.close(false),
            disconnectRedis(),
          ])
            .then(() => {
              console.log(`✅ [Worker ${process.pid}] Closed remaining connections.`);
              process.exit(0);
            })
            .catch(() => process.exit(1));
        });

        // متستناش للأبد — لو فيه اتصالات معلقة اقفل بالقوة بعد مهلة
        setTimeout(() => {
          console.error(`⚠️ [Worker ${process.pid}] Forcing shutdown after timeout.`);
          process.exit(1);
        }, 10000).unref();
      };

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    })
    .catch((err) => {
      // لو فشلت، متقومش السيرفر واطبع ايرور
      console.error(`❌ [Worker ${process.pid}] Failed to connect to Database. Server not started.`);
      console.error(err);
      process.exit(1);
    });
}

if (require.main === module) {
  // الـ Node.js Cluster Module: بيفتح نسخة (Worker) من الأبلكيشن على كل Core
  // عشان نستغل كل الأكواد المتاحة في المعالجة بدل ما نشتغل على Core واحد بس.
  // ENABLE_CLUSTER=false بيرجعنا لـ Process واحد (مفيد لو بتستخدم PM2 Cluster Mode
  // بدل الـ Cluster Module ده، أو لو عايز تفادي تعقيد الـ Multi-process في التطوير).
  const numCPUs = os.cpus().length;

  if (ENABLE_CLUSTER && numCPUs > 1 && cluster.isPrimary) {
    console.log(`🧠 [Primary ${process.pid}] Starting ${numCPUs} workers (one per CPU core)...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // لو Worker مات (Crash) نفتح واحد بدل منه عشان نحافظ على عدد الـ Workers
    cluster.on("exit", (worker, code, signal) => {
      console.error(
        `⚠️ [Primary ${process.pid}] Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`
      );
      cluster.fork();
    });
  } else {
    // مفيش Cluster (متعطل، أو Core واحد بس، أو إحنا جوه Worker فعلاً) — شغل Process عادي
    startWorker();
  }
}

// Export App for Vercel or Testing
module.exports = app;

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // اقفل السيرفر بأمان لو حصل خطأ غير متوقع
  process.exit(1);
});
