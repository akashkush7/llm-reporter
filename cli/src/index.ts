#!/usr/bin/env node

import { Command } from "commander";
import { PluginRegistry, PluginLoader } from "@aganitha/report-framework";
import { configManager } from "./utils/config-manager.js";
import { logger } from "./utils/logger.js";
import {
  createInitCommand,
  createListCommand,
  createRunCommand,
  createConfigCommand,
  createInspectCommand,
} from "./commands/index.js";

async function main() {
  const program = new Command();

  program
    .name("report-cli")
    .description("LLM-powered data ingestion and report generation")
    .version("1.0.0");

  const pluginsDir = await configManager.getPluginsDir();
  const registry = new PluginRegistry();
  await PluginLoader.loadFromDirectory(registry, pluginsDir);

  program.addCommand(createInitCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createListCommand(registry));
  program.addCommand(createRunCommand(registry));
  program.addCommand(createInspectCommand(registry));

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  if (error.stack) {
    console.error("\nStack trace:");
    console.error(error.stack);
  }
  process.exit(1);
});
