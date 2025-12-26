// Export the base class (REQUIRED for all plugins)
export { PluginBase } from "./plugins/plugin-base.js";

// Export types
export type {
  PluginContext,
  PipelineInputField,
  SpecificationConfig,
  SpecificationMap,
  ValidationResult,
  OutputFormat,
} from "./plugins/plugin-base.js";

// Export Bundle type
export type { Bundle, BundleValidationResult } from "./bundles/types.js";

// Export loader and registry (for CLI/framework users)
export { PluginLoader } from "./plugins/plugin-loader.js";
export { PluginRegistry } from "./plugins/plugin-registry.js";

// Export report engine
export { ReportEngine } from "./reports/report-engine.js";

// Export LLM client
export { AISdkLLMClient } from "./llm/ai-sdk-client.js";
export type { LLMConfig, LLMProvider } from "./llm/llm-config.js";
export { DEFAULT_LLM_CONFIG, PROVIDER_MODELS } from "./llm/llm-config.js";

// Export specification utilities
export { SpecificationLoader } from "./reports/specification-loader.js";
export { validateSpecification } from "./reports/specification.js";

// Export renderers
export { HtmlRenderer } from "./renderers/html-renderer.js";
export type { HtmlRenderOptions } from "./renderers/html-renderer.js";
export { PdfRenderer } from "./renderers/pdf-renderer.js";
export type { PdfRenderOptions } from "./renderers/pdf-renderer.js";

// Export components (optional, for advanced MDX usage)
export * from "./components/index.js";

export {
  CSVParser,
  XMLParser,
  JSONParser,
  FileParser,
} from "./utils/parsers.js";
export { HttpClient } from "./utils/http.js";
export { StatisticsHelper } from "./utils/statistics.js";
export { ShutdownManager } from "./utils/shutdown-manager.js";
