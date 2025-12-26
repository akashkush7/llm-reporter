import {
  PluginRegistry,
  PluginLoader,
  PluginContext,
} from "@aganitha/report-framework";
import type { PluginBase } from "@aganitha/report-framework";
import { configManager } from "./config-manager";

let globalRegistry: PluginRegistry | null = null;

async function initializeRegistry(): Promise<PluginRegistry> {
  const registry = new PluginRegistry();
  const pluginsDir = await configManager.getPluginsDir();

  // Create plugin context
  const ctx: PluginContext = {
    logger: console,
    config: {},
    workDir: process.cwd(),
    frameworkVersion: "1.0.0",
  };

  console.log(`🔍 Loading plugins from: ${pluginsDir}`);

  // ✅ CORRECT: Static method with 3 parameters
  await PluginLoader.loadFromDirectory(registry, pluginsDir, ctx);

  const loadedCount = registry.getAll().length;
  console.log(`✅ Loaded ${loadedCount} plugin(s)\n`);

  return registry;
}

export async function getPluginRegistry(): Promise<PluginRegistry> {
  if (!globalRegistry) {
    globalRegistry = await initializeRegistry();
  }
  return globalRegistry;
}

/**
 * 🔥 NEW: Force reload plugins from disk
 */
export async function reloadPlugins(): Promise<void> {
  console.log("🔄 Reloading plugins from disk...");
  globalRegistry = null; // Clear cache
  await getPluginRegistry(); // Reload
}

/**
 * Get all pipeline metadata WITH inputs (for UI display)
 * ✅ Always reloads plugins from disk
 */
export async function getPipelines() {
  // ✅ Reload plugins every time
  await reloadPlugins();
  const registry = await getPluginRegistry();
  const plugins = registry.getAll();

  return plugins.map((plugin) => ({
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    outputFormats: plugin.outputFormats,
    inputs: plugin.inputs,
    specifications: Object.keys(plugin.getSpecifications()),
  }));
}

/**
 * Get single plugin instance
 * 🔥 OPTION: Add forceReload parameter
 */
export async function getPlugin(
  id: string,
  forceReload = false
): Promise<PluginBase | undefined> {
  if (forceReload) {
    await reloadPlugins();
  }
  const registry = await getPluginRegistry();
  return registry.get(id);
}

/**
 * Get plugin metadata including inputs for UI
 */
export async function getPluginMetadata(id: string) {
  const plugin = await getPlugin(id);

  if (!plugin) {
    throw new Error(`Plugin not found: ${id}`);
  }

  return {
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    inputs: plugin.inputs,
    outputFormats: plugin.outputFormats,
    specifications: Object.keys(plugin.getSpecifications()),
  };
}

/**
 * Clear cache (useful for development/hot-reload)
 */
export function clearPluginCache() {
  globalRegistry = null;
}
