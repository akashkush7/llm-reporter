import { Bundle } from "../bundles/types.js";

export type OutputFormat = "html" | "pdf" | "pptx" | "mdx";

export interface PipelineInputField {
  name: string;
  label: string;
  type: "string" | "number" | "file" | "enum";
  required: boolean;
  description?: string;
  options?: string[];
}

export interface SpecificationConfig {
  inputs: Array<{ path: string; name: string }>;
  prompts: Array<{ file: string; name: string; inputs: string[] }>;
  template: { file: string; type: "njk" | "mdx" };
}

export interface SpecificationMap {
  [key: string]: SpecificationConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface PluginContext {
  logger: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string, error?: Error): void;
  };
  config: Record<string, any>;
  workDir: string;
  frameworkVersion: string;
}

/**
 * ABSTRACT BASE CLASS - All plugins MUST extend this
 * Implements Template Method pattern for consistent plugin lifecycle
 */
export abstract class PluginBase {
  // ============================================
  // REQUIRED METADATA - Must implement as properties
  // ============================================

  /**
   * Unique plugin identifier in format: org.plugin-name
   * Example: "acme.sales-report"
   */
  abstract readonly id: string;

  /**
   * Semantic version
   * Example: "1.0.0"
   */
  abstract readonly version: string;

  /**
   * Human-readable plugin name
   * Example: "Sales Report Generator"
   */
  abstract readonly name: string;

  /**
   * Plugin description
   * Example: "Generates monthly sales reports from CSV data"
   */
  abstract readonly description: string;

  /**
   * Input fields that user must provide
   * Shown in CLI/UI after plugin is selected
   */
  abstract readonly inputs: PipelineInputField[];

  /**
   * Output formats this plugin supports
   * Example: ["html", "pdf", "pptx"]
   */
  abstract readonly outputFormats: OutputFormat[];

  // ============================================
  // FRAMEWORK-MANAGED STATE (protected)
  // ============================================

  protected ctx!: PluginContext;
  protected initialized = false;
  private processingStartTime = 0;

  // ============================================
  // FRAMEWORK LIFECYCLE (final - cannot override)
  // ============================================

  /**
   * Initialize plugin with framework context
   * Called once when plugin is loaded
   * FINAL - Developer cannot override this
   */
  async initialize(ctx: PluginContext): Promise<void> {
    if (this.initialized) {
      throw new Error(`Plugin ${this.id} already initialized`);
    }

    this.ctx = ctx;
    this.log("info", "Initializing plugin...");

    // Validate plugin metadata
    await this.validatePluginMetadata();

    // Call developer's initialization hook
    await this.onInit();

    this.initialized = true;
    this.log("info", "✓ Plugin initialized successfully");
  }

  /**
   * Main processing entry point - TEMPLATE METHOD
   * FINAL - Enforces consistent processing flow
   * Developer implements hooks/abstract methods
   */
  async process(inputs: Record<string, any>): Promise<Bundle> {
    if (!this.initialized) {
      throw new Error(
        `Plugin ${this.id} not initialized. Call initialize() first.`
      );
    }

    this.processingStartTime = Date.now();
    this.log("info", `Starting data processing...`);

    try {
      // Step 1: Pre-processing hook
      await this.beforeProcess(inputs);

      // Step 2: Validate inputs
      const validation = this.validateInputs(inputs);
      if (!validation.valid) {
        throw new Error(
          `Input validation failed: ${validation.errors?.join(", ")}`
        );
      }
      this.log("info", "✓ Inputs validated");

      // Step 3: Load data (ABSTRACT - must implement)
      this.log("info", "Loading data...");
      const rawData = await this.loadData(inputs);
      this.log("info", `✓ Loaded ${rawData.length} records`);

      // Step 4: Transform data (HOOK - can override)
      this.log("info", "Transforming data...");
      const transformedData = await this.transformData(rawData, inputs);
      this.log("info", `✓ Transformed to ${transformedData.length} records`);

      // Step 5: Calculate statistics (HOOK - can override)
      this.log("info", "Computing statistics...");
      const stats = await this.computeStatistics(transformedData, inputs);
      this.log("info", "✓ Statistics computed");

      // Step 6: Build bundle (HOOK - can override)
      const bundle = await this.buildBundle(transformedData, stats, inputs);

      // Step 7: Post-processing hook
      await this.afterProcess(bundle);

      const duration = Date.now() - this.processingStartTime;
      this.log("info", `✅ Processing completed in ${duration}ms`);

      return bundle;
    } catch (error) {
      this.log(
        "error",
        `❌ Processing failed: ${(error as Error).message}`,
        error as Error
      );
      await this.onError(error as Error, inputs);
      throw error;
    }
  }

  /**
   * Cleanup plugin resources
   * FINAL - Called when plugin is unloaded
   */
  async cleanup(): Promise<void> {
    this.log("info", "Cleaning up plugin resources...");
    await this.onCleanup();
    this.initialized = false;
    this.log("info", "✓ Cleanup completed");
  }

  // ============================================
  // ABSTRACT METHODS - MUST IMPLEMENT
  // ============================================

  /**
   * Load raw data from source
   *
   * @param inputs - User-provided inputs (validated)
   * @returns Array of raw data records
   *
   * MUST IMPLEMENT - This is your core data ingestion logic
   *
   * Examples:
   * - Load CSV file
   * - Fetch from API
   * - Query database
   * - Read JSON file
   */
  protected abstract loadData(inputs: Record<string, any>): Promise<any[]>;

  /**
   * Get report specifications for this plugin
   *
   * MUST IMPLEMENT - Defines report types and their templates
   *
   * Example:
   * {
   *   "monthly-report": {
   *     inputs: [{ path: "data.csv", name: "salesData" }],
   *     prompts: [{ file: "summary.mdx", name: "summary", inputs: ["salesData"] }],
   *     template: { file: "report.mdx", type: "mdx" }
   *   }
   * }
   */
  abstract getSpecifications(): SpecificationMap;

  /**
   * Get directory path for prompt templates
   *
   * MUST IMPLEMENT - Where your .md/.mdx prompt files are stored
   *
   * Example: "./plugins/my-plugin/prompts"
   */
  abstract getPromptsDir(): string;

  /**
   * Get directory path for report templates
   *
   * MUST IMPLEMENT - Where your .njk/.mdx template files are stored
   *
   * Example: "./plugins/my-plugin/templates"
   */
  abstract getTemplatesDir(): string;

  // ============================================
  // HOOK METHODS - CAN OVERRIDE (optional)
  // ============================================

  /**
   * Called after plugin is initialized
   * Override to set up resources, connections, etc.
   */
  protected async onInit(): Promise<void> {
    // Default: do nothing
  }

  /**
   * Called before processing starts
   * Override to perform pre-processing tasks
   */
  protected async beforeProcess(inputs: Record<string, any>): Promise<void> {
    // Default: do nothing
  }

  /**
   * Called after successful processing
   * Override to perform post-processing tasks
   */
  protected async afterProcess(bundle: Bundle): Promise<void> {
    // Default: do nothing
  }

  /**
   * Called when an error occurs during processing
   * Override to handle errors (logging, notifications, etc.)
   */
  protected async onError(
    error: Error,
    inputs: Record<string, any>
  ): Promise<void> {
    // Default: just log
    this.log("error", `Error: ${error.message}`, error);
  }

  /**
   * Called during cleanup
   * Override to close connections, release resources, etc.
   */
  protected async onCleanup(): Promise<void> {
    // Default: do nothing
  }

  /**
   * Transform loaded data
   * Override to filter, normalize, aggregate, etc.
   *
   * @param data - Raw data from loadData()
   * @param inputs - User inputs
   * @returns Transformed data
   */
  protected async transformData(
    data: any[],
    inputs: Record<string, any>
  ): Promise<any[]> {
    // Default: no transformation
    return data;
  }

  /**
   * Compute statistics from transformed data
   * Override to add custom statistics
   *
   * @param data - Transformed data
   * @param inputs - User inputs
   * @returns Statistics object
   */
  protected async computeStatistics(
    data: any[],
    inputs: Record<string, any>
  ): Promise<Record<string, any>> {
    // Default: basic stats
    return {
      count: data.length,
      firstRecord: data[0],
      lastRecord: data[data.length - 1],
    };
  }

  /**
   * Build Bundle from processed data
   * Override to customize bundle structure
   *
   * @param data - Transformed data
   * @param stats - Computed statistics
   * @param inputs - User inputs
   * @returns Bundle for report generation
   */
  protected async buildBundle(
    data: any[],
    stats: Record<string, any>,
    inputs: Record<string, any>
  ): Promise<Bundle> {
    // Default implementation
    return {
      datasetName: this.id,
      samples: { main: data },
      stats,
      metadata: {
        totalRecords: data.length,
        ingestedAt: new Date().toISOString(),
        source: inputs.dataPath || inputs.apiEndpoint || "unknown",
        pluginId: this.id,
        pluginVersion: this.version,
      },
    };
  }

  /**
   * Validate user inputs
   * Override to add custom validation logic
   *
   * @param inputs - User-provided inputs
   * @returns Validation result
   */
  protected validateInputs(inputs: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    for (const field of this.inputs) {
      if (field.required && !inputs[field.name]) {
        errors.push(`Missing required field: ${field.name}`);
      }

      // Validate enum values
      if (field.type === "enum" && inputs[field.name]) {
        if (!field.options?.includes(inputs[field.name])) {
          errors.push(
            `Invalid value for ${
              field.name
            }. Must be one of: ${field.options?.join(", ")}`
          );
        }
      }

      // Validate number type
      if (field.type === "number" && inputs[field.name] !== undefined) {
        if (isNaN(Number(inputs[field.name]))) {
          errors.push(`${field.name} must be a number`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ============================================
  // PROTECTED UTILITY METHODS
  // ============================================

  /**
   * Log a message with the plugin context
   */
  protected log(
    level: "info" | "warn" | "error",
    message: string,
    error?: Error
  ): void {
    const prefix = `[${this.id}]`;

    if (level === "error") {
      this.ctx.logger.error(`${prefix} ${message}`, error);
    } else if (level === "warn") {
      this.ctx.logger.warn(`${prefix} ${message}`);
    } else {
      this.ctx.logger.info(`${prefix} ${message}`);
    }
  }

  /**
   * Get elapsed time since processing started (in milliseconds)
   */
  protected getElapsedTime(): number {
    return Date.now() - this.processingStartTime;
  }

  // ============================================
  // PRIVATE VALIDATION
  // ============================================

  private async validatePluginMetadata(): Promise<void> {
    const errors: string[] = [];

    if (!this.id || !this.id.includes(".")) {
      errors.push("Plugin ID must be in format: org.plugin-name");
    }

    if (!this.version || !/^\d+\.\d+\.\d+/.test(this.version)) {
      errors.push("Version must follow semantic versioning (e.g., 1.0.0)");
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Plugin name is required");
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push("Plugin description is required");
    }

    if (!Array.isArray(this.inputs)) {
      errors.push("Inputs must be an array");
    }

    if (!Array.isArray(this.outputFormats) || this.outputFormats.length === 0) {
      errors.push("Must specify at least one output format");
    }

    if (errors.length > 0) {
      throw new Error(`Plugin validation failed:\n${errors.join("\n")}`);
    }
  }
}
