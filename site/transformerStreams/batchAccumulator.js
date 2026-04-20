const { Transform } = require("stream");
const Site = require("../Site");
const { SITES_UPLOAD_PATCH_ACCUMULATOR_SIZE } = require("../config");

/**
 * Transform stream that accumulates parsed site documents into batches.
 *
 * Batching reduces the number of MongoDB insert operations and improves
 * performance when importing a large number of entries.
 *
 * The stream flushes automatically once the configured batch size is reached,
 * and also flushes any remaining documents when the pipeline ends.
 */
exports.batchAccumulator = new Transform({
  objectMode: true,
  transform(doc, encoding, callback) {
    if (!this.batch) this.batch = [];
    this.batch.push(doc);
    if (this.batch.length >= SITES_UPLOAD_PATCH_ACCUMULATOR_SIZE) {
      this._flush(callback);
    } else {
      callback();
    }
  },
  flush(callback) {
    if (this.batch && this.batch.length > 0) {
      const toSendBatch = this.batch;
      this.batch = [];
      Site.insertMany(toSendBatch, { ordered: false })
        .then(() => {
          callback();
        })
        .catch((err) => callback(err));
    } else {
      callback();
    }
  },
});
