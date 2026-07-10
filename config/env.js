/**
 * Central environment config — single source of truth for variable names.
 * Always use SCREAMING_SNAKE_CASE in .env / Coolify.
 * Legacy aliases are read here once for backward compatibility.
 */

const warnDeprecated = (canonical, legacy) => {
  console.warn(`[env] Deprecated: use ${canonical} instead of ${legacy}`);
};

const read = (canonical, legacyKeys = []) => {
  if (process.env[canonical]) {
    return process.env[canonical];
  }

  for (const legacy of legacyKeys) {
    if (process.env[legacy]) {
      warnDeprecated(canonical, legacy);
      return process.env[legacy];
    }
  }

  return undefined;
};

const bool = (value, defaultValue) => {
  if (value === undefined || value === "") {
    return defaultValue;
  }
  return value !== "false" && value !== "0";
};

const num = (value, defaultValue) => {
  if (value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const CLOUDFLARE_CDN_HOST =
  read("CLOUDFLARE_CDN_HOST", ["CLOUDFLARE_API_HOST"]) || "api.aynaa.org";

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: num(process.env.PORT, 5000),
  ENABLE_CLUSTER: bool(process.env.ENABLE_CLUSTER, true),

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,
  MONGO_MAX_POOL_SIZE: num(process.env.MONGO_MAX_POOL_SIZE, 200),
  MONGO_MIN_POOL_SIZE: num(process.env.MONGO_MIN_POOL_SIZE, 10),
  ALLOW_PRODUCTION_DB_TESTS:
    process.env.ALLOW_PRODUCTION_DB_TESTS === "true",

  // Redis
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TLS_REJECT_UNAUTHORIZED: bool(
    process.env.REDIS_TLS_REJECT_UNAUTHORIZED,
    true,
  ),

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",

  // Cache
  CACHE_TTL_SECONDS: num(process.env.CACHE_TTL_SECONDS, 300),
  CDN_CACHE_MAX_AGE: num(process.env.CDN_CACHE_MAX_AGE, 31536000),

  // Cloudflare CDN purge
  CLOUDFLARE_ZONE_ID: read("CLOUDFLARE_ZONE_ID", [
    "cloudflare_zone_id",
    "CF_ZONE_ID",
  ]),
  CLOUDFLARE_API_TOKEN: read("CLOUDFLARE_API_TOKEN", [
    "cloudflare_api_key",
    "CLOUDFLARE_API_KEY",
    "CF_API_TOKEN",
  ]),
  CLOUDFLARE_CDN_HOST,
  CLOUDFLARE_CDN_ORIGIN:
    read("CLOUDFLARE_CDN_ORIGIN", ["CLOUDFLARE_API_ORIGIN"]) ||
    `https://${CLOUDFLARE_CDN_HOST}`,
};

module.exports = env;
