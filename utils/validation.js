/**
 * Validation Utilities
 * Common validation functions used across controllers
 */

const { 
  REVIEW_STATUSES, 
  REQUEST_STATUSES,
  SUGGESTION_TYPES,
  CUSTOMIZATION_TYPES,
  VALIDATION_LIMITS 
} = require('../config/constant');

/**
 * Validate review status
 * @param {String} status - Status to validate
 * @returns {Boolean} True if valid
 */
const isValidReviewStatus = (status) => {
  return REVIEW_STATUSES.includes(status);
};

/**
 * Validate request status
 * @param {String} status - Status to validate
 * @returns {Boolean} True if valid
 */
const isValidRequestStatus = (status) => {
  return REQUEST_STATUSES.includes(status);
};

/**
 * Validate suggestion type
 * @param {String} type - Type to validate
 * @returns {Boolean} True if valid
 */
const isValidSuggestionType = (type) => {
  return SUGGESTION_TYPES.includes(type);
};

/**
 * Validate customization type
 * @param {String} type - Type to validate
 * @returns {Boolean} True if valid
 */
const isValidCustomizationType = (type) => {
  return CUSTOMIZATION_TYPES.includes(type);
};

/**
 * Check if item can be reviewed (status is PENDING)
 * @param {Object} item - Item with status property
 * @returns {Boolean} True if can be reviewed
 */
const canBeReviewed = (item) => {
  return item && item.status === 'PENDING';
};

/**
 * Validate string length
 * @param {String} str - String to validate
 * @param {Number} maxLength - Maximum length
 * @returns {Boolean} True if valid
 */
const isValidLength = (str, maxLength = VALIDATION_LIMITS.MAX_STRING_LENGTH) => {
  return typeof str === 'string' && str.trim().length > 0 && str.length <= maxLength;
};

/**
 * Sanitize and normalize word input
 * @param {String} word - Word to normalize
 * @returns {String} Normalized word
 */
const normalizeWord = (word) => {
  return word.toLowerCase().trim();
};

/**
 * Check if required fields are present
 * @param {Object} data - Data object to check
 * @param {Array<String>} requiredFields - Array of required field names
 * @returns {Object} { valid: Boolean, missing: Array<String> }
 */
const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
};

module.exports = {
  isValidReviewStatus,
  isValidRequestStatus,
  isValidSuggestionType,
  isValidCustomizationType,
  canBeReviewed,
  isValidLength,
  normalizeWord,
  validateRequiredFields,
};
