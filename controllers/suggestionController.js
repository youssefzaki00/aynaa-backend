const Suggestion = require('../models/Suggestion');
const Device = require('../models/Device');
const { sendSuccess, sendError } = require('../utils/response');
const { executePaginatedQuery } = require('../utils/pagination');
const { 
  isValidSuggestionType, 
  isValidReviewStatus, 
  canBeReviewed,
  validateRequiredFields 
} = require('../utils/validation');
const { SUGGESTION_TYPES, REVIEW_STATUSES } = require('../config/constant');

/**
 * Submit a suggestion
 * POST /api/v1/suggestions
 */
const submitSuggestion = async (req, res, next) => {
  try {
    const { deviceId, type, content, note } = req.body;

    const validation = validateRequiredFields(req.body, ['type', 'content']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    if (!isValidSuggestionType(type)) {
      return sendError(res, 400, `Invalid suggestion type. Allowed: ${SUGGESTION_TYPES.join(', ')}`);
    }

    let deviceObjectId = null;

    // If deviceId is provided, verify it exists
    if (deviceId) {
      const device = await Device.findOne({ deviceId });
      if (device) {
        deviceObjectId = device._id;
      }
    }

    // Create suggestion
    const suggestion = await Suggestion.create({
      deviceId: deviceObjectId,
      type,
      content: content.trim(),
      note: note || null,
      status: 'PENDING',
    });

    sendSuccess(res, 201, 'Suggestion submitted successfully', {
      suggestionId: suggestion.uuid,
      status: suggestion.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Get all suggestions with filters
 * GET /api/v1/admin/suggestions?status=PENDING&type=BLOCK_WORD&page=1&limit=20
 */
const getAllSuggestions = async (req, res, next) => {
  try {
    const { status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const { items: suggestions, pagination } = await executePaginatedQuery({
      model: Suggestion,
      filter,
      query: req.query,
      searchFields: ['content', 'note'],
      populate: { path: 'deviceId', select: 'deviceId' },
    });

    sendSuccess(res, 200, 'Suggestions retrieved', {
      suggestions,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Review/Approve/Reject a suggestion
 * PATCH /api/v1/admin/suggestions/review/:id
 */
const reviewSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !isValidReviewStatus(status)) {
      return sendError(res, 400, `Valid status required. Allowed: ${REVIEW_STATUSES.join(', ')}`);
    }

    const suggestion = await Suggestion.findOne({ uuid: id });
    if (!suggestion) {
      return sendError(res, 404, 'Suggestion not found');
    }

    if (!canBeReviewed(suggestion)) {
      return sendError(res, 400, 'This suggestion has already been reviewed');
    }

    suggestion.status = status;
    await suggestion.save();

    sendSuccess(res, 200, 'Suggestion reviewed successfully', {
      suggestionId: suggestion.uuid,
      status: suggestion.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitSuggestion,
  getAllSuggestions,
  reviewSuggestion,
};
