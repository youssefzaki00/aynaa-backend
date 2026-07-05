const getCloudflareConfig = () => {
  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID || process.env.cloudflare_zone_id;
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN || process.env.cloudflare_api_key;
  const email = process.env.CLOUDFLARE_EMAIL;
  const apiOrigin =
    process.env.CLOUDFLARE_API_ORIGIN || "https://api.aynaa.org";

  if (!zoneId || !apiToken) {
    return null;
  }

  return { zoneId, apiToken, email, apiOrigin };
};

/**
 * Purge specific URLs from Cloudflare edge cache.
 * Fire-and-forget safe: logs errors, never throws.
 */
const purgeCloudflareCache = async (paths) => {
  const config = getCloudflareConfig();
  if (!config || !paths?.length) {
    return;
  }

  const files = paths.map((path) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${config.apiOrigin}${normalized}`;
  });

  const headers = {
    Authorization: `Bearer ${config.apiToken}`,
    "Content-Type": "application/json",
  };

  if (config.email) {
    headers["X-Auth-Email"] = config.email;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ files }),
      },
    );

    const data = await response.json();

    if (data.success) {
      console.log(
        `[Cloudflare] Cache purged for: ${paths.join(", ")}`,
      );
    } else {
      console.error("[Cloudflare] Purge failed:", data.errors || data);
    }
  } catch (error) {
    console.error("[Cloudflare] Purge error:", error.message);
  }
};

module.exports = { purgeCloudflareCache };
