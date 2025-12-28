import fs from "fs/promises";
import path from "path";
import nunjucks from "nunjucks";
import {
  PluginBase,
  SpecificationConfig,
  OutputFormat,
} from "../plugins/plugin-base.js";
import { AISdkLLMClient } from "../llm/ai-sdk-client.js";
import { HtmlRenderer } from "../renderers/html-renderer.js";
import { PdfRenderer } from "../renderers/pdf-renderer.js";
import ShutdownManager from "../utils/shutdown-manager.js"; // 🔥 ADD THIS

interface GenerationResults {
  [promptName: string]: string;
}

export class ReportEngine {
  private llmClient: AISdkLLMClient;

  constructor(llmClient: AISdkLLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * Core pipeline-driven report generation
   */
  async generateReport(params: {
    plugin: PluginBase;
    inputs: Record<string, any>;
    reportType: string;
    outputFormat: OutputFormat;
    outputDir?: string;
    reportName?: string;
  }): Promise<string> {
    const {
      plugin,
      inputs,
      reportType,
      outputFormat,
      outputDir = path.join(process.cwd(), "reports"),
      reportName,
    } = params;

    // 🔥 CHECK: Before starting
    ShutdownManager.checkShutdown();

    /* --------------------------------------------- */
    if (!plugin.outputFormats.includes(outputFormat)) {
      throw new Error(
        `Output format '${outputFormat}' not supported by plugin '${plugin.id}'`
      );
    }

    const specMap = plugin.getSpecifications();
    const spec: SpecificationConfig | undefined = specMap[reportType];

    if (!spec) {
      throw new Error(
        `No specification found for report type '${reportType}' in plugin '${plugin.id}'`
      );
    }

    console.log(`\n🚀 Running plugin: ${plugin.id}`);
    console.log(`📄 Report type: ${reportType}`);
    console.log(`📦 Output format: ${outputFormat}`);

    /* STEP 1: Run plugin data processor */
    console.log("\n📦 Processing input data...");
    const attributes = await plugin.process(inputs);
    console.log(`   ✓ Attributes generated`);

    // 🔥 CHECK: Before LLM prompts
    ShutdownManager.checkShutdown();

    /* STEP 2: Run LLM prompts (optional) */
    let llmResults: GenerationResults = {};
    if (spec.prompts?.length) {
      console.log("\n🤖 Running LLM prompts...");
      llmResults = await this.processPrompts(plugin, spec, attributes);
      console.log(`   ✓ ${Object.keys(llmResults).length} prompts completed`);
    }

    // 🔥 CHECK: Before rendering
    ShutdownManager.checkShutdown();

    /* STEP 3: Build render context */
    const renderContext = {
      ...attributes,
      ...llmResults,
      metadata: {
        pluginId: plugin.id,
        pluginName: plugin.name,
        reportType,
        reportTitle:
          attributes.metadata?.reportTitle || `${plugin.name} Report`,
        generatedAt: new Date().toISOString(),
        author: attributes.metadata?.author || "Report Framework",
        ...attributes.metadata,
      },
    };

    /* STEP 4: Render template */
    console.log("\n🎨 Rendering template...");
    const rendered = await this.renderTemplate(plugin, spec, renderContext);
    console.log("   ✓ Template rendered");

    /* STEP 5: Format output based on output format */
    console.log(`\n📄 Converting to ${outputFormat}...`);
    let finalOutput: string | Buffer;
    let extension: string;

    const isMdxTemplate = spec.template.type === "mdx";

    if (outputFormat === "html") {
      if (isMdxTemplate) {
        const { AdvancedMdxRenderer } = await import(
          "../renderers/mdx-renderer.js"
        );
        const mdxRenderer = new AdvancedMdxRenderer();
        const htmlRenderer = new HtmlRenderer();

        // MDX → React
        const { component } = await mdxRenderer.renderToReact(
          rendered,
          renderContext
        );

        // React → HTML
        finalOutput = await htmlRenderer.renderReact(component, {
          includeStyles: true,
          title: renderContext.metadata.reportTitle,
          subtitle: `Generated on ${new Date(
            renderContext.metadata.generatedAt
          ).toLocaleDateString()}`,
        });
      } else {
        const htmlRenderer = new HtmlRenderer();
        finalOutput = await htmlRenderer.renderMarkdown(rendered, {
          includeStyles: true,
          title: renderContext.metadata.reportTitle,
          subtitle: `Generated on ${new Date(
            renderContext.metadata.generatedAt
          ).toLocaleDateString()}`,
        });
      }
      extension = "html";
    } else if (outputFormat === "pdf") {
      const pdfRenderer = new PdfRenderer();

      if (isMdxTemplate) {
        finalOutput = await pdfRenderer.renderMdxToPdf(
          rendered,
          renderContext,
          {
            title: renderContext.metadata.reportTitle,
            pageSize: "A4",
            margin: {
              top: "20mm",
              right: "15mm",
              bottom: "20mm",
              left: "15mm",
            },
          }
        );
      } else {
        finalOutput = await pdfRenderer.renderMarkdownToPdf(rendered, {
          title: renderContext.metadata.reportTitle,
          pageSize: "A4",
          margin: {
            top: "20mm",
            right: "15mm",
            bottom: "20mm",
            left: "15mm",
          },
        });
      }
      extension = "pdf";
    } else if (outputFormat === "mdx") {
      if (isMdxTemplate) {
        const { AdvancedMdxRenderer } = await import(
          "../renderers/mdx-renderer.js"
        );
        const mdxRenderer = new AdvancedMdxRenderer();
        const htmlRenderer = new HtmlRenderer();

        // MDX → React → HTML
        const { component } = await mdxRenderer.renderToReact(
          rendered,
          renderContext
        );
        finalOutput = await htmlRenderer.renderReact(component, {
          includeStyles: true,
          title: renderContext.metadata.reportTitle,
        });
        extension = "html";
      } else {
        finalOutput = rendered;
        extension = "md";
      }
    } else if (outputFormat === "pptx") {
      const { PptxExporter } = await import("../exporters/pptx-exporter.js");
      const pptxExporter = new PptxExporter();

      await fs.mkdir(outputDir, { recursive: true });
      const pptxPath = path.join(
        outputDir,
        `${plugin.id}-${reportType}-${Date.now()}.pptx`
      );

      await pptxExporter.exportToPptx(attributes, pptxPath, {
        title: renderContext.metadata.reportTitle,
        author: renderContext.metadata.author,
        subject: `${plugin.name} Report`,
      });

      console.log("   ✓ PPTX generated");
      console.log(`\n✅ Report saved: ${pptxPath}\n`);
      return pptxPath;
    } else {
      finalOutput = rendered;
      extension = "md";
    }

    console.log("   ✓ Format converted");

    /* STEP 6: Persist output */
    await fs.mkdir(outputDir, { recursive: true });

    // Use custom name or default to plugin ID
    const baseName = reportName || plugin.id;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${baseName}-${timestamp}.${extension}`;
    const outputPath = path.join(outputDir, fileName);

    if (Buffer.isBuffer(finalOutput)) {
      await fs.writeFile(outputPath, finalOutput);
    } else {
      await fs.writeFile(outputPath, finalOutput as string, "utf-8");
    }

    console.log(`\n✅ Report saved: ${outputPath}\n`);

    return outputPath;
  }

  /* ================================================= */
  /* PROMPT PROCESSING - HANDLES MDX PROMPTS */
  /* ================================================= */
  private async processPrompts(
    plugin: PluginBase,
    spec: SpecificationConfig,
    context: Record<string, any>
  ): Promise<GenerationResults> {
    const results: GenerationResults = {};
    const promptsDir = plugin.getPromptsDir();

    for (const promptSpec of spec.prompts) {
      // 🔥 CHECK: Before each prompt
      ShutdownManager.checkShutdown();

      console.log(`   → ${promptSpec.name}`);

      const promptPath = path.join(promptsDir, promptSpec.file);
      let promptTemplate: string;

      try {
        promptTemplate = await fs.readFile(promptPath, "utf-8");
      } catch (err: any) {
        console.warn(`     ⚠️ Prompt file not found: ${promptPath}`);
        results[promptSpec.name] = "";
        continue;
      }

      // Build prompt context from specified inputs
      const promptContext: Record<string, any> = {};
      for (const key of promptSpec.inputs) {
        promptContext[key] = context[key] ?? [];
      }

      let renderedPrompt: string;

      // Check if prompt is MDX format
      const isMdxPrompt = promptSpec.file.endsWith(".mdx");

      try {
        if (isMdxPrompt) {
          console.log(`     ⚙️  Rendering MDX prompt...`);

          // Step 1: Process Nunjucks variables in MDX
          const env = nunjucks.configure(promptsDir, {
            autoescape: false,
            trimBlocks: true,
            lstripBlocks: true,
            noCache: true,
          });

          // Add custom filters
          this.addNunjucksFilters(env);

          // Render Nunjucks variables
          const processedMdx = nunjucks.renderString(
            promptTemplate,
            promptContext
          );

          // Step 2: Compile MDX to React
          const { AdvancedMdxRenderer } = await import(
            "../renderers/mdx-renderer.js"
          );
          const { HtmlRenderer } = await import(
            "../renderers/html-renderer.js"
          );

          const mdxRenderer = new AdvancedMdxRenderer();
          const htmlRenderer = new HtmlRenderer();

          // MDX → React
          const { component } = await mdxRenderer.renderToReact(
            processedMdx,
            promptContext
          );

          // React → HTML (for LLM)
          renderedPrompt = await htmlRenderer.renderReact(component, {
            includeStyles: false, // No styles for prompts
          });

          console.log(
            `     ✓ MDX prompt rendered (${renderedPrompt.length} chars)`
          );
        } else {
          // Standard Nunjucks rendering for .md files
          const env = nunjucks.configure(promptsDir, {
            autoescape: false,
            trimBlocks: true,
            lstripBlocks: true,
            noCache: true,
          });

          this.addNunjucksFilters(env);

          const safetyPreamble = promptSpec.inputs
            .map((k) => `{% set ${k} = ${k} | default([]) %}`)
            .join("\n");

          promptTemplate = safetyPreamble + "\n" + promptTemplate;
          renderedPrompt = nunjucks.renderString(promptTemplate, promptContext);
        }
      } catch (err: any) {
        console.warn(`     ⚠️ Template rendering failed: ${err.message}`);
        console.error(err);
        results[promptSpec.name] = "";
        continue;
      }

      // Call LLM
      try {
        const response = await this.llmClient.complete(renderedPrompt);
        results[promptSpec.name] = response.content;
        console.log(`     ✓ tokens: ${response.usage?.totalTokens ?? 0}`);
      } catch (err: any) {
        // 🔥 CHECK: If shutdown error, break the loop
        if (err.message.includes("shutting down")) {
          console.log(`     ⚠️  Stopping - shutting down`);
          break;
        }
        console.warn(`     ⚠️ ${promptSpec.name} failed: ${err.message}`);
        results[promptSpec.name] = "";
      }
    }

    return results;
  }

  /* ================================================= */
  /* TEMPLATE RENDERING - HANDLES MDX TEMPLATES */
  /* ================================================= */
  private async renderTemplate(
    plugin: PluginBase,
    spec: SpecificationConfig,
    data: Record<string, any>
  ): Promise<string> {
    const templatesDir = plugin.getTemplatesDir();
    const templatePath = path.join(templatesDir, spec.template.file);

    let templateContent: string;
    try {
      templateContent = await fs.readFile(templatePath, "utf-8");
    } catch (err: any) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    // Check if template is MDX
    const isMdxTemplate = spec.template.type === "mdx";

    if (isMdxTemplate) {
      // For MDX templates, just process Nunjucks variables
      // The actual MDX compilation happens in Step 5
      const env = nunjucks.configure(templatesDir, {
        autoescape: false,
        trimBlocks: true,
        lstripBlocks: true,
        noCache: true,
      });

      this.addNunjucksFilters(env);

      // Return MDX with Nunjucks variables replaced
      return nunjucks.renderString(templateContent, data);
    } else {
      // Standard Nunjucks rendering for .njk files
      const env = nunjucks.configure(templatesDir, {
        autoescape: false,
        trimBlocks: true,
        lstripBlocks: true,
        noCache: true,
      });

      this.addNunjucksFilters(env);

      try {
        return nunjucks.renderString(templateContent, data);
      } catch (err: any) {
        throw new Error(`Template rendering failed: ${err.message}`);
      }
    }
  }

  /* ================================================= */
  /* HELPER: ADD NUNJUCKS FILTERS */
  /* ================================================= */
  private addNunjucksFilters(env: nunjucks.Environment): void {
    env.addFilter("json", (obj) => JSON.stringify(obj, null, 2));
    env.addFilter("safe", (v) => (v == null ? "" : String(v)));
    env.addFilter("truncate", (v, l = 100) => {
      const str = String(v ?? "");
      return str.length > l ? str.slice(0, l) + "…" : str;
    });
    env.addFilter("number_format", (v) => {
      if (v == null) return "0";
      const num = Number(v);
      return Number.isFinite(num)
        ? new Intl.NumberFormat("en-US").format(num)
        : String(v);
    });
    env.addFilter("round", (v, decimals = 0) => {
      const num = Number(v);
      if (!Number.isFinite(num)) return v;
      return num.toFixed(decimals);
    });
    env.addFilter("slice", (arr, start, end) => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(start, end);
    });
    env.addFilter("top_entries", (input: any, limit = 10) => {
      if (!input) return [];
      const entries = Array.isArray(input) ? input : Object.entries(input);
      return entries
        .map(([k, v]: any) => [k, Number(v) || 0])
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    });
    env.addFilter("title", (str) => {
      return String(str ?? "")
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });
    env.addFilter("percent", (v, decimals = 1) => {
      const num = Number(v);
      if (!Number.isFinite(num)) return "0%";
      return `${num.toFixed(decimals)}%`;
    });
    env.addFilter("date_format", (v, format = "short") => {
      const date = new Date(v);
      if (isNaN(date.getTime())) return String(v);

      if (format === "short") {
        return date.toLocaleDateString();
      } else if (format === "long") {
        return date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } else if (format === "iso") {
        return date.toISOString();
      }
      return date.toLocaleDateString();
    });
    env.addFilter("currency", (v, currency = "USD") => {
      const num = Number(v);
      if (!Number.isFinite(num)) return "$0";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(num);
    });
  }

  /* ================================================= */
  setLlmClient(client: AISdkLLMClient): void {
    this.llmClient = client;
  }

  getLlmClient(): AISdkLLMClient {
    return this.llmClient;
  }
}
