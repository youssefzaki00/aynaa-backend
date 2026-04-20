const fs = require("fs");
const split2 = require("split2");
const Category = require("../models/Category");
const { urlParser } = require("./transformerStreams/urlParser");
const { getDocTransformer } = require("./transformerStreams/docTransformer");
const { batchAccumulator } = require("./transformerStreams/batchAccumulator");

/**
 * Seed a text upload file to the sites collection.
 *
 * The uploaded file is read as a stream and processed through a transform pipeline:
 *   1. split2 - split incoming stream into individual lines
 *   2. urlParser - extract valid host entries from each line
 *   3. getDocTransformer - convert each URL into a site document
 *   4. batchAccumulator - insert documents in batches for efficiency
 *
 * After processing completes, the uploaded file is removed from disk.
 *
 * @param {string} filepath - Path to the uploaded file on disk.
 * @param {string} categoryId - MongoDB category ID to assign to each imported site.
 * @returns {Promise<void>}
 * @throws {Error} When category is missing or file processing fails.
 */
exports.seedSitesFileToDB = async (filepath, categoryId) => {
  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // Read file from uploads as readable stream
  const readStream = fs.createReadStream(filepath);

  // Pipeline: split2, url parser, url to mongo doc parser, batch accumulator

  await new Promise((resolve, reject) => {
    readStream
      .pipe(split2())
      .pipe(urlParser)
      .pipe(getDocTransformer(categoryId))
      .pipe(batchAccumulator)
      .on("finish", resolve)
      .on("error", reject);
  });

  await fs.promises.rm(filepath)
};
