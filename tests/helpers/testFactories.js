const Category = require("../../models/Category");
const Keyword = require("../../models/Keyword");
const { track, testCategoryName, testWord } = require("./testContext");

const createTestCategory = async (suffix = "cat") => {
  const name = testCategoryName(suffix);
  const category = await Category.create({
    name,
    displayName: `Test ${suffix}`,
    isActive: true,
  });
  track("categories", category._id);
  return category;
};

const createTestKeywords = async (count, categoryId) => {
  const keywords = Array.from({ length: count }, (_, i) => ({
    word: testWord(`kw-${i}`),
    category: categoryId,
    isEnabled: true,
  }));

  const inserted = await Keyword.insertMany(keywords);
  inserted.forEach((doc) => track("keywords", doc._id));
  return inserted;
};

module.exports = { createTestCategory, createTestKeywords };
