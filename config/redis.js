const { createClient } = require("redis");

let client = null;
let ready = false;

const buildClientOptions = () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  const options = { url };

  if (url.startsWith("rediss://")) {
    const rejectUnauthorized =
      process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== "false";

    options.socket = {
      tls: true,
      rejectUnauthorized,
    };
  }

  options.socket = {
    ...options.socket,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error("Redis reconnect limit reached");
      }
      return Math.min(retries * 100, 3000);
    },
  };

  return options;
};

const attachClientListeners = (redisClient) => {
  redisClient.on("ready", () => {
    ready = true;
    console.log(`✅ [Worker ${process.pid}] Redis connected`);
  });

  redisClient.on("error", (err) => {
    ready = false;
    console.error(`⚠️ [Worker ${process.pid}] Redis error:`, err.message);
  });

  redisClient.on("end", () => {
    ready = false;
    console.warn(`⚠️ [Worker ${process.pid}] Redis connection closed`);
  });
};

const connectRedis = async () => {
  if (client) {
    return client;
  }

  const options = buildClientOptions();
  if (!options) {
    console.warn(
      `⚠️ [Worker ${process.pid}] REDIS_URL not set — cache disabled (fail-open)`,
    );
    return null;
  }

  try {
    client = createClient(options);
    attachClientListeners(client);
    await client.connect();
    return client;
  } catch (err) {
    ready = false;
    console.error(
      `⚠️ [Worker ${process.pid}] Redis connection failed — cache disabled (fail-open):`,
      err.message,
    );
    client = null;
    return null;
  }
};

const getRedisClient = () => client;

const isRedisReady = () => ready && client?.isOpen;

const disconnectRedis = async () => {
  if (!client) {
    return;
  }

  try {
    if (client.isOpen) {
      await client.quit();
    }
  } catch (err) {
    console.error(
      `⚠️ [Worker ${process.pid}] Redis disconnect error:`,
      err.message,
    );
  } finally {
    client = null;
    ready = false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisReady,
  disconnectRedis,
};
