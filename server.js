require("dotenv").config();
const path = require("path");
const cluster = require("cluster");
const os = require("os");
const mongoose = require("mongoose");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/db");
const { connectRedis, disconnectRedis } = require("./config/redis");
const { globalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");
const sanitizeRequest = require("./middleware/sanitization"); // نقلت الاستدعاء هنا للترتيب

// Initialize Express app
const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "aynaa Backend API",
      version: "1.0.2",
      description:
        "Production-ready REST API for aynaa - Parental Control & Content Filtering Android App",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development server",
      },
      {
        url: "https://api.aynaa.org/api/v1",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key for client authentication",
        },
        AdminKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-admin-key",
          description: "Admin API key for administrative operations",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            deviceId: {
              type: "string",
              description: "Device identifier",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
            },
            username: {
              type: "string",
              description: "Username",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Keyword: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Keyword ID",
            },
            word: {
              type: "string",
              description: "The keyword text",
            },
            category: {
              $ref: "#/components/schemas/Category",
              description: "Category object containing category details",
            },
            isEnabled: {
              type: "boolean",
              description: "Whether the keyword is active",
              default: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Category ID",
            },
            name: {
              type: "string",
              description: "Category name (uppercase)",
            },
            displayName: {
              type: "string",
              description: "Human-readable category name",
            },
            description: {
              type: "string",
              description: "Category description",
            },
            isActive: {
              type: "boolean",
              description: "Whether the category is active",
              default: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Site: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Site ID",
            },
            url: {
              type: "string",
              format: "uri",
              description: "Site URL",
            },
            isActive: {
              type: "boolean",
              description: "Whether the site is active",
              default: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        ExcludedApp: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Excluded app ID",
            },
            packageName: {
              type: "string",
              description: "App package name to exclude from filtering",
            },
            isActive: {
              type: "boolean",
              description: "Whether the exclusion is active",
              default: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  // Resolve from __dirname (not cwd). Use explicit site.routes.js — globbing site/*.js
  // can miss files on some VPS setups; removed duplicate routes/site.routes.js from scan.
 apis: [
  "./routes/*.js",
  "./site/site.routes.js",
  "./keywords-blocking-excluded-app/excluded-app.routes.js",
],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
if (process.env.NODE_ENV === "development") {
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
    documentation: "/api-docs",
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
  const PORT = process.env.PORT || 5000;

  // 1. استنى الداتا بيز و Redis يتصلوا الأول
  Promise.all([connectDB(), connectRedis()])
    .then(() => {
      // 2. لما تنجح، شغل السيرفر
      const server = app.listen(PORT, () => {
        console.log(
          `🚀 [Worker ${process.pid}] Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
        );
      });

      // 3. اقفل السيرفر بأمان لو الـ Process اتقفل (Deploy/Restart/Crash)
      const gracefulShutdown = (signal) => {
        console.log(`🛑 [Worker ${process.pid}] Received ${signal}, shutting down gracefully...`);
        server.close(() => {
          Promise.all([mongoose.connection.close(false), disconnectRedis()])
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
      console.error(`❌ [Worker ${process.pid}] Failed to connect to Database or Redis. Server not started.`);
      console.error(err);
      process.exit(1);
    });
}

if (require.main === module) {
  // الـ Node.js Cluster Module: بيفتح نسخة (Worker) من الأبلكيشن على كل Core
  // عشان نستغل كل الأكواد المتاحة في المعالجة بدل ما نشتغل على Core واحد بس.
  // ENABLE_CLUSTER=false بيرجعنا لـ Process واحد (مفيد لو بتستخدم PM2 Cluster Mode
  // بدل الـ Cluster Module ده، أو لو عايز تفادي تعقيد الـ Multi-process في التطوير).
  const ENABLE_CLUSTER = process.env.ENABLE_CLUSTER !== "false";
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
