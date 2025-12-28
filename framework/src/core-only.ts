// Core-only exports (no React dependencies)
export { PluginBase } from "./plugins/plugin-base.js";
export type {
  PluginContext,
  PipelineInputField,
  SpecificationConfig,
  SpecificationMap,
  ValidationResult,
  OutputFormat,
} from "./plugins/plugin-base.js";

export type { Bundle } from "./bundles/types.js";

export { PluginLoader } from "./plugins/plugin-loader.js";
export { PluginRegistry } from "./plugins/plugin-registry.js";
export { ReportEngine } from "./reports/report-engine.js";
export { AISdkLLMClient } from "./llm/ai-sdk-client.js";
export type { LLMConfig } from "./llm/llm-config.js";
