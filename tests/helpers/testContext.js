const { randomUUID } = require("crypto");

const runId = `t${Date.now().toString(36)}${randomUUID().slice(0, 6)}`;

const buckets = {
  users: [],
  categories: [],
  sites: [],
  apps: [],
  keywords: [],
  excludedApps: [],
  requests: [],
  whitelist: [],
  suggestions: [],
  devices: [],
};

const track = (bucket, id) => {
  if (id) buckets[bucket].push(id);
};

const testUrl = (slug) => `https://${runId}-${slug}.invalid`;

const testPackage = (slug) =>
  `com.aynaa.${runId.replace(/-/g, "")}.${slug}`.slice(0, 100);

const testCategoryName = (slug) =>
  `${runId}_${slug}`.toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 48);

const testWord = (slug) => `${runId}-${slug}`.toLowerCase().slice(0, 80);

module.exports = {
  runId,
  buckets,
  track,
  testUrl,
  testPackage,
  testCategoryName,
  testWord,
};
