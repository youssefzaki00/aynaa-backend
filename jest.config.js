module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!@faker-js/faker)"
  ]
};
