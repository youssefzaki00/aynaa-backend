const CustomizationRequest = require('../models/CustomizationRequest');
const Device = require('../models/Device');
const { sendSuccess, sendError } = require('../utils/response');
const { executePaginatedQuery } = require('../utils/pagination');
const {
  isValidCustomizationType,
  isValidReviewStatus,
  canBeReviewed,
  validateRequiredFields,
} = require('../utils/validation');
const { CUSTOMIZATION_TYPES, REVIEW_STATUSES } = require('../config/constant');

/**
 * Submit a customization request
 * POST /api/v1/customization/request
 */
const submitCustomizationRequest = async (req, res, next) => {
  try {
    const { deviceId, type, content, appName, reason } = req.body;

    const validation = validateRequiredFields(req.body, [
      'deviceId',
      'type',
      'content',
      'reason',
    ]);
    if (!validation.valid) {
      return sendError(
        res,
        400,
        `Missing required fields: ${validation.missing.join(', ')}`
      );
    }

    if (!isValidCustomizationType(type)) {
      return sendError(
        res,
        400,
        `Invalid request type. Allowed: ${CUSTOMIZATION_TYPES.join(', ')}`
      );
    }

    // Verify device exists
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return sendError(res, 404, 'Device not found');
    }

    // Check for existing pending request to avoid duplicates
    const existingRequest = await CustomizationRequest.findOne({
      deviceId,
      type,
      content,
      status: 'PENDING',
    });

    if (existingRequest) {
      return sendError(
        res,
        400,
        'A pending request for this content already exists'
      );
    }

    const request = await CustomizationRequest.create({
      deviceId,
      type,
      content,
      appName: appName || null,
      reason,
      status: 'PENDING',
    });

    sendSuccess(res, 201, 'Customization request submitted successfully', {
      requestId: request.uuid,
      status: request.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customization requests status for a device
 * GET /api/v1/customization/status?deviceId=xxx
 */
const getCustomizationStatus = async (req, res, next) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return sendError(res, 400, 'Device ID is required');
    }

    const requests = await CustomizationRequest.find({ deviceId })
      .sort({ createdAt: -1 })
      .select('-__v');

    sendSuccess(res, 200, 'Requests status retrieved', {
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Get all requests
 * GET /api/v1/admin/customization/requests
 */
const getAllCustomizationRequests = async (req, res, next) => {
  try {
    const { status, type, deviceId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (deviceId) filter.deviceId = deviceId;

    const { items: requests, pagination } = await executePaginatedQuery({
      model: CustomizationRequest,
      filter,
      query: req.query,
    });

    sendSuccess(res, 200, 'Requests retrieved', {
      requests,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Review request
 * PATCH /api/v1/admin/customization/review/:id
 */
const reviewCustomizationRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!status || !isValidReviewStatus(status)) {
      return sendError(
        res,
        400,
        `Valid status required. Allowed: ${REVIEW_STATUSES.join(', ')}`
      );
    }

    const request = await CustomizationRequest.findOne({ uuid: id });
    if (!request) {
      return sendError(res, 404, 'Request not found');
    }

    if (!canBeReviewed(request)) {
      return sendError(res, 400, 'This request has already been reviewed');
    }

    request.status = status;
    request.adminNote = adminNote || null;
    request.reviewedAt = new Date();
    await request.save();

    // If APPROVED, update the Device model
    if (status === 'APPROVED') {
      const device = await Device.findOne({ deviceId: request.deviceId });

      if (device) {
        switch (request.type) {
          case 'CUSTOM_BLOCK_KEYWORD':
            if (!device.customBlockedKeywords.includes(request.content)) {
              device.customBlockedKeywords.push(request.content);
            }
            break;
          case 'CUSTOM_ALLOW_KEYWORD':
            if (!device.customAllowedKeywords.includes(request.content)) {
              device.customAllowedKeywords.push(request.content);
            }
            break;
          case 'CUSTOM_WHITELIST_APP':
            if (!device.customWhitelistedApps.includes(request.content)) {
              device.customWhitelistedApps.push(request.content);
            }
            break;
          case 'CUSTOM_BLACKLIST_APP':
            if (!device.customBlacklistedApps.includes(request.content)) {
              device.customBlacklistedApps.push(request.content);
            }
            break;
        }
        await device.save();
      } else {
        console.warn(
          `[CustomizationReview] Device ${request.deviceId} not found for approved request ${request._id}`
        );
      }
    }

    sendSuccess(res, 200, 'Request reviewed successfully', {
      requestId: request._id,
      status: request.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCustomizationRequest,
  getCustomizationStatus,
  getAllCustomizationRequests,
  reviewCustomizationRequest,
};
