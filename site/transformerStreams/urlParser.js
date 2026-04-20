const { Transform } = require("stream");


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
