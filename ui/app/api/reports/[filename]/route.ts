import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { configManager } from "@/lib/config-manager";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { filename: encodedFilename } = await context.params;
    const filename = decodeURIComponent(encodedFilename);

    // Get reports directory from config (same as CLI)
    const reportsDir = await configManager.getOutputDir();
    const filePath = path.join(reportsDir, filename);

    // Security: prevent directory traversal
    const normalizedReportsDir = path.resolve(reportsDir);
    const normalizedFilePath = path.resolve(filePath);

    if (!normalizedFilePath.startsWith(normalizedReportsDir)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const content = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    let contentType = "text/plain";
    if (ext === ".md") contentType = "text/markdown";
    if (ext === ".html") contentType = "text/html";
    if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error serving report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
