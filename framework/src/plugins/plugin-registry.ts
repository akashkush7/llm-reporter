import { PluginBase } from "./plugin-base.js";

/**
 * Registry for managing loaded plugins
 */
export class PluginRegistry {
  private plugins = new Map<string, PluginBase>();

  register(plugin: PluginBase): void {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): PluginBase | undefined {
    return this.plugins.get(id);
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  getAll(): PluginBase[] {
    return Array.from(this.plugins.values());
  }

  size(): number {
    return this.plugins.size;
  }

  list(): Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    inputs: any[];
    outputFormats: string[];
  }> {
    return this.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      description: p.description,
      inputs: p.inputs,
      outputFormats: p.outputFormats,
    }));
  }

  clear(): void {
    this.plugins.clear();
  }

  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.cleanup();
    }
    this.plugins.clear();
  }
}
