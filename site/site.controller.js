const Site = require("./Site");
const Category = require("../models/Category");
const { executePaginatedQuery } = require("../utils/pagination");
const { sendSuccess, sendError } = require("../utils/response");
const { validateRequiredFields } = require("../utils/validation");
const { buildCacheKey, getOrSetCache, invalidateNamespace } = require("../utils/cache");
const { seedSitesFileToDB } = require("./site.service");

const SITES_CACHE_NS = "sites";

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

    void invalidateNamespace(SITES_CACHE_NS);

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
    const isAdmin = Boolean(req.user && req.user.role === "admin");

    const fetchSites = async () => {
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

      return {
        sites: transformedSites,
        deletedSiteIds: [],
        pagination,
      };
    };

    if (lastSync) {
      const since = new Date(lastSync);
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

      filter.$or = [
        { createdAt: { $gt: since } },
        { updatedAt: { $gt: since } },
      ];

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

      const tombstones = await Site.find({ deletedAt: { $gt: since } }).select("_id");

      return sendSuccess(res, 200, "Sites retrieved successfully", {
        sites: transformedSites,
        deletedSiteIds: tombstones.map((d) => d._id),
        pagination,
      });
    }

    const cacheKey = buildCacheKey(SITES_CACHE_NS, {
      categoryId,
      isActive,
      isBlocked,
      isAdmin,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    const { data } = await getOrSetCache(cacheKey, fetchSites);

    sendSuccess(res, 200, "Sites retrieved successfully", data);
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

    void invalidateNamespace(SITES_CACHE_NS);

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

    void invalidateNamespace(SITES_CACHE_NS);

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

    void invalidateNamespace(SITES_CACHE_NS);

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
