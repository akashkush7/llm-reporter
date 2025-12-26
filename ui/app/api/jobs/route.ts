import { NextResponse } from "next/server";
import { addReportJob, getAllJobs, getQueueStats } from "@/lib/queue/queue";

export const runtime = "nodejs";

// GET /api/jobs - List all jobs with optional status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const jobs = await getAllJobs(status);

    return NextResponse.json({
      jobs,
      total: jobs.length,
    });
  } catch (error: any) {
    console.error("Error listing jobs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🔍 DEBUG: Log the incoming request body
    console.log("📥 API Route received body:", JSON.stringify(body, null, 2));

    const {
      pipelineId,
      reportType,
      outputFormat,
      inputs,
      profileName,
      reportName, // 👈 EXTRACT THIS
      priority,
    } = body;

    // 🔍 DEBUG: Log extracted reportName
    console.log("📝 Extracted reportName:", reportName);

    // Validate required fields
    if (!pipelineId || !reportType || !outputFormat) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: pipelineId, reportType, outputFormat",
        },
        { status: 400 }
      );
    }

    // Add job to queue
    const jobData = {
      pipelineId,
      reportType,
      outputFormat,
      inputs: inputs || {},
      profileName,
      reportName, // 👈 PASS THIS
      metadata: {
        requestedAt: new Date().toISOString(),
      },
    };

    // 🔍 DEBUG: Log job data being queued
    console.log("📤 Queueing job with data:", JSON.stringify(jobData, null, 2));

    const job = await addReportJob(jobData, {
      priority: priority || 5,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Job submitted successfully",
    });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
