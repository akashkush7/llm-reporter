import { Command } from "commander";
import { PluginRegistry } from "@aganitha/report-framework";
import { logger } from "../utils/logger.js";

export function createListCommand(registry: PluginRegistry): Command {
  return new Command("list")
    .description("List all available pipelines")
    .option("-v, --verbose", "Show detailed information")
    .action((options) => {
      const pipelines = registry.list();

      if (pipelines.length === 0) {
        logger.warning("No pipelines found");
        console.log("\nAdd pipeline files (.js) to your plugins directory\n");
        return;
      }

      logger.header(`📦 Available Pipelines (${pipelines.length})`);

      pipelines.forEach((p) => {
        console.log(`• ${p.id} (v${p.version})`);
        console.log(`  ${p.name}`);
        console.log(`  ${p.description}`);

        if (options.verbose) {
          console.log(`  Output formats: ${p.outputFormats.join(", ")}`);
        }

        console.log("");
      });
    });
}
