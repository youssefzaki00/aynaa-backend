/**
 * Validation Middleware
 * Express middleware for common validation patterns
 */

const { sendError } = require('../utils/response');

/**
 * Middleware to find a document by UUID
 * Attaches found document to req object as req.document
 * @param {Object} model - Mongoose model to search
 * @param {String} paramName - Name of the param containing UUID (default: 'id')
 * @param {String} attachAs - Property name to attach document to req (default: 'document')
 * @returns {Function} Express middleware
 */
const findByUuid = (model, paramName = 'id', attachAs = 'document') => {
  return async (req, res, next) => {
    try {
      const uuid = req.params[paramName];
      const document = await model.findOne({ uuid });

      if (!document) {
        return sendError(res, 404, `${model.modelName} not found`);
      }

      req[attachAs] = document;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate required fields in request body
 * @param {Array<String>} fields - Array of required field names
 * @returns {Function} Express middleware
 */
const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return sendError(res, 400, `Missing required fields: ${missing.join(', ')}`);
    }
    
    next();
  };
};

/**
 * Middleware to validate that a value is in a list of allowed values
 * @param {String} fieldName - Name of the field to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {String} source - Source of the value ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validateEnum = (fieldName, allowedValues, source = 'body') => {
  return (req, res, next) => {
    const value = req[source][fieldName];
    
    if (value && !allowedValues.includes(value)) {
      return sendError(
        res, 
        400, 
        `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`
      );
    }
    
    next();
  };
};

/**
 * Middleware to ensure document has status PENDING before review
 * Requires document to be attached via findByUuid middleware
 * @param {String} documentKey - Key where document is attached (default: 'document')
 * @returns {Function} Express middleware
 */
const requirePendingStatus = (documentKey = 'document') => {
  return (req, res, next) => {
    const document = req[documentKey];
    
    if (!document) {
      return sendError(res, 500, 'Document not found in request');
    }
    
    if (document.status !== 'PENDING') {
      return sendError(res, 400, 'This item has already been reviewed');
    }
    
    next();
  };
};

module.exports = {
  findByUuid,
  requireFields,
  validateEnum,
  requirePendingStatus,
};
