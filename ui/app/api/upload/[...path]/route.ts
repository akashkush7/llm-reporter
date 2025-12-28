import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ✅ Next.js 15 type for dynamic route params
type RouteContext = {
  params: Promise<{ path: string[] }>; // 👈 Now a Promise!
};

// GET handler - serve uploaded files
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { path: pathSegments } = await context.params; // 👈 Await params
    const filePath = pathSegments.join("/");

    const fullPath = path.join(
      process.env.UPLOAD_DIR || "/shared/report-framework/uploads",
      filePath
    );

    // Read and return file
    const fs = await import("fs/promises");
    const fileBuffer = await fs.readFile(fullPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error: any) {
    console.error("Error serving file:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

// POST handler - upload files
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { path: pathSegments } = await context.params; // 👈 Await params

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadDir =
      process.env.UPLOAD_DIR || "/shared/report-framework/uploads";
    const fileName = pathSegments.join("/") || file.name;
    const filePath = path.join(uploadDir, fileName);

    // Create directory if it doesn't exist
    await mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: filePath,
      url: `/api/upload/${fileName}`,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
