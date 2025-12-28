import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { PluginRegistry } from "./plugin-registry.js";
import { PluginBase, PluginContext } from "./plugin-base.js";

/**
 * Check if object is a valid plugin (duck typing)
 */
function isValidPlugin(obj: any): obj is PluginBase {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.version === "string" &&
    typeof obj.initialize === "function" &&
    typeof obj.process === "function" &&
    typeof obj.getSpecifications === "function"
  );
}

/**
 * Loads plugins (that extend PluginBase) at runtime
 * Supports both .ts (via tsx) and .js files
 */
export class PluginLoader {
  static async loadFromDirectory(
    registry: PluginRegistry,
    pluginsDir: string,
    ctx: PluginContext
  ): Promise<void> {
    const resolvedDir = path.resolve(pluginsDir);

    if (!fs.existsSync(resolvedDir)) {
      console.log(`ℹ️  Plugins directory not found: ${resolvedDir}`);
      return;
    }

    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    const pluginDirs = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        !entry.name.startsWith(".")
    );

    if (pluginDirs.length === 0) {
      console.log(`ℹ️  No plugin directories found in ${resolvedDir}`);
      return;
    }

    console.log(`🔍 Scanning ${pluginDirs.length} plugin director(ies)...`);

    // ✅ Load plugins sequentially to avoid race conditions
    for (const dir of pluginDirs) {
      const pluginPath = path.join(resolvedDir, dir.name);

      // ✅ Check for index.ts first, then index.js
      const indexTs = path.join(pluginPath, "index.ts");
      const indexJs = path.join(pluginPath, "index.js");

      if (fs.existsSync(indexTs)) {
        await this.loadPluginTypescript(indexTs, registry, ctx);
      } else if (fs.existsSync(indexJs)) {
        await this.loadPlugin(indexJs, registry, ctx);
      } else {
        console.log(`   ⊘ ${dir.name}: No index.ts or index.js found`);
      }
    }

    console.log(`✅ Loaded ${registry.getAll().length} plugin(s)\n`);
  }

  // ✅ Load TypeScript plugin using tsx
  private static async loadPluginTypescript(
    filePath: string,
    registry: PluginRegistry,
    ctx: PluginContext
  ): Promise<void> {
    let unregister: (() => void) | null = null;

    try {
      // Register tsx loader
      const tsx = await import("tsx/esm/api");
      unregister = tsx.register();

      // 🔥 Use timestamp + random to force fresh load (ESM compatible)
      const fileUrl = pathToFileURL(filePath).href;
      const moduleUrl = `${fileUrl}?t=${Date.now()}&r=${Math.random()}`;
      const mod = await import(moduleUrl);

      const PluginClass = mod.default;

      if (typeof PluginClass !== "function") {
        console.log(`   ⊘ ${path.basename(filePath)}: Export is not a class`);
        return;
      }

      const plugin = new PluginClass();

      // ✅ Use duck typing instead of instanceof
      if (!isValidPlugin(plugin)) {
        console.log(
          `   ⊘ ${path.basename(
            filePath
          )}: Plugin must implement PluginBase interface`
        );
        console.log(`      Missing: ${this.getMissingProperties(plugin)}`);
        return;
      }

      // ✅ Check for duplicate BEFORE initialization
      if (registry.has(plugin.id)) {
        console.log(`   ⊘ ${plugin.id}: Duplicate plugin ID (skipping)`);
        return;
      }

      // ✅ Initialize plugin
      console.log(`[${plugin.id}] Initializing plugin...`);
      await plugin.initialize(ctx);

      // ✅ Register plugin
      registry.register(plugin);
      console.log(`   ✓ ${plugin.id} (${plugin.name}) v${plugin.version} [TS]`);
    } catch (err: any) {
      console.error(`\n❌ Failed to load TypeScript plugin: ${filePath}`);
      console.error("─────────────────────────────────");
      console.error(err?.stack || err);
      console.error("─────────────────────────────────\n");
    } finally {
      // ✅ Always unregister tsx
      if (unregister) {
        unregister();
      }
    }
  }

  // Load JavaScript plugin
  private static async loadPlugin(
    filePath: string,
    registry: PluginRegistry,
    ctx: PluginContext
  ): Promise<void> {
    try {
      // 🔥 Use timestamp + random to force fresh load (ESM compatible)
      const fileUrl = pathToFileURL(filePath).href;
      const moduleUrl = `${fileUrl}?t=${Date.now()}&r=${Math.random()}`;
      const mod = await import(moduleUrl);

      const PluginClass = mod.default;

      if (typeof PluginClass !== "function") {
        console.log(`   ⊘ ${path.basename(filePath)}: Export is not a class`);
        return;
      }

      const plugin = new PluginClass();

      // ✅ Use duck typing for JS plugins too
      if (!isValidPlugin(plugin)) {
        console.log(
          `   ⊘ ${path.basename(
            filePath
          )}: Plugin must implement PluginBase interface`
        );
        console.log(`      Missing: ${this.getMissingProperties(plugin)}`);
        return;
      }

      // ✅ Check for duplicate BEFORE initialization
      if (registry.has(plugin.id)) {
        console.log(`   ⊘ ${plugin.id}: Duplicate plugin ID (skipping)`);
        return;
      }

      // ✅ Initialize plugin
      await plugin.initialize(ctx);

      // ✅ Register plugin
      registry.register(plugin);
      console.log(`   ✓ ${plugin.id} (${plugin.name}) v${plugin.version}`);
    } catch (err: any) {
      console.error(`\n❌ Failed to load plugin: ${filePath}`);
      console.error("─────────────────────────────────");
      console.error(err?.stack || err);
      console.error("─────────────────────────────────\n");
    }
  }

  // Helper to show what's missing
  private static getMissingProperties(obj: any): string {
    const required = [
      "id",
      "name",
      "version",
      "description",
      "inputs",
      "outputFormats",
      "initialize",
      "process",
      "getSpecifications",
      "getPromptsDir",
      "getTemplatesDir",
    ];

    const missing = required.filter(
      (prop) => !(prop in obj) || obj[prop] === undefined
    );

    return missing.join(", ") || "none";
  }
}
