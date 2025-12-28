import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { configManager } from "@/lib/config-manager";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Get reports directory from config (same as CLI)
    const reportsDir = await configManager.getOutputDir();

    try {
      await fs.access(reportsDir);
    } catch {
      // Directory doesn't exist
      return NextResponse.json([]);
    }

    const files = await fs.readdir(reportsDir);

    const reports = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(reportsDir, filename);
        const stats = await fs.stat(filePath);
        const ext = path.extname(filename).toLowerCase();

        return {
          id: filename,
          name: filename,
          format:
            ext === ".md"
              ? "md"
              : ext === ".html"
              ? "html"
              : ext === ".pdf"
              ? "pdf"
              : "unknown",
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          path: `/api/reports/${filename}`,
        };
      })
    );

    // Sort by creation date (newest first)
    reports.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Error listing reports:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
