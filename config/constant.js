const { JWT_SECRET, JWT_EXPIRE } = require("./env");

/**
 * Application Constants
 * Centralized location for all enums, constants, and magic values
 */

// Review Statuses
const REVIEW_STATUSES = ["APPROVED", "REJECTED"];

// Request Statuses
const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

// Pagination Defaults
const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

// Input Validation Limits
const VALIDATION_LIMITS = {
  MAX_STRING_LENGTH: 500,
  MAX_WORD_LENGTH: 100,
  MAX_PACKAGE_NAME_LENGTH: 200,
};
const ALLOWED_ORIGINS = [
  "http://localhost:3000/",
  "http://localhost:5173/",
  "https://dashboard.aynaa.org/",
  "https://aynaa.org/",
];

const UserRoles = {
  ADMIN: "admin",
  USER: "user",
};

module.exports = {
  REVIEW_STATUSES,
  REQUEST_STATUSES,
  DEFAULT_PAGINATION,
  VALIDATION_LIMITS,
  JWT_SECRET: JWT_SECRET || "fallback_secret_should_change_in_prod",
  JWT_EXPIRE,
  ALLOWED_ORIGINS: ALLOWED_ORIGINS,
  UserRoles,
};
