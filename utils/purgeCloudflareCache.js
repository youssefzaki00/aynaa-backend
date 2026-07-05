const {
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_CDN_HOST,
  CLOUDFLARE_CDN_ORIGIN,
} = require("../config/env");

const getCloudflareConfig = () => {
  if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN) {
    return null;
  }

  return {
    zoneId: CLOUDFLARE_ZONE_ID,
    apiToken: CLOUDFLARE_API_TOKEN,
    cdnHost: CLOUDFLARE_CDN_HOST,
    apiOrigin: CLOUDFLARE_CDN_ORIGIN,
  };
};

const purgeByType = async (config, body) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(
      JSON.stringify(data.errors || data.messages || "Unknown purge error"),
    );
  }

  return data;
};

/**
 * Purge Cloudflare edge cache for list resources.
 * Prefix purge is first — it clears all query-string variants of each list URL.
 * @param {Array<{ path: string, prefix: string, tag: string }>} entries
 */
const purgeCloudflareCache = async (entries) => {
  const config = getCloudflareConfig();

  if (!config) {
    console.warn(
      "[Cloudflare] Purge skipped — set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN on the server",
    );
    return false;
  }

  if (!entries?.length) {
    return false;
  }

  const prefixes = [
    ...new Set(
      entries.map((entry) => entry.prefix || `${config.cdnHost}${entry.path}`),
    ),
  ];

  const files = [
    ...new Set(
      entries.map((entry) => {
        const normalized = entry.path.startsWith("/")
          ? entry.path
          : `/${entry.path}`;
        return `${config.apiOrigin}${normalized}`;
      }),
    ),
  ];

  const tags = [...new Set(entries.map((entry) => entry.tag).filter(Boolean))];

  const strategies = [
    { label: "prefixes", body: { prefixes } },
    { label: "files", body: { files } },
  ];

  if (tags.length) {
    strategies.push({ label: "tags", body: { tags } });
  }

  for (const { label, body } of strategies) {
    try {
      await purgeByType(config, body);
      console.log(
        `[Cloudflare] Purged via ${label} for: ${entries.map((e) => e.path).join(", ")}`,
      );
      return true;
    } catch (err) {
      console.error(`[Cloudflare] Purge via ${label} failed:`, err.message);
    }
  }

  console.error(
    "[Cloudflare] All purge strategies failed — dashboard may see stale data until edge TTL expires",
  );
  return false;
};

module.exports = { purgeCloudflareCache, getCloudflareConfig };
