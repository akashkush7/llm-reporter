import { Command } from "commander";
import { PluginRegistry } from "@aganitha/report-framework";
import { logger } from "../utils/logger.js";

export function createInspectCommand(registry: PluginRegistry): Command {
  return new Command("inspect")
    .description("Inspect a pipeline definition")
    .argument("<pipeline-id>", "Pipeline ID to inspect")
    .option("--json", "Output inspection result as JSON")
    .action((pipelineId: string, options) => {
      const pipeline = registry.get(pipelineId);

      if (!pipeline) {
        logger.error(`Pipeline not found: ${pipelineId}`);
        console.log("\nAvailable pipelines:");
        registry.list().forEach((p) => console.log(`  - ${p.id}: ${p.name}`));
        process.exit(1);
      }

      /* -------------------------------------------
         JSON OUTPUT (for UI / automation)
      --------------------------------------------*/
      if (options.json) {
        const jsonOutput = {
          id: pipeline.id,
          name: pipeline.name,
          version: pipeline.version,
          description: pipeline.description,
          inputs: pipeline.inputs,
          outputFormats: pipeline.outputFormats,
          specifications: Object.fromEntries(
            Object.entries(pipeline.getSpecifications()).map(([key, spec]) => [
              key,
              {
                template: spec.template,
                prompts: spec.prompts ?? [],
              },
            ])
          ),
        };

        console.log(JSON.stringify(jsonOutput, null, 2));
        return;
      }

      /* -------------------------------------------
         HUMAN READABLE OUTPUT
      --------------------------------------------*/
      logger.header(`🔍 Pipeline: ${pipeline.id}`);

      console.log(`Name        : ${pipeline.name}`);
      console.log(`Version     : ${pipeline.version}`);
      console.log(`Description : ${pipeline.description}`);
      console.log(`Output types: ${pipeline.outputFormats.join(", ")}`);

      console.log("\n🧩 Inputs:");
      if (pipeline.inputs.length === 0) {
        console.log("  (none)");
      } else {
        pipeline.inputs.forEach((input) => {
          console.log(`  • ${input.name}`);
          console.log(`      Type     : ${input.type}`);
          console.log(`      Required : ${input.required}`);
          if (input.description) {
            console.log(`      Desc     : ${input.description}`);
          }
          if (input.options?.length) {
            console.log(`      Options  : ${input.options.join(", ")}`);
          }
        });
      }

      console.log("\n📄 Specifications:");
      const specs = pipeline.getSpecifications();

      Object.entries(specs).forEach(([key, spec]) => {
        console.log(`  • ${key}`);
        console.log(
          `      Template : ${spec.template.file} (${spec.template.type})`
        );

        if (spec.prompts?.length) {
          console.log(`      Prompts:`);
          spec.prompts.forEach((p) => {
            console.log(
              `        - ${p.name} → ${p.file} [${p.inputs.join(", ")}]`
            );
          });
        } else {
          console.log(`      Prompts: (none)`);
        }
      });

      console.log("");
    });
}
