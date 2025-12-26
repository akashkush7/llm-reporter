/**
 * Framework utilities for UI
 * Directly loads plugins using the framework's PluginLoader
 */

export {
  getPipelines,
  getPluginMetadata as getPipeline,
  getPlugin,
} from "./plugin-manager";

// Re-export the base plugin type for convenience
export type { PluginBase } from "@aganitha/report-framework";
