import { NextResponse } from "next/server";
import { getPipelines } from "@/lib/plugin-manager";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pipelines = await getPipelines();
    return NextResponse.json(pipelines);
  } catch (error: any) {
    console.error("Error listing pipelines:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list pipelines" },
      { status: 500 }
    );
  }
}
