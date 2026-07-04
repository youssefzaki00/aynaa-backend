const Site = require("./Site");
const Category = require("../models/Category");
const { executePaginatedQuery } = require("../utils/pagination");
const { sendSuccess, sendError } = require("../utils/response");
const { validateRequiredFields } = require("../utils/validation");
const { seedSitesFileToDB } = require("./site.service");

const createSite = async (req, res, next) => {
  try {
    const { url, isActive, isBlocked, categoryId } = req.body;

    const validation = validateRequiredFields(req.body, ["url", "categoryId"]);
    if (!validation.valid) {
      return sendError(
        res,
        400,
        `Missing required fields: ${validation.missing.join(", ")}`,
      );
    }

    const category = await Category.findOne({ _id: categoryId });
    if (!category) {
      return sendError(res, 404, "Category not found");
    }

    if (!category.isActive) {
      return sendError(
        res,
        400,
        "Cannot create keyword with inactive category",
      );
    }

    const site = await Site.create({
      url: url.trim(),
      category: category._id,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : true,
    });

    return sendSuccess(res, 201, "Site created successfully", { site });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, "Site URL already exists");
    }
    return next(error);
  }
};

const getSites = async (req, res, next) => {
  try {
    const { categoryId, isActive, isBlocked, lastSync } = req.query;
    const filter = { deletedAt: null };

    if (isActive !== undefined) {
      filter.isActive = isActive === "true" || isActive === true;
    }

    if (isBlocked !== undefined) {
      filter.isBlocked = isBlocked === "true" || isBlocked === true;
    }

    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    if (categoryId) {
      filter.category = categoryId;
    }

    if (lastSync) {
      const since = new Date(lastSync);
      filter.$or = [
        { createdAt: { $gt: since } },
        { updatedAt: { $gt: since } },
      ];
    }

    const { items: sites, pagination } = await executePaginatedQuery({
      model: Site,
      filter,
      query: req.query,
      populate: {
        path: "category",
        select: "_id name displayName",
      },
    });

    const transformedSites = sites.map((site) => {
      const siteObj = site.toJSON();
      if (siteObj.category) {
        siteObj.category.id = siteObj.category._id;
        delete siteObj.category._id;
      }
      return siteObj;
    });

    let deletedSiteIds = [];
    if (lastSync) {
      const since = new Date(lastSync);
      const tombstones = await Site.find({ deletedAt: { $gt: since } }).select("_id");
      deletedSiteIds = tombstones.map((d) => d._id);
    }

    sendSuccess(res, 200, "Sites retrieved successfully", {
      sites: transformedSites,
      deletedSiteIds,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, isActive } = req.body;

    const site = await Site.findOne({ _id: id, deletedAt: null });
    if (!site) {
      return sendError(res, 404, "Site not found");
    }

    if (url !== undefined) {
      site.url = url.trim();
    }
    if (isActive !== undefined) {
      site.isActive = Boolean(isActive);
    }

    await site.save();

    return sendSuccess(res, 200, "Site updated successfully", { site });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, "Site URL already exists");
    }
    return next(error);
  }
};

const deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const site = await Site.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );

    return sendSuccess(res, 200, "Site deleted successfully", {
      id: site ? site._id.toString() : null,
    });
  } catch (error) {
    return next(error);
  }
};

const uploadSitesFile = async (req, res, next) => {
  try {
    await seedSitesFileToDB(req.file.path, req.body.categoryId);

    return sendSuccess(res, 200, "Sites is seeded successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSite,
  getSites,
  updateSite,
  deleteSite,
  uploadSitesFile,
};
