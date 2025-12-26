import { Worker, Job } from "bullmq";
import {
  redisConnection,
  QUEUE_NAMES,
  WORKER_CONFIG,
} from "../lib/queue/config";
import type { ReportJobData, ReportJobResult } from "../lib/queue/types";
import { generateReport } from "../lib/report-generator";
import { getPlugin, reloadPlugins } from "../lib/plugin-manager"; // 🔥 Import reloadPlugins
import path from "path";
import fs from "fs/promises";
import { ShutdownManager } from "@aganitha/report-framework";

// Worker process for report generation
export const reportWorker = new Worker<ReportJobData, ReportJobResult>(
  QUEUE_NAMES.REPORT_GENERATION,
  async (job: Job<ReportJobData, ReportJobResult>) => {
    const startTime = Date.now();

    console.log(`\n🚀 Starting job ${job.id}`);
    console.log(`   Pipeline: ${job.data.pipelineId}`);
    console.log(`   Report Type: ${job.data.reportType}`);
    console.log(`   Format: ${job.data.outputFormat}`);

    try {
      // 🔥 RELOAD PLUGINS BEFORE EACH JOB
      await reloadPlugins();

      // Update progress: 10% - Loading plugin
      await job.updateProgress({
        percentage: 10,
        step: "loading-plugin",
        message: "Loading pipeline plugin...",
      });

      // Get the plugin (now freshly loaded)
      const plugin = await getPlugin(job.data.pipelineId);

      if (!plugin) {
        throw new Error(`Plugin not found: ${job.data.pipelineId}`);
      }

      console.log(`   ✓ Plugin loaded: ${plugin.name}`);

      // Update progress: 25% - Validating inputs
      await job.updateProgress({
        percentage: 25,
        step: "validating",
        message: "Validating inputs...",
      });

      // Validate output format
      if (!plugin.outputFormats.includes(job.data.outputFormat)) {
        throw new Error(
          `Invalid output format '${job.data.outputFormat}' for plugin '${job.data.pipelineId}'`
        );
      }

      console.log(`   ✓ Inputs validated`);

      // Update progress: 40% - Starting generation
      await job.updateProgress({
        percentage: 40,
        step: "generating",
        message: "Generating report with LLM...",
      });

      // Generate the report
      const outputPath = await generateReport({
        plugin,
        inputs: job.data.inputs,
        reportType: job.data.reportType,
        outputFormat: job.data.outputFormat,
        profileName: job.data.profileName,
        reportName: job.data.reportName,
      });

      console.log(`   ✓ Report generated: ${outputPath}`);

      // Update progress: 90% - Finalizing
      await job.updateProgress({
        percentage: 90,
        step: "finalizing",
        message: "Finalizing report...",
      });

      // Get file stats
      const stats = await fs.stat(outputPath);
      const fileName = path.basename(outputPath);

      const duration = Date.now() - startTime;

      console.log(`   ✓ Job completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(
        `   File: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)\n`
      );

      // Update progress: 100% - Complete
      await job.updateProgress({
        percentage: 100,
        step: "completed",
        message: "Report generation completed!",
      });

      // Return result
      return {
        outputPath,
        fileName,
        fileSize: stats.size,
        duration,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      // 🔥 CHECK: If shutdown error
      if (error.message.includes("shutting down")) {
        console.log(`   ⚠️  Job ${job.id} cancelled - shutting down`);
        throw new Error("Job cancelled due to shutdown");
      }

      console.error(`   ❌ Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: WORKER_CONFIG.concurrency,
    limiter: WORKER_CONFIG.limiter,
  }
);

// Event listeners for monitoring
reportWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

reportWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

reportWorker.on("active", (job) => {
  console.log(`⚡ Job ${job.id} is now active`);
});

reportWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

// 🔥 IMPROVED: Graceful shutdown
const shutdown = async (signal: string) => {
  if (ShutdownManager.isShuttingDown()) {
    console.log("\n⚠️  Force killing (pressed twice)...");
    process.exit(1);
  }

  // 🔥 SET: Shutdown flag
  ShutdownManager.setShutdown(true);
  console.log(`\n🛑 ${signal} received, closing worker...`);
  console.log("   ✓ Shutdown flag set");

  // Give it 5 seconds to finish current job
  const timeout = setTimeout(() => {
    console.log("   ⚠️  Timeout - force killing");
    process.exit(1);
  }, 5000);

  try {
    await reportWorker.close();
    clearTimeout(timeout);
    console.log("   ✓ Worker closed gracefully");
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    console.error("   ❌ Error closing worker:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("👷 Report Worker started and waiting for jobs...");
console.log(`   Concurrency: ${WORKER_CONFIG.concurrency}`);
console.log(`   Queue: ${QUEUE_NAMES.REPORT_GENERATION}\n`);
