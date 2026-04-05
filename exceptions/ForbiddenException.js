class ForbiddedException extends Error {
  constructor(message) {
    super(message);
  }
}

module.exports = ForbiddedException;
