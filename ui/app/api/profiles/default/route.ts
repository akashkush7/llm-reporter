import { NextResponse } from "next/server";
import { configManager } from "@/lib/config-manager";

export const runtime = "nodejs";

// GET /api/profiles/default - Get default profile
export async function GET() {
  try {
    const profile = await configManager.getDefaultProfile();

    if (!profile) {
      return NextResponse.json(
        { error: "No default profile configured" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...profile,
      apiKey: profile.apiKey ? `${profile.apiKey.slice(0, 8)}...` : "",
    });
  } catch (error: any) {
    console.error("Error getting default profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get default profile" },
      { status: 500 }
    );
  }
}

// POST /api/profiles/default - Set default profile
export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Profile name is required" },
        { status: 400 }
      );
    }

    await configManager.setDefaultProfile(name);

    return NextResponse.json({
      success: true,
      message: `Default profile set to '${name}'`,
    });
  } catch (error: any) {
    console.error("Error setting default profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set default profile" },
      { status: 500 }
    );
  }
}
