import { NextResponse } from "next/server";
import { getPluginMetadata } from "@/lib/plugin-manager";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap params at the beginning
    const params = await context.params;
    const pipeline = await getPluginMetadata(params.id);
    return NextResponse.json(pipeline);
  } catch (error: any) {
    const params = await context.params;
    console.error(`Error getting pipeline ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || "Pipeline not found" },
      { status: 404 }
    );
  }
}
