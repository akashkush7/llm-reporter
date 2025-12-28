import { NextResponse } from "next/server";
import { configManager } from "@/lib/config-manager";

export const runtime = "nodejs";

// GET /api/profiles/[name]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const profile = await configManager.getProfile(name);

    if (!profile) {
      return NextResponse.json(
        { error: `Profile '${name}' not found` },
        { status: 404 }
      );
    }

    // Mask API key for security
    return NextResponse.json({
      ...profile,
      apiKey: profile.apiKey ? `${profile.apiKey.slice(0, 8)}...` : "",
    });
  } catch (error: any) {
    const { name } = await params;
    console.error(`Error getting profile ${name}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to get profile" },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/[name]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    await configManager.removeProfile(name);

    return NextResponse.json({
      success: true,
      message: `Profile '${name}' deleted successfully`,
    });
  } catch (error: any) {
    const { name } = await params;
    console.error(`Error deleting profile ${name}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete profile" },
      { status: 500 }
    );
  }
}
