const { Transform } = require("stream");

/**
 * Returns a transform stream that converts a parsed URL into a MongoDB site
 * document.
 *
 * Each URL is normalized to lowercase, attached to the provided category, and
 * marked as active before being passed downstream.
 *
 * @param {string} categoryId - Category ID to assign to each generated document.
 * @returns {Transform}
 */
exports.getDocTransformer = (categoryId) => {
  return new Transform({
    objectMode: true,
    transform(url, encoding, callback) {
      const doc = {
        url: url.toLowerCase(),
        category: categoryId,
        isActive: true,
      };
      callback(null, doc);
    },
  });
};
