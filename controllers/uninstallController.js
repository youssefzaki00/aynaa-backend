const UninstallRequest = require('../models/UninstallRequest');
const Device = require('../models/Device');
const { sendSuccess, sendError } = require('../utils/response');
const { uploadFile, deleteMultipleFiles } = require('../utils/r2Helper');
const crypto = require('crypto');

/**
 * Submit an uninstall request with image proof
 * POST /api/v1/uninstall/request
 */
const submitUninstallRequest = async (req, res, next) => {
  try {
    const { deviceId, reason } = req.body;
    const files = req.files;

    if (!deviceId || !reason) {
      return sendError(res, 400, 'Device ID and reason are required');
    }

    if (!files || files.length === 0) {
      return sendError(res, 400, 'At least one proof image is required');
    }

    // Find device
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return sendError(res, 404, 'Device not found. Please sync first.');
    }

    // Check if there's already a pending request
    const existingRequest = await UninstallRequest.findOne({
      deviceId: device._id,
      status: 'PENDING',
    });

    if (existingRequest) {
      return sendError(res, 400, 'You already have a pending uninstall request');
    }

    // Upload images to R2
    const imageUploadPromises = files.map((file) =>
      uploadFile(file.buffer, file.mimetype)
    );
    const imageUrls = await Promise.all(imageUploadPromises);

    // Create uninstall request
    const uninstallRequest = await UninstallRequest.create({
      deviceId: device._id,
      reason,
      imageUrls,
      status: 'PENDING',
    });

    sendSuccess(res, 201, 'Uninstall request submitted successfully', {
      requestId: uninstallRequest._id,
      status: uninstallRequest.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check uninstall request status
 * GET /api/v1/uninstall/status?deviceId=xxx
 */
const checkUninstallStatus = async (req, res, next) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return sendError(res, 400, 'Device ID is required');
    }

    // Find device
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return sendError(res, 404, 'Device not found');
    }

    // Find the latest request
    const request = await UninstallRequest.findOne({ deviceId: device._id })
      .sort({ createdAt: -1 })
      .select('-imageUrls -__v');

    if (!request) {
      return sendSuccess(res, 200, 'No uninstall request found', {
        status: 'NONE',
      });
    }

    const responseData = {
      requestId: request._id,
      status: request.status,
      reason: request.reason,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      adminNote: request.adminNote,
    };

    // Include unlock code only if approved
    if (request.status === 'APPROVED' && request.unlockCode) {
      responseData.unlockCode = request.unlockCode;
    }

    sendSuccess(res, 200, 'Request status retrieved', responseData);
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: Get all uninstall requests with filters
 * GET /api/v1/admin/uninstall/requests?status=PENDING&page=1&limit=20
 */
const getAllUninstallRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await UninstallRequest.find(filter)
      .populate('deviceId', 'deviceId metadata')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await UninstallRequest.countDocuments(filter);

    sendSuccess(res, 200, 'Uninstall requests retrieved', {
      requests,
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
 * ADMIN: Review/Approve/Reject an uninstall request
 * PATCH /api/v1/admin/uninstall/review/:id
 */
const reviewUninstallRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return sendError(res, 400, 'Valid status (APPROVED or REJECTED) is required');
    }

    const request = await UninstallRequest.findById(id);
    if (!request) {
      return sendError(res, 404, 'Uninstall request not found');
    }

    if (request.status !== 'PENDING') {
      return sendError(res, 400, 'This request has already been reviewed');
    }

    // Update request
    request.status = status;
    request.adminNote = adminNote || null;
    request.reviewedAt = Date.now();

    // Generate unlock code if approved
    if (status === 'APPROVED') {
      request.unlockCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    await request.save();

    // Delete images from R2 to save space (fire and forget)
    if (request.imageUrls && request.imageUrls.length > 0) {
      deleteMultipleFiles(request.imageUrls).catch((err) =>
        console.error('Error deleting images:', err)
      );
    }

    sendSuccess(res, 200, 'Uninstall request reviewed successfully', {
      requestId: request._id,
      status: request.status,
      unlockCode: request.unlockCode,
      adminNote: request.adminNote,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitUninstallRequest,
  checkUninstallStatus,
  getAllUninstallRequests,
  reviewUninstallRequest,
};
