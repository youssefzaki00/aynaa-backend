require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const sanitizeRequest = require('./middleware/sanitization'); // نقلت الاستدعاء هنا للترتيب

// Initialize Express app
const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "aynaa Backend API",
      version: "1.0.1",
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
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for client authentication',
        },
        AdminKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-key',
          description: 'Admin API key for administrative operations',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            deviceId: {
              type: 'string',
              description: 'Device identifier',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Keyword: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Keyword ID',
            },
            word: {
              type: 'string',
              description: 'The keyword text',
            },
            category: {
              $ref: '#/components/schemas/Category',
              description: 'Category object containing category details',
            },
            isEnabled: {
              type: 'boolean',
              description: 'Whether the keyword is active',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Category ID',
            },
            name: {
              type: 'string',
              description: 'Category name (uppercase)',
            },
            displayName: {
              type: 'string',
              description: 'Human-readable category name',
            },
            description: {
              type: 'string',
              description: 'Category description',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the category is active',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Site: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Site ID',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Site URL',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the site is active',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
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
  apis: ['./routes/*.js', './site/*.js'], // Path to the API and site route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
    version: "1.0.0",
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
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  // 1. استنى الداتا بيز تتصل الأول
  connectDB()
    .then(() => {
      // 2. لما تنجح، شغل السيرفر
      app.listen(PORT, () => {
        console.log(
          `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
        );
      });
    })
    .catch((err) => {
      // 3. لو فشلت، متقومش السيرفر واطبع ايرور
      console.error("❌ Failed to connect to Database. Server not started.");
      console.error(err);
      process.exit(1);
    });
}

// Export App for Vercel or Testing
module.exports = app;

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // اقفل السيرفر بأمان لو حصل خطأ غير متوقع
  process.exit(1);
});
