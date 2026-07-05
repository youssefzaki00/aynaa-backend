const { sendSuccess, sendError } = require("../utils/response");
const {
  validateRequiredFields,
  isValidRequestStatus,
} = require("../utils/validation");
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
} = require("../services/request.service");

const postRequestController = async (req, res, next) => {
  try {
    const { type, status, message, details, createdAt } = req.body;
    const currentUser = req.user;

    const validation = validateRequiredFields(req.body, ["type"]);
    if (!validation.valid) {
      return sendError(
        res,
        400,
        `Missing required fields: ${validation.missing.join(", ")}`,
      );
    }

    if (status && !isValidRequestStatus(status)) {
      return sendError(res, 400, "Invalid request status");
    }

    const request = await createRequest({
      userId: currentUser.id,
      type,
      status,
      message,
      details,
      createdAt,
    });

    return sendSuccess(res, 201, "Request created successfully", {
      request: {
        id: request.id,
        userId: request.userId,
        type: request.type,
        status: request.status,
        message: request.message,
        details: request.details,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getRequestsController = async (req, res, next) => {
  try {
    const { type, userId, search, page = 1, limit = 20 } = req.query;
    const currentUser = req.user;
    const requestedUserId = userId || currentUser.id;

    if (userId && userId !== currentUser.id && currentUser.role != "admin") {
      return sendError(res, 403, "Can't access this resource");
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const { requests, pagination } = await getRequests({
      userId: requestedUserId,
      type,
      search,
      page: pageNumber,
      limit: limitNumber,
    });

    return sendSuccess(res, 200, "Requests retrieved successfully", {
      requests: requests.map((request) => ({
        id: request.id,
        userId: request.userId,
        type: request.type,
        status: request.status,
        message: request.message,
        details: request.details,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const updateRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message, details } = req.body;
    const currentUser = req.user;

    const existing = await getRequestById(id);
    if (!existing) {
      return sendError(res, 404, "Request not found");
    }

    if (
      existing.userId.toString() !== currentUser.id &&
      currentUser.role != "admin"
    ) {
      return sendError(res, 403, "Can't access this resource");
    }

    const updates = {};
    if (status !== undefined) {
      if (!isValidRequestStatus(status)) {
        return sendError(res, 400, "Invalid request status");
      }
      updates.status = status;
    }
    if (message !== undefined) updates.message = message;
    if (details !== undefined) updates.details = details;

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, "No valid fields to update");
    }

    const updated = await updateRequest(id, updates);

    return sendSuccess(res, 200, "Request updated successfully", {
      request: {
        id: updated.id,
        userId: updated.userId,
        type: updated.type,
        status: updated.status,
        message: updated.message,
        details: updated.details,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const existing = await getRequestById(id);
    if (!existing) {
      return sendError(res, 404, "Request not found");
    }

    if (existing.userId.toString() !== currentUser.id) {
      return sendError(res, 403, "Can't access this resource");
    }

    await deleteRequest(id);
    return sendSuccess(res, 200, "Request deleted successfully", {
      deletedRequest: {
        id: existing.id,
        userId: existing.userId,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  postRequestController,
  getRequestsController,
  updateRequestController,
  deleteRequestController,
};
