const { createClient } = require("redis");

let client = null;
let connectPromise = null;

const ensureRedisClient = async () => {
  if (client?.isOpen) {
    return client;
  }

  if (!connectPromise) {
    connectPromise = (async () => {
      const url = process.env.REDIS_URL;

      if (!url) {
        throw new Error("❌ REDIS_URL is missing in environment variables!");
      }

      if (!client) {
        client = createClient({ url });

        client.on("error", (err) => {
          console.error(`❌ Redis error [Worker ${process.pid}]:`, err.message);
        });
      }

      if (!client.isOpen) {
        await client.connect();
        console.log(`✅ Redis Connected [Worker ${process.pid}]`);
      }

      return client;
    })().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  return connectPromise;
};

const connectRedis = async () => {
  try {
    return await ensureRedisClient();
  } catch (error) {
    console.error(`❌ Error connecting to Redis: ${error.message}`);
    process.exit(1);
  }
};

// Used by rate-limit-redis at module load time (before connectRedis() in startWorker).
// Lazily creates and connects the client on the first command.
const sendRedisCommand = (...args) =>
  ensureRedisClient().then((redis) => redis.sendCommand(args));

const getRedisClient = () => {
  if (!client || !client.isOpen) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
  connectPromise = null;
};

module.exports = { connectRedis, getRedisClient, sendRedisCommand, disconnectRedis };
