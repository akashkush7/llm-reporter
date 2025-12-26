import { NextResponse } from "next/server";
import { getPlugin } from "@/lib/plugin-manager";
import { generateReport } from "@/lib/report-generator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for long-running reports

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pipelineId, reportType, outputFormat, inputs, profileName } = body;

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

    // Get the actual plugin instance
    const plugin = await getPlugin(pipelineId);

    if (!plugin) {
      return NextResponse.json(
        { error: `Pipeline not found: ${pipelineId}` },
        { status: 404 }
      );
    }

    // Validate output format
    if (!plugin.outputFormats.includes(outputFormat)) {
      return NextResponse.json(
        {
          error: `Invalid output format '${outputFormat}' for pipeline '${pipelineId}'`,
        },
        { status: 400 }
      );
    }

    // Generate report using isolated generator
    const outputPath = await generateReport({
      plugin,
      inputs,
      reportType,
      outputFormat,
      profileName,
    });

    return NextResponse.json({
      success: true,
      outputPath,
      message: "Report generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate report",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
