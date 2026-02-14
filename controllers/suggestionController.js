const Suggestion = require('../models/Suggestion');
const Device = require('../models/Device');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Submit a suggestion
 * POST /api/v1/suggestions
 */
const submitSuggestion = async (req, res, next) => {
  try {
    const { deviceId, type, content, note } = req.body;

    if (!type || !content) {
      return sendError(res, 400, 'Type and content are required');
    }

    if (!['BLOCK_WORD', 'UNBLOCK_WORD', 'WHITELIST_APP'].includes(type)) {
      return sendError(res, 400, 'Invalid suggestion type');
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
      suggestionId: suggestion._id,
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
    const { status, type, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const suggestions = await Suggestion.find(filter)
      .populate('deviceId', 'deviceId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Suggestion.countDocuments(filter);

    sendSuccess(res, 200, 'Suggestions retrieved', {
      suggestions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
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

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, 400, 'Valid status (APPROVED or REJECTED) is required');
    }

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return sendError(res, 404, 'Suggestion not found');
    }

    if (suggestion.status !== 'PENDING') {
      return sendError(res, 400, 'This suggestion has already been reviewed');
    }

    suggestion.status = status;
    await suggestion.save();

    sendSuccess(res, 200, 'Suggestion reviewed successfully', {
      suggestionId: suggestion._id,
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
