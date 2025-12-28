import { chromium, Browser, Page } from "playwright";
import { HtmlRenderer } from "./html-renderer.js";
import { AdvancedMdxRenderer } from "./mdx-renderer.js";

/**
 * PDF rendering options
 */
export interface PdfRenderOptions {
  pageSize?: "A4" | "Letter" | "Legal";
  title?: string;
  subtitle?: string;
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * PDF Renderer Class
 * Converts MDX/Markdown to PDF using Playwright
 */
export class PdfRenderer {
  private htmlRenderer: HtmlRenderer;
  private mdxRenderer: AdvancedMdxRenderer;
  private browser?: Browser;

  constructor() {
    this.htmlRenderer = new HtmlRenderer();
    this.mdxRenderer = new AdvancedMdxRenderer();
  }

  /**
   * Render MDX content to PDF
   * Pipeline: MDX → React → HTML → PDF
   */
  async renderMdxToPdf(
    mdxContent: string,
    data: Record<string, any>,
    options: PdfRenderOptions = {}
  ): Promise<Buffer> {
    // Step 1: MDX → React
    const { component } = await this.mdxRenderer.renderToReact(
      mdxContent,
      data
    );

    // Step 2: React → HTML with beautiful styles
    const html = await this.htmlRenderer.renderReact(component, {
      includeStyles: true,
      forPdf: true,
      pageSize: options.pageSize || "A4",
      title: options.title || data.metadata?.reportTitle || "Report",
      subtitle:
        options.subtitle ||
        (data.metadata?.generatedAt
          ? `Generated on ${new Date(
              data.metadata.generatedAt
            ).toLocaleDateString()}`
          : undefined),
    });

    // Step 3: HTML → PDF using Playwright
    return this.htmlToPdf(html, options);
  }

  /**
   * Render Markdown (not MDX) to PDF
   * Useful for simple reports without interactive components
   */
  async renderMarkdownToPdf(
    markdown: string,
    options: PdfRenderOptions = {}
  ): Promise<Buffer> {
    const html = await this.htmlRenderer.renderMarkdown(markdown, {
      includeStyles: true,
      forPdf: true,
      pageSize: options.pageSize || "A4",
      title: options.title || "Report",
      subtitle: options.subtitle,
    });

    return this.htmlToPdf(html, options);
  }

  /**
   * Convert HTML string to PDF using Playwright
   */
  private async htmlToPdf(
    html: string,
    options: PdfRenderOptions = {}
  ): Promise<Buffer> {
    const browser = await chromium.launch({
      headless: true,
      // Uncomment for Docker/CI environments:
      // args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewportSize({
        width: 1200,
        height: 1600,
      });

      // Load HTML content
      await page.setContent(html, {
        waitUntil: "networkidle", // Wait for all network requests
      });

      // Wait for page to be fully loaded
      await page.waitForLoadState("load");

      // Optional: Wait for specific elements (charts, images, etc.)
      try {
        await page.waitForSelector(".report-container", { timeout: 5000 });
      } catch (e) {
        // Continue if selector not found
        console.warn(
          "Report container not found, continuing with PDF generation"
        );
      }

      // Generate PDF
      const pdf = await page.pdf({
        format: options.pageSize || "A4",
        landscape: options.landscape || false,
        printBackground: true, // CRITICAL: Keep gradients and background colors
        margin: {
          top: options.margin?.top || "20mm",
          right: options.margin?.right || "15mm",
          bottom: options.margin?.bottom || "20mm",
          left: options.margin?.left || "15mm",
        },
        preferCSSPageSize: false, // Use format option instead of CSS @page
      });

      return pdf;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate screenshot of report (useful for previews)
   */
  async renderToScreenshot(
    mdxContent: string,
    data: Record<string, any>,
    format: "png" | "jpeg" = "png"
  ): Promise<Buffer> {
    const { component } = await this.mdxRenderer.renderToReact(
      mdxContent,
      data
    );
    const html = await this.htmlRenderer.renderReact(component, {
      includeStyles: true,
      title: data.metadata?.reportTitle || "Report",
    });

    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();

      await page.setViewportSize({ width: 1200, height: 1600 });
      await page.setContent(html, { waitUntil: "networkidle" });

      const screenshot = await page.screenshot({
        fullPage: true,
        type: format,
      });

      return screenshot;
    } finally {
      await browser.close();
    }
  }

  /**
   * Get browser instance (reuse for multiple renders)
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  /**
   * Render multiple PDFs efficiently (reuses browser)
   */
  async renderMultiplePdfs(
    reports: Array<{
      mdxContent: string;
      data: Record<string, any>;
      options?: PdfRenderOptions;
    }>
  ): Promise<Buffer[]> {
    const browser = await this.getBrowser();
    const pdfs: Buffer[] = [];

    try {
      for (const report of reports) {
        const { component } = await this.mdxRenderer.renderToReact(
          report.mdxContent,
          report.data
        );

        const html = await this.htmlRenderer.renderReact(component, {
          includeStyles: true,
          forPdf: true,
          pageSize: report.options?.pageSize || "A4",
          title:
            report.options?.title ||
            report.data.metadata?.reportTitle ||
            "Report",
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle" });

        const pdf = await page.pdf({
          format: report.options?.pageSize || "A4",
          printBackground: true,
          margin: {
            top: report.options?.margin?.top || "20mm",
            right: report.options?.margin?.right || "15mm",
            bottom: report.options?.margin?.bottom || "20mm",
            left: report.options?.margin?.left || "15mm",
          },
        });

        pdfs.push(pdf);
        await page.close();
      }
    } finally {
      // Keep browser alive for potential reuse
    }

    return pdfs;
  }

  /**
   * Clean up browser instance
   */
  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
