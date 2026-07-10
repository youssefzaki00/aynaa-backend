const Request = require('../models/Request');
const { applySearchFilter } = require('../utils/search');

exports.createRequest = async (payload) => {
  const request = await Request.create(payload);
  return request;
};

exports.findPendingByUser = async (userId) => {
  const request = await Request.findOne({
    userId,
    status: 'PENDING',
  });
  return request;
};

exports.getRequests = async ({ userId, search, page = 1, limit = 20 }) => {
  const filter = {};
  if (userId) filter.userId = userId;

  applySearchFilter(filter, search, ['reason']);

  const total = await Request.countDocuments(filter);
  const skip = (page - 1) * limit;
  const requests = await Request.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

exports.getRequestById = async (id) => {
  const request = await Request.findById(id);
  return request;
};

exports.updateRequest = async (id, updates) => {
  const request = await Request.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  return request;
};

exports.deleteRequest = async (id) => {
  const request = await Request.findByIdAndDelete(id);
  return request;
};
