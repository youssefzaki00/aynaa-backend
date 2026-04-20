const { Transform } = require("stream");

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
