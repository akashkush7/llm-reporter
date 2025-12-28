import PptxGenJS from "pptxgenjs";
import { Bundle } from "../bundles/types.js";

export interface PptxExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  company?: string;
}

export class PptxExporter {
  async exportToPptx(
    data: Bundle,
    outputPath: string,
    options: PptxExportOptions = {}
  ): Promise<string> {
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = options.author || "Report Framework";
    pptx.company = options.company || "";
    pptx.subject = options.subject || "Data Report";
    pptx.title = options.title || data.datasetName;

    // Slide 1: Title
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: "3b82f6" };
    titleSlide.addText(options.title || data.datasetName, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 44,
      bold: true,
      color: "FFFFFF",
      align: "center",
    });
    titleSlide.addText(
      `Generated: ${new Date(data.metadata.ingestedAt).toLocaleDateString()}`,
      {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.5,
        fontSize: 18,
        color: "FFFFFF",
        align: "center",
      }
    );

    // Slide 2: Key Metrics
    const metricsSlide = pptx.addSlide();
    metricsSlide.addText("Key Metrics", {
      x: 0.5,
      y: 0.5,
      fontSize: 32,
      bold: true,
      color: "3b82f6",
    });

    const statsEntries = Object.entries(data.stats).slice(0, 6);
    statsEntries.forEach(([key, value], index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = 0.5 + col * 3;
      const y = 1.5 + row * 1.5;

      metricsSlide.addShape(pptx.ShapeType.rect, {
        x,
        y,
        w: 2.8,
        h: 1.2,
        fill: { color: "f0f9ff" },
        line: { color: "3b82f6", width: 2 },
      });

      metricsSlide.addText(String(value), {
        x,
        y: y + 0.2,
        w: 2.8,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: "3b82f6",
        align: "center",
      });

      metricsSlide.addText(key.replace(/_/g, " ").toUpperCase(), {
        x,
        y: y + 0.7,
        w: 2.8,
        h: 0.4,
        fontSize: 12,
        color: "666666",
        align: "center",
      });
    });

    // Slide 3: Data Table
    if (data.samples.main.length > 0) {
      const tableSlide = pptx.addSlide();
      tableSlide.addText("Data Overview", {
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        bold: true,
        color: "3b82f6",
      });

      const sampleData = data.samples.main.slice(0, 10);
      const headers = Object.keys(sampleData[0] || {});

      // Fix: Properly type the table data
      const tableData: any[][] = [
        // Header row
        headers.map((h) => ({
          text: h,
          options: { bold: true, color: "FFFFFF", fill: "3b82f6" },
        })),
        // Data rows - convert each cell to proper format
        ...sampleData.map((row) =>
          headers.map((h) => ({
            text: String(row[h] || ""),
            options: {},
          }))
        ),
      ];

      tableSlide.addTable(tableData, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 4,
        fontSize: 10,
        border: { type: "solid", color: "cccccc" },
      });
    }

    // Write file
    await pptx.writeFile({ fileName: outputPath });
    return outputPath;
  }
}
