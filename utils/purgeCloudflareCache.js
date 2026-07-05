const getCloudflareConfig = () => {
  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID || process.env.cloudflare_zone_id;
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN || process.env.cloudflare_api_key;
  const apiOrigin =
    process.env.CLOUDFLARE_API_ORIGIN || "https://api.aynaa.org";

  if (!zoneId || !apiToken) {
    return null;
  }

  return { zoneId, apiToken, apiOrigin };
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
 * Purge Cloudflare edge cache for list resources (single tag-based call).
 * @param {Array<{ path: string, prefix: string, tag: string }>} entries
 */
const purgeCloudflareCache = async (entries) => {
  const config = getCloudflareConfig();

  if (!config) {
    console.warn(
      "[Cloudflare] Purge skipped — set cloudflare_zone_id and cloudflare_api_key in env",
    );
    return;
  }

  if (!entries?.length) {
    return;
  }

  const tags = [...new Set(entries.map((entry) => entry.tag))];

  try {
    await purgeByType(config, { tags });
    console.log(
      `[Cloudflare] Purged tags [${tags.join(", ")}] for: ${entries.map((e) => e.path).join(", ")}`,
    );
  } catch (err) {
    console.error(`[Cloudflare] Tag purge failed:`, err.message);

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

    try {
      await purgeByType(config, { files });
      console.log(`[Cloudflare] Fallback file purge succeeded for: ${files.join(", ")}`);
    } catch (fallbackErr) {
      console.error(`[Cloudflare] File purge fallback failed:`, fallbackErr.message);
    }
  }
};

module.exports = { purgeCloudflareCache };
