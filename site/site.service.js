const fs = require("fs");
const split2 = require("split2");
const Category = require("../models/Category");
const { urlParser } = require("./transformerStreams/urlParser");
const { getDocTransformer } = require("./transformerStreams/docTransformer");
const { batchAccumulator } = require("./transformerStreams/batchAccumulator");

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
