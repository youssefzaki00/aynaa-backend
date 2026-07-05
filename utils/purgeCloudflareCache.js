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
 * Purge Cloudflare edge cache for list resources.
 * Uses files + prefixes + tags (one API call each) for maximum reliability.
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

  const prefixes = [...new Set(entries.map((entry) => entry.prefix))];
  const tags = [...new Set(entries.map((entry) => entry.tag))];

  const strategies = [
    { label: "files", body: { files } },
    { label: "prefixes", body: { prefixes } },
    { label: "tags", body: { tags } },
  ];

  const results = await Promise.allSettled(
    strategies.map(async ({ label, body }) => {
      await purgeByType(config, body);
      return label;
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");
  const succeeded = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  if (succeeded.length) {
    console.log(
      `[Cloudflare] Purged via [${succeeded.join(", ")}] for: ${entries.map((e) => e.path).join(", ")}`,
    );
  }

  if (failed.length) {
    failed.forEach((r) => {
      console.error(`[Cloudflare] Purge strategy failed:`, r.reason?.message);
    });
  }
};

module.exports = { purgeCloudflareCache };
