const { DEFAULT_PAGINATION } = require("../config/constant");
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

    // Verify category exists
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
    const { categoryId, isActive, isBlocked } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true" || isActive === true;
    }

    if (isBlocked !== undefined) {
      filter.isBlocked = isActive === "true" || isBlocked === true;
    }

    if (!req.user || req.user.role !== "admin") {
      // user access: only active sites
      filter.isActive = true;
    }

    if (categoryId) {
      // Verify category exists
      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return sendError(res, 404, "Category not found");
      }

      filter.categoryId = category._id;
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

    sendSuccess(res, 200, "Sites retrieved successfully", {
      sites,
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

    const site = await Site.findById(id);
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

    const site = await Site.findById(id);
    if (!site) {
      return sendError(res, 404, "Site not found");
    }

    await Site.findByIdAndDelete(id);

    return sendSuccess(res, 200, "Site deleted successfully", { id });
  } catch (error) {
    return next(error);
  }
};

const uploadSitesFile = async (req, res, next)=>{
  try {
    await seedSitesFileToDB(req.file.path, req.body.categoryId)
  
    return sendSuccess(res, 200, "Sites is seeded successfully");
    
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createSite,
  getSites,
  updateSite,
  deleteSite,
  uploadSitesFile
};
