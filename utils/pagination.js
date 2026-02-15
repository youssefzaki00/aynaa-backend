/**
 * Pagination Utility
 * Provides reusable pagination logic for list endpoints
 */

const { DEFAULT_PAGINATION } = require('../config/constant');

/**
 * Parse and validate pagination parameters from query
 * @param {Object} query - Express request query object
 * @returns {Object} Validated pagination params
 */
const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || DEFAULT_PAGINATION.PAGE;
  const limit = Math.min(
    parseInt(query.limit) || DEFAULT_PAGINATION.LIMIT,
    DEFAULT_PAGINATION.MAX_LIMIT
  );

  return {
    page: Math.max(1, page), // Ensure page is at least 1
    limit: Math.max(1, limit), // Ensure limit is at least 1
    skip: (Math.max(1, page) - 1) * Math.max(1, limit),
  };
};

/**
 * Build pagination response object
 * @param {Number} total - Total count of documents
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationResponse = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
};

/**
 * Execute paginated query and return formatted response
 * @param {Object} options - Pagination options
 * @param {Object} options.model - Mongoose model
 * @param {Object} options.filter - Query filter object
 * @param {Object} options.query - Request query params
 * @param {Object} options.select - Fields to select
 * @param {Object} options.sort - Sort options (default: {createdAt: -1})
 * @param {String|Object} options.populate - Population options
 * @returns {Promise<Object>} Paginated results with metadata
 */
const executePaginatedQuery = async ({
  model,
  filter = {},
  query = {},
  select = '-__v',
  sort = { createdAt: -1 },
  populate = null,
}) => {
  const { page, limit, skip } = parsePaginationParams(query);

  // Build query
  let dbQuery = model.find(filter).select(select).sort(sort).limit(limit).skip(skip);

  // Add population if specified
  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }

  // Execute query and count in parallel
  const [items, total] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPaginationResponse(total, page, limit),
  };
};

module.exports = {
  parsePaginationParams,
  buildPaginationResponse,
  executePaginatedQuery,
};
