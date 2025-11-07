import { Redis } from "@upstash/redis"

// Create Redis client using the MAIL_ prefixed environment variables
export const redis = new Redis({
  url: process.env.MAIL_KV_REST_API_URL!,
  token: process.env.MAIL_KV_REST_API_TOKEN!,
})
