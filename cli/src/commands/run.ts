import { Command } from "commander";
import inquirer from "inquirer";
import {
  PluginRegistry,
  ReportEngine,
  AISdkLLMClient,
  OutputFormat,
} from "@aganitha/report-framework";
import { configManager } from "../utils/config-manager.js";
import { logger } from "../utils/logger.js";

export function createRunCommand(registry: PluginRegistry): Command {
  return new Command("run")
    .description("Run a reporting pipeline")
    .argument("<pipeline-id>", "Pipeline ID to run")
    .option("-f, --format <format>", "Output format (e.g., html, pdf)")
    .option("-t, --report-type <type>", "Report type/specification to use")
    .option(
      "-i, --input <key=value>",
      "Input value in format key=value (can be used multiple times)"
    )
    .action(async (pipelineId: string, options: any) => {
      try {
        logger.header("🚀 RUNNING PIPELINE");

        /* -------------------------------------------
           STEP 0: LOAD PIPELINE
        --------------------------------------------*/
        const pipeline = registry.get(pipelineId);
        if (!pipeline) {
          logger.error(`Pipeline not found: ${pipelineId}`);
          console.log("\nAvailable pipelines:");
          registry.list().forEach((p) => console.log(`  - ${p.id}: ${p.name}`));
          process.exit(1);
        }

        /* -------------------------------------------
           STEP 1: COLLECT PIPELINE INPUTS
        --------------------------------------------*/
        logger.header("🧩 PIPELINE INPUTS");

        const inputs: Record<string, any> = {};
        for (const input of pipeline.inputs) {
          // Check if provided via -i/--input flag first
          let inputValue: any = undefined;

          if (options.input) {
            const inputArray = Array.isArray(options.input)
              ? options.input
              : [options.input];
            const inputPair = inputArray.find(
              (pair: string) =>
                pair.split("=")[0].toLowerCase() === input.name.toLowerCase()
            );
            if (inputPair) {
              inputValue = inputPair.split("=").slice(1).join("=");
            }
          }

          if (inputValue !== undefined) {
            inputs[input.name] = inputValue;
            console.log(`✓ Using ${input.name}: ${inputValue}`);
          } else if (input.required) {
            // Only prompt for required inputs not provided via flags
            const answer = await inquirer.prompt([
              {
                name: input.name,
                message: input.label,
                type:
                  input.type === "number"
                    ? "number"
                    : input.type === "enum"
                    ? "list"
                    : "input",
                choices: input.options,
                validate: (value: any) => {
                  if (value === undefined || value === "") {
                    return "This field is required";
                  }
                  return true;
                },
              },
            ]);
            inputs[input.name] = answer[input.name];
          } else {
            // Skip optional inputs not provided via flags
            console.log(`⊘ Skipping optional ${input.name}`);
          }
        }

        /* -------------------------------------------
           STEP 2: SELECT REPORT TYPE (SPECIFICATION)
        --------------------------------------------*/
        logger.header("📑 REPORT TYPE");

        const specifications = pipeline.getSpecifications();
        const specKeys = Object.keys(specifications);

        if (specKeys.length === 0) {
          throw new Error(
            `Pipeline '${pipeline.id}' does not define any report specifications`
          );
        }

        let reportType: string;

        // Check for --report-type flag first (for API/automation)
        if (options.reportType) {
          reportType = options.reportType;
          console.log(`✓ Using report type: ${reportType}`);
        } else if (specKeys.length === 1) {
          reportType = specKeys[0];
          console.log(`✓ Using report type: ${reportType}`);
        } else {
          const answer = await inquirer.prompt([
            {
              name: "reportType",
              message: "Select report type",
              type: "list",
              choices: specKeys,
            },
          ]);
          reportType = answer.reportType;
        }

        /* -------------------------------------------
           STEP 3: SELECT OUTPUT FORMAT
        --------------------------------------------*/
        logger.header("📤 OUTPUT FORMAT");

        let outputFormat: string;
        if (options.format) {
          outputFormat = options.format;
          console.log(`✓ Using output format: ${outputFormat}`);
        } else {
          const answer = await inquirer.prompt([
            {
              name: "outputFormat",
              message: "Select output format",
              type: "list",
              choices: pipeline.outputFormats,
            },
          ]);
          outputFormat = answer.outputFormat;
        }

        // type-safe narrowing
        if (!(pipeline.outputFormats as string[]).includes(outputFormat)) {
          throw new Error(`Invalid output format: ${outputFormat}`);
        }

        const typedOutputFormat: OutputFormat = outputFormat as OutputFormat;

        /* -------------------------------------------
           STEP 4: INITIALIZE LLM
        --------------------------------------------*/
        logger.header("🤖 LLM INITIALIZATION");

        const llmConfig = await configManager.getLLMConfig();
        if (!llmConfig) {
          logger.error("No LLM configuration found");
          console.log("\nRun: report-cli config add\n");
          process.exit(1);
        }

        const llmClient = new AISdkLLMClient(llmConfig);
        console.log(`✓ LLM ready: [${llmConfig.provider}] ${llmConfig.model}`);

        /* -------------------------------------------
           STEP 5: RUN REPORT ENGINE
        --------------------------------------------*/
        logger.header("📊 GENERATING REPORT");

        const reportEngine = new ReportEngine(llmClient);

        const outputPath = await reportEngine.generateReport({
          plugin: pipeline,
          inputs,
          reportType,
          outputFormat: typedOutputFormat,
        });

        /* -------------------------------------------
           DONE
        --------------------------------------------*/
        logger.header("✅ PIPELINE COMPLETE");
        console.log(`📄 Report generated at:\n   ${outputPath}\n`);
      } catch (error: any) {
        logger.error(`Pipeline failed: ${error.message}`);
        if (error.stack) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });
}
