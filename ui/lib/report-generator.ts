import {
  ReportEngine,
  AISdkLLMClient,
  type PluginBase,
} from "@aganitha/report-framework";
import { configManager } from "./config-manager";

/**
 * Generate a report using the specified plugin and configuration
 */
export async function generateReport(params: {
  plugin: PluginBase;
  inputs: Record<string, any>;
  reportType: string;
  outputFormat: string;
  profileName?: string;
  reportName?: string;
}) {
  const { plugin, inputs, reportType, outputFormat, profileName, reportName } =
    params;

  console.log(`\n🎯 Generating report:`);
  console.log(`   Plugin: ${plugin.name} (${plugin.id})`);
  console.log(`   Report Type: ${reportType}`);
  console.log(`   Output Format: ${outputFormat}`);

  // Get LLM config from profile
  const llmConfig = await configManager.getLLMConfig(profileName);

  if (!llmConfig) {
    throw new Error(
      "No LLM profile configured. Please create a profile first."
    );
  }

  console.log(`   LLM Profile: ${profileName || "default"}`);
  console.log(`   Provider: ${llmConfig.provider}`);
  console.log(`   Model: ${llmConfig.model}`);

  // Initialize LLM client
  const llmClient = new AISdkLLMClient(llmConfig);

  // Initialize report engine
  const engine = new ReportEngine(llmClient);

  // Get output directory from config
  const outputDir = await configManager.getOutputDir();

  console.log(`   Output Directory: ${outputDir}\n`);

  // Generate report
  const outputPath = await engine.generateReport({
    plugin,
    inputs,
    reportType,
    outputFormat: outputFormat as any,
    outputDir,
    reportName,
  });

  console.log(`✅ Report generated: ${outputPath}\n`);

  return outputPath;
}
