const { createClient } = require("redis");

let client = null;

const connectRedis = async () => {
  try {
    const url = process.env.REDIS_URL;

    if (!url) {
      throw new Error("❌ REDIS_URL is missing in environment variables!");
    }

    client = createClient({ url });

    client.on("error", (err) => {
      console.error(`❌ Redis error [Worker ${process.pid}]:`, err.message);
    });

    await client.connect();

    console.log(`✅ Redis Connected [Worker ${process.pid}]`);
    return client;
  } catch (error) {
    console.error(`❌ Error connecting to Redis: ${error.message}`);
    process.exit(1);
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};

module.exports = { connectRedis, getRedisClient, disconnectRedis };
