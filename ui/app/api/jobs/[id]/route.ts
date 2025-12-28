import { NextResponse } from "next/server";
import { getJobStatus, removeJob } from "@/lib/queue/queue";

export const runtime = "nodejs";

// GET /api/jobs/[id] - Get job details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJobStatus(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error(`Error getting job ${(await params).id}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to get job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Cancel/remove job
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await removeJob(id);

    return NextResponse.json({
      success: true,
      message: "Job removed successfully",
    });
  } catch (error: any) {
    console.error(`Error removing job ${(await params).id}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to remove job" },
      { status: 500 }
    );
  }
}
