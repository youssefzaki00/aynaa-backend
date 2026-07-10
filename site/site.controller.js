const Site = require("./Site");
const Category = require("../models/Category");
const { executePaginatedQuery } = require("../utils/pagination");
const { sendSuccess, sendError } = require("../utils/response");
const { validateRequiredFields } = require("../utils/validation");
const { seedSitesFileToDB } = require("./site.service");
const { invalidateListCache } = require("../utils/cacheInvalidate");

const toBool = (value) => value === true || value === "true";

const createSite = async (req, res, next) => {
  try {
    const { url, isActive, categoryId } = req.body;

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

    const normalizedUrl = url.trim().toLowerCase();
    const existing = await Site.findOne({ url: normalizedUrl });

    if (existing) {
      if (!existing.deletedAt) {
        return sendError(res, 409, "Site URL already exists");
      }

      existing.deletedAt = null;
      existing.category = category._id;
      if (isActive !== undefined) {
        existing.isActive = toBool(isActive);
      }
      await existing.save();

      await invalidateListCache("SITES");

      return sendSuccess(res, 200, "Site restored successfully", { site: existing });
    }

    const site = await Site.create({
      url: normalizedUrl,
      category: category._id,
      isActive: isActive !== undefined ? toBool(isActive) : true,
    });

    await invalidateListCache("SITES");

    return sendSuccess(res, 201, "Site created successfully", { site });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "Site URL already exists");
    }
    return next(error);
  }
};

const getSites = async (req, res, next) => {
  try {
    const { categoryId, isActive, lastSync } = req.query;
    const filter = { deletedAt: null };

    if (isActive !== undefined) {
      filter.isActive = toBool(isActive);
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
      searchFields: ["url"],
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

    let deleted = [];
    if (lastSync) {
      const since = new Date(lastSync);
      const tombstones = await Site.find({ deletedAt: { $gt: since } }).select("_id");
      deleted = tombstones.map((d) => d._id);
    }

    sendSuccess(res, 200, "Sites retrieved successfully", {
      items: transformedSites,
      deleted,
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
      site.isActive = toBool(isActive);
    }

    await site.save();

    await invalidateListCache("SITES");

    return sendSuccess(res, 200, "Site updated successfully", { site });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "Site URL already exists");
    }
    return next(error);
  }
};

const deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const site = await Site.findById(id);

    if (!site) {
      return sendError(res, 404, "Site not found");
    }

    if (site.deletedAt) {
      return sendSuccess(res, 200, "Site deleted successfully", {
        id: site._id.toString(),
      });
    }

    site.deletedAt = new Date();
    await site.save();

    await invalidateListCache("SITES");

    return sendSuccess(res, 200, "Site deleted successfully", {
      id: site._id.toString(),
    });
  } catch (error) {
    return next(error);
  }
};

const uploadSitesFile = async (req, res, next) => {
  try {
    await seedSitesFileToDB(req.file.path, req.body.categoryId);

    await invalidateListCache("SITES");

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
