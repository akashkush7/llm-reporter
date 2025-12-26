import { Command } from "commander";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { configManager, LLMProfile } from "../utils/config-manager.js";
import { logger } from "../utils/logger.js";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize LLM Reporter project")
    .option("--skip-profile", "Skip profile creation")
    .action(async (options) => {
      logger.header("🚀 Initializing LLM Reporter...\n");

      const dirs = ["plugins", "prompts", "templates"];

      dirs.forEach((dir) => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          logger.success(`Created ${dir}/`);
        }
      });

      const gitignorePath = path.join(process.cwd(), ".gitignore");
      if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(
          gitignorePath,
          `
# LLM Reporter
output/
node_modules/
*.log
.DS_Store
`.trim()
        );
        logger.success("Created .gitignore");
      }

      // Check if profiles exist
      const profiles = await configManager.listProfiles();

      if (profiles.length === 0 && !options.skipProfile) {
        logger.section("\n📝 Let's create your first LLM profile");

        const shouldCreate = await inquirer.prompt<{ create: boolean }>([
          {
            type: "confirm",
            name: "create",
            message: "Create an LLM profile now?",
            default: true,
          },
        ] as any);

        if (shouldCreate.create) {
          const answers = await inquirer.prompt<{
            name: string;
            provider: "openai" | "gemini" | "deepseek";
            model: string;
            apiKey: string;
          }>([
            {
              type: "input",
              name: "name",
              message: "Profile name:",
              default: "default",
            },
            {
              type: "list",
              name: "provider",
              message: "LLM Provider:",
              choices: [
                { name: "OpenAI (GPT-4o, GPT-4o-mini)", value: "openai" },
                { name: "Google Gemini (2.0 Flash, 1.5 Pro)", value: "gemini" },
                { name: "DeepSeek (Chat, Coder)", value: "deepseek" },
              ],
            },
            {
              type: "input",
              name: "model",
              message: "Model name:",
              default: (answers: any) => {
                const defaults: Record<string, string> = {
                  openai: "gpt-4o-mini",
                  gemini: "gemini-2.5-flash-lite",
                  deepseek: "deepseek-chat",
                };
                return defaults[answers.provider] || "gpt-4o-mini";
              },
            },
            {
              type: "password",
              name: "apiKey",
              message: "API Key:",
              mask: "*",
            },
          ] as any);

          const profile: LLMProfile = {
            name: answers.name,
            provider: answers.provider,
            model: answers.model,
            apiKey: answers.apiKey,
            temperature: 0.7,
            maxTokens: 4096,
          };

          await configManager.addProfile(profile);

          logger.success(
            `\nProfile '${answers.name}' created and set as default`
          );
        }
      }

      logger.section("\n✅ Initialization complete!\n");

      if (profiles.length === 0 && options.skipProfile) {
        console.log("Next steps:");
        console.log("  1. report-cli config add    # Add LLM profile");
        console.log("  2. report-cli list          # List plugins");
        console.log("  3. report-cli run <plugin>  # Run ingestion\n");
      } else {
        console.log("Next steps:");
        console.log("  1. Add plugin files to plugins/");
        console.log("  2. report-cli list");
        console.log("  3. report-cli run <plugin> -i <input-file>\n");
      }

      logger.info(`Config location: ${configManager.getConfigPath()}`);
      console.log("");
    });
}
