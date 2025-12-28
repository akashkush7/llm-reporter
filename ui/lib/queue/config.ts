import { ConnectionOptions } from "bullmq";

// Redis connection configuration
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Important for BullMQ
  enableReadyCheck: false,
};

// Queue names
export const QUEUE_NAMES = {
  REPORT_GENERATION: "report-generation",
} as const;

// Job configuration
export const JOB_CONFIG = {
  // Maximum time a job can run (10 minutes)
  timeout: 10 * 60 * 1000,

  // Number of retry attempts
  maxAttempts: 3,

  // Exponential backoff for retries
  backoff: {
    type: "exponential" as const,
    delay: 5000, // Start with 5 seconds
  },

  // Job retention
  removeOnComplete: {
    age: 24 * 60 * 60, // Keep completed jobs for 24 hours (in seconds)
    count: 100, // Keep last 100 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days (in seconds)
  },
};

// Worker configuration
export const WORKER_CONFIG = {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2"),

  // Rate limiting (to respect LLM API limits)
  limiter: {
    max: 5, // Max 5 jobs
    duration: 60 * 1000, // Per minute
  },
};
