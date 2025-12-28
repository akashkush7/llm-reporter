import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/queue/queue";

export const runtime = "nodejs";

// GET /api/jobs/stats - Get queue statistics
export async function GET() {
  try {
    const stats = await getQueueStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error getting queue stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get queue stats" },
      { status: 500 }
    );
  }
}
