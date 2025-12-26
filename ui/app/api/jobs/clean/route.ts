import { NextResponse } from "next/server";
import {
  cleanOldJobs,
  cleanCompletedJobs,
  cleanFailedJobs,
  getDetailedJobCounts,
  obliterateAllJobs,
} from "@/lib/queue/queue";

// POST - Clean old jobs
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action = "clean",
      type = "completed",
      grace,
      limit = 1000,
      hoursOld,
      daysOld,
      force = false,
    } = body;

    let result;

    switch (action) {
      case "clean":
        // Clean specific type with custom grace period
        const graceMs =
          grace ||
          (type === "completed"
            ? 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000);
        const deletedIds = await cleanOldJobs(graceMs, limit, type);
        result = {
          action: "clean",
          type,
          deletedCount: deletedIds.length,
          grace: `${graceMs / 1000 / 60 / 60} hours`,
        };
        break;

      case "clean-completed":
        const completedCount = await cleanCompletedJobs(hoursOld || 24);
        result = {
          action: "clean-completed",
          deletedCount: completedCount,
          hoursOld: hoursOld || 24,
        };
        break;

      case "clean-failed":
        const failedCount = await cleanFailedJobs(daysOld || 7);
        result = {
          action: "clean-failed",
          deletedCount: failedCount,
          daysOld: daysOld || 7,
        };
        break;

      case "obliterate":
        if (!force) {
          return NextResponse.json(
            { error: "Must set force=true to obliterate all jobs" },
            { status: 400 }
          );
        }
        await obliterateAllJobs(true);
        result = {
          action: "obliterate",
          message: "All jobs deleted",
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get job counts and recommendations
export async function GET() {
  try {
    const counts = await getDetailedJobCounts();

    const recommendations: Record<string, string> = {};

    if (counts.completed > 100) {
      recommendations.completed = `Should clean (${counts.completed} jobs)`;
    }

    if (counts.failed > 50) {
      recommendations.failed = `Should clean (${counts.failed} jobs)`;
    }

    return NextResponse.json({
      counts,
      recommendations,
      actions: {
        cleanCompleted: "POST with { action: 'clean-completed', hoursOld: 24 }",
        cleanFailed: "POST with { action: 'clean-failed', daysOld: 7 }",
        obliterate: "POST with { action: 'obliterate', force: true }",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
