/**
 * Search utilities for list/filter queries
 */

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Apply case-insensitive partial-match search across string fields.
 * Safely composes with existing $or (e.g. lastSync) via $and.
 *
 * @param {Object} filter - MongoDB filter object (mutated)
 * @param {string} search - Search term from query string
 * @param {string[]} fields - Document fields to search
 * @returns {Object} The same filter object
 */
const applySearchFilter = (filter, search, fields) => {
  if (!search || !fields?.length) return filter;

  const term = String(search).trim();
  if (!term) return filter;

  const searchClause = {
    $or: fields.map((field) => ({
      [field]: { $regex: escapeRegex(term), $options: "i" },
    })),
  };

  if (filter.$or) {
    const existingOr = filter.$or;
    delete filter.$or;
    if (!filter.$and) filter.$and = [];
    filter.$and.push({ $or: existingOr }, searchClause);
    return filter;
  }

  if (filter.$and) {
    filter.$and.push(searchClause);
    return filter;
  }

  filter.$or = searchClause.$or;
  return filter;
};

module.exports = {
  escapeRegex,
  applySearchFilter,
};
