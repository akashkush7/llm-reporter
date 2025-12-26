import { Queue, QueueEvents } from "bullmq";
import { redisConnection, QUEUE_NAMES, JOB_CONFIG } from "./config";
import type { ReportJobData, ReportJobResult } from "./types";

// Create the report generation queue
export const reportQueue = new Queue<ReportJobData, ReportJobResult>(
  QUEUE_NAMES.REPORT_GENERATION,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: JOB_CONFIG.maxAttempts,
      backoff: JOB_CONFIG.backoff,
      removeOnComplete: JOB_CONFIG.removeOnComplete,
      removeOnFail: JOB_CONFIG.removeOnFail,
    },
  }
);

// Queue events for monitoring
export const queueEvents = new QueueEvents(QUEUE_NAMES.REPORT_GENERATION, {
  connection: redisConnection,
});

// Helper function to add a job to the queue
export async function addReportJob(
  data: ReportJobData,
  options?: {
    priority?: number;
    jobId?: string;
  }
) {
  const job = await reportQueue.add("generate-report", data, {
    priority: options?.priority || 5, // Default to normal priority
    jobId: options?.jobId,
  });

  return {
    id: job.id!,
    name: job.name,
  };
}

// Helper function to get job status
export async function getJobStatus(jobId: string) {
  const job = await reportQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress as any;

  return {
    id: job.id!,
    name: job.name,
    data: job.data,
    progress:
      typeof progress === "number" ? { percentage: progress } : progress,
    status: state,
    result: job.returnvalue,
    failedReason: job.failedReason,
    createdAt: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    attemptsMade: job.attemptsMade,
  };
}

// Helper function to get all jobs
export async function getAllJobs(status?: string) {
  const jobs: any[] = [];

  if (!status || status === "waiting") {
    const waitingJobs = await reportQueue.getWaiting();
    jobs.push(...waitingJobs);
  }

  if (!status || status === "active") {
    const activeJobs = await reportQueue.getActive();
    jobs.push(...activeJobs);
  }

  if (!status || status === "completed") {
    const completedJobs = await reportQueue.getCompleted();
    jobs.push(...completedJobs);
  }

  if (!status || status === "failed") {
    const failedJobs = await reportQueue.getFailed();
    jobs.push(...failedJobs);
  }

  // Map jobs to our format
  const jobInfos = await Promise.all(
    jobs.map(async (job) => {
      const state = await job.getState();
      const progress = job.progress as any;

      return {
        id: job.id!,
        name: job.name,
        data: job.data,
        progress:
          typeof progress === "number" ? { percentage: progress } : progress,
        status: state,
        result: job.returnvalue,
        failedReason: job.failedReason,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        attemptsMade: job.attemptsMade,
      };
    })
  );

  // Sort by creation time (newest first)
  return jobInfos.sort((a, b) => b.createdAt - a.createdAt);
}

// Helper function to cancel/remove a job
export async function removeJob(jobId: string) {
  const job = await reportQueue.getJob(jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  await job.remove();
  return true;
}

// Helper function to get queue stats
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    reportQueue.getWaitingCount(),
    reportQueue.getActiveCount(),
    reportQueue.getCompletedCount(),
    reportQueue.getFailedCount(),
    reportQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// ============================================================================
// 🧹 CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean old jobs from the queue
 * @param grace - Grace period in milliseconds (jobs older than this will be deleted)
 * @param limit - Maximum number of jobs to clean in one operation
 * @param type - Type of jobs to clean: "completed" | "failed" | "active" | "delayed" | "waiting"
 * @returns Array of deleted job IDs
 */
export async function cleanOldJobs(
  grace: number = 24 * 60 * 60 * 1000, // Default: 24 hours
  limit: number = 1000,
  type: "completed" | "failed" | "active" | "delayed" | "waiting" = "completed"
) {
  const deletedJobIds = await reportQueue.clean(grace, limit, type);
  return deletedJobIds;
}

/**
 * Clean all completed jobs older than specified hours
 * @param hoursOld - Number of hours (default: 24)
 * @returns Number of jobs deleted
 */
export async function cleanCompletedJobs(hoursOld: number = 24) {
  const grace = hoursOld * 60 * 60 * 1000;
  const deletedJobIds = await reportQueue.clean(grace, 1000, "completed");
  return deletedJobIds.length;
}

/**
 * Clean all failed jobs older than specified days
 * @param daysOld - Number of days (default: 7)
 * @returns Number of jobs deleted
 */
export async function cleanFailedJobs(daysOld: number = 7) {
  const grace = daysOld * 24 * 60 * 60 * 1000;
  const deletedJobIds = await reportQueue.clean(grace, 500, "failed");
  return deletedJobIds.length;
}

/**
 * Get detailed job counts by status
 */
export async function getDetailedJobCounts() {
  const counts = await reportQueue.getJobCounts(
    "completed",
    "failed",
    "active",
    "delayed",
    "waiting",
    "paused"
  );

  return counts;
}

/**
 * Nuclear option - delete ALL jobs (use with caution!)
 * @param force - Must be true to actually delete
 */
export async function obliterateAllJobs(force: boolean = false) {
  if (!force) {
    throw new Error("Must set force=true to obliterate all jobs");
  }

  await reportQueue.obliterate({ force: true });
  return true;
}

/**
 * Drain queue - remove all waiting jobs
 */
export async function drainQueue() {
  await reportQueue.drain();
  return true;
}

/**
 * Pause queue - stop processing new jobs
 */
export async function pauseQueue() {
  await reportQueue.pause();
  return true;
}

/**
 * Resume queue - start processing jobs again
 */
export async function resumeQueue() {
  await reportQueue.resume();
  return true;
}

// Graceful shutdown
export async function closeQueue() {
  await reportQueue.close();
  await queueEvents.close();
}
