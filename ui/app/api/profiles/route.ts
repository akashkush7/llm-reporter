import { NextResponse } from "next/server";
import { configManager } from "@/lib/config-manager";

export const runtime = "nodejs";

// GET /api/profiles - List all profiles
export async function GET() {
  try {
    const profiles = await configManager.listProfiles();
    const defaultProfileName = await configManager.getDefaultProfileName();

    // Mask API keys for security
    const maskedProfiles = profiles.map((profile) => ({
      ...profile,
      apiKey: profile.apiKey ? `${profile.apiKey.slice(0, 8)}...` : "",
    }));

    return NextResponse.json({
      profiles: maskedProfiles,
      defaultProfile: defaultProfileName,
    });
  } catch (error: any) {
    console.error("Error listing profiles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list profiles" },
      { status: 500 }
    );
  }
}

// POST /api/profiles - Create or update profile
export async function POST(request: Request) {
  try {
    const profile = await request.json();

    // Validate required fields
    if (
      !profile.name ||
      !profile.provider ||
      !profile.model ||
      !profile.apiKey
    ) {
      return NextResponse.json(
        { error: "Missing required fields: name, provider, model, apiKey" },
        { status: 400 }
      );
    }

    await configManager.addProfile(profile);

    return NextResponse.json({
      success: true,
      message: `Profile '${profile.name}' saved successfully`,
    });
  } catch (error: any) {
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create profile" },
      { status: 500 }
    );
  }
}
