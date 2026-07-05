/**
 * Block Jest from running against the production MongoDB database.
 */

const getDatabaseName = (uri) => {
  const withoutQuery = uri.split("?")[0];
  const segment = withoutQuery.split("/").pop();
  return segment || "";
};

const assertTestDatabase = () => {
  if (process.env.NODE_ENV !== "test") {
    return;
  }

  if (process.env.ALLOW_PRODUCTION_DB_TESTS === "true") {
    console.warn(
      "⚠️  ALLOW_PRODUCTION_DB_TESTS=true — tests may wipe live data!",
    );
    return;
  }

  const uri = process.env.MONGODB_URI || "";

  if (!uri) {
    throw new Error(
      "Tests require MONGODB_URI. Copy .env.test.example to .env.test and use a dedicated test database (e.g. aynaa_test).",
    );
  }

  const dbName = getDatabaseName(uri);
  const isLocal =
    /localhost|127\.0\.0\.1/i.test(uri) || uri.startsWith("mongodb://mongo:");
  const isTestDatabase = /test/i.test(dbName);

  if (isLocal || isTestDatabase) {
    return;
  }

  throw new Error(
    [
      "REFUSING TO RUN TESTS ON NON-TEST DATABASE.",
      `Current database name: "${dbName}"`,
      "Tests must not run against the live production database.",
      "",
      "Production must use database: aynaa",
      "Tests must use a separate database: aynaa_test (or any name containing 'test')",
      "",
      "Fix:",
      "  1. Ensure .env.test exists with MONGODB_URI ending in /aynaa_test",
      "  2. Run: npm test",
      "  3. Never run jest while loading the production .env file",
    ].join("\n"),
  );
};

module.exports = { assertTestDatabase };
