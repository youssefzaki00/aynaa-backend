/**
 * Application Constants
 * Centralized location for all enums, constants, and magic values
 */

// Suggestion Types
const SUGGESTION_TYPES = ['BLOCK_WORD', 'UNBLOCK_WORD', 'WHITELIST_APP'];

// Customization Request Types
const CUSTOMIZATION_TYPES = [
  'CUSTOM_BLOCK_KEYWORD',
  'CUSTOM_ALLOW_KEYWORD',
  'CUSTOM_WHITELIST_APP',
  'CUSTOM_BLACKLIST_APP',
];

// Review Statuses
const REVIEW_STATUSES = ['APPROVED', 'REJECTED'];

// Request Statuses
const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

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
const envOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') // حول النص لمصفوفة
  : [];

// 2. دي القيم الثابتة اللي عايزها دايماً موجودة
const defaultOrigins = [
  'http://localhost:3000/',
  'http://localhost:5173/',
  'https://dashboard.wekayaa.com/',
  'https://wekayaa.com/'
];

// 3. ادمج الاثنين مع بعض (عشان تضمن إن كله شغال)
const FINAL_ALLOWED_ORIGINS = [...new Set([...envOrigins, ...defaultOrigins])]
module.exports = {
  SUGGESTION_TYPES,
  CUSTOMIZATION_TYPES,
  REVIEW_STATUSES,
  REQUEST_STATUSES,
  DEFAULT_PAGINATION,
  VALIDATION_LIMITS,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_should_change_in_prod',
  JWT_EXPIRE: '30d',
  ALLOWED_ORIGINS: FINAL_ALLOWED_ORIGINS,
};
