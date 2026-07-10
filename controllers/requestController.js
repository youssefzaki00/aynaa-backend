const { sendSuccess, sendError } = require("../utils/response");
const { UserRoles } = require("../config/constant");
const {
  validateRequiredFields,
  isValidRequestStatus,
} = require("../utils/validation");
const {
  createRequest,
  findPendingByUser,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
} = require("../services/request.service");

const formatRequestForApi = (request) => ({
  id: request.id,
  userId: request.userId,
  reason: request.reason,
  status: request.status,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const postRequestController = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const currentUser = req.user;

    const validation = validateRequiredFields(req.body, ["reason"]);
    if (!validation.valid) {
      return sendError(
        res,
        400,
        `Missing required fields: ${validation.missing.join(", ")}`,
      );
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      return sendError(res, 400, "Reason cannot be empty");
    }

    const existingPending = await findPendingByUser(currentUser.id);
    if (existingPending) {
      return sendError(
        res,
        409,
        "A pending uninstall request already exists",
      );
    }

    const request = await createRequest({
      userId: currentUser.id,
      reason: trimmedReason,
      status: "PENDING",
    });

    return sendSuccess(res, 201, "Request created successfully", {
      request: formatRequestForApi(request),
    });
  } catch (error) {
    return next(error);
  }
};

const getRequestsController = async (req, res, next) => {
  try {
    const { userId, search, page = 1, limit = 20 } = req.query;
    const currentUser = req.user;
    const isAdmin = currentUser.role === UserRoles.ADMIN;

    if (userId && userId !== currentUser.id && !isAdmin) {
      return sendError(res, 403, "Can't access this resource");
    }

    const filterUserId = isAdmin ? userId : currentUser.id;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const { requests, pagination } = await getRequests({
      userId: filterUserId,
      search,
      page: pageNumber,
      limit: limitNumber,
    });

    return sendSuccess(res, 200, "Requests retrieved successfully", {
      items: requests.map(formatRequestForApi),
      deleted: [],
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const updateRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const currentUser = req.user;
    const isAdmin = currentUser.role === UserRoles.ADMIN;

    const existing = await getRequestById(id);
    if (!existing) {
      return sendError(res, 404, "Request not found");
    }

    const isOwner = existing.userId.toString() === currentUser.id;

    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Can't access this resource");
    }

    const updates = {};

    if (isAdmin) {
      if (status === undefined) {
        return sendError(res, 400, "No valid fields to update");
      }
      if (!isValidRequestStatus(status)) {
        return sendError(res, 400, "Invalid request status");
      }
      updates.status = status;
    } else {
      if (existing.status !== "PENDING") {
        return sendError(
          res,
          400,
          "Only pending requests can be updated",
        );
      }
      if (reason === undefined) {
        return sendError(res, 400, "No valid fields to update");
      }
      const trimmedReason = String(reason).trim();
      if (!trimmedReason) {
        return sendError(res, 400, "Reason cannot be empty");
      }
      updates.reason = trimmedReason;
    }

    const updated = await updateRequest(id, updates);

    return sendSuccess(res, 200, "Request updated successfully", {
      request: formatRequestForApi(updated),
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
