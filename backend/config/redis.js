import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

try {
  await client.connect();
  console.log("Redis connected successfully");
} catch (err) {
  console.error("Redis Connection Error:", err);
  console.error("Make sure Redis is running! (Try 'redis-server' or 'brew services start redis')");
  // We might want to exit or let the app continue without Redis (if possible)
  // But for this app, Redis seems critical for socket.io adapter/store.
  // We'll log it clearly.
  process.exit(1);
}

export default client;
