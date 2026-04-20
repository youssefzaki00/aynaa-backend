const { Transform } = require("stream");

/**
 * Transform stream that extracts hostnames from a hosts-format upload file.
 *
 * Only lines that begin with `0.0.0.0 ` are considered valid imports.
 * Invalid lines are ignored silently.
 */
exports.urlParser = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const line = chunk.toString().trim();
    if (line.startsWith("0.0.0.0 ")) {
      const url = line.split(" ")[1];
      if (url) {
        callback(null, url);
      } else {
        callback();
      }
    } else {
      callback();
    }
  },
});
