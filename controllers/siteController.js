const Site = require('../models/Site');
const { sendSuccess, sendError } = require('../utils/response');
const { validateRequiredFields } = require('../utils/validation');

const createSite = async (req, res, next) => {
  try {
    const { url, isActive } = req.body;

    const validation = validateRequiredFields(req.body, ['url']);
    if (!validation.valid) {
      return sendError(res, 400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const site = await Site.create({
      url: url.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return sendSuccess(res, 201, 'Site created successfully', { site });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Site URL already exists');
    }
    return next(error);
  }
};

const getSites = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (!req.user || req.user.role !== 'superadmin') {
      // user access: only active sites
      filter.isActive = true;
    }

    const sites = await Site.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Sites retrieved successfully', { sites });
  } catch (error) {
    return next(error);
  }
};

const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, isActive } = req.body;

    const site = await Site.findById(id);
    if (!site) {
      return sendError(res, 404, 'Site not found');
    }

    if (url !== undefined) {
      site.url = url.trim();
    }
    if (isActive !== undefined) {
      site.isActive = Boolean(isActive);
    }

    await site.save();

    return sendSuccess(res, 200, 'Site updated successfully', { site });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Site URL already exists');
    }
    return next(error);
  }
};

const deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const site = await Site.findById(id);
    if (!site) {
      return sendError(res, 404, 'Site not found');
    }

    await Site.findByIdAndDelete(id);

    return sendSuccess(res, 200, 'Site deleted successfully', { id });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSite,
  getSites,
  updateSite,
  deleteSite,
};
