import { Bundle } from "../bundles/types.js";

export type OutputFormat = "html" | "pdf" | "pptx" | "mdx";

/**
 * Specification for report generation
 */
export interface SpecificationConfig {
  inputs: Array<{
    path: string;
    name: string;
  }>;
  prompts: Array<{
    file: string;
    name: string;
    inputs: string[];
  }>;
  template: {
    file: string;
    type: "njk" | "mdx";
  };
}

export interface SpecificationMap {
  [key: string]: SpecificationConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Pipeline input definition (NEW)
 */
export interface PipelineInputField {
  name: string;
  label: string;
  type: "string" | "number" | "file" | "enum";
  required: boolean;
  description?: string;
  options?: string[];
}

/**
 * Plugin = Pipeline
 */
export interface FrameworkPlugin {
  /** identity */
  id: string;
  version: string;
  name: string;
  description: string;

  /** inputs become visible ONLY after pipeline selection */
  inputs: PipelineInputField[];

  /** pipeline-defined output formats */
  outputFormats: OutputFormat[];

  /**
   * Data processor
   * - may read files
   * - may call APIs
   * - may compute values
   * Framework does not care.
   */
  process(inputs: Record<string, any>): Promise<Bundle>;

  /** report specifications by output type */
  getSpecifications(): SpecificationMap;

  /** assets */
  getPromptsDir(): string;
  getTemplatesDir(): string;

  /** optional validation */
  validateInput?(inputs: Record<string, any>): ValidationResult;
}
