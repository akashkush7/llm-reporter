import { Command } from 'commander';
import inquirer from 'inquirer';
import { configManager, LLMProfile } from '../utils/config-manager.js';
import { logger } from '../utils/logger.js';

/**
 * Manage configuration and profiles
 */
export function createConfigCommand(): Command {
  const command = new Command('config');
  command.description('Manage configuration and profiles');

  // Add profile subcommand
  command
    .command('add')
    .description('Add a new LLM profile')
    .action(async () => {
      try {
        const answers = await inquirer.prompt<{
          name: string;
          provider: 'openai' | 'gemini' | 'deepseek';
          model: string;
          apiKey: string;
          temperature: number;
          maxTokens: number;
        }>([
          {
            type: 'input',
            name: 'name',
            message: 'Profile name:',
            validate: (input: string) => input.length > 0 || 'Name is required',
          },
          {
            type: 'list',
            name: 'provider',
            message: 'LLM Provider:',
            choices: [
              { name: 'OpenAI (GPT-4o, GPT-4o-mini)', value: 'openai' },
              { name: 'Google Gemini (2.0 Flash, 1.5 Pro)', value: 'gemini' },
              { name: 'DeepSeek (Chat, Coder)', value: 'deepseek' },
            ],
          },
          {
            type: 'input',
            name: 'model',
            message: 'Model name:',
            default: (answers: any) => {
              const defaults: Record<string, string> = {
                openai: 'gpt-4o-mini',
                gemini: 'gemini-2.0-flash-exp',
                deepseek: 'deepseek-chat',
              };
              return defaults[answers.provider] || 'gpt-4o-mini';
            },
          },
          {
            type: 'password',
            name: 'apiKey',
            message: 'API Key:',
            mask: '*',
            validate: (input: string) => input.length > 0 || 'API Key is required',
          },
          {
            type: 'number',
            name: 'temperature',
            message: 'Temperature (0-1):',
            default: 0.7,
            validate: (input: number) => 
              (input >= 0 && input <= 1) || 'Must be between 0 and 1',
          },
          {
            type: 'number',
            name: 'maxTokens',
            message: 'Max tokens:',
            default: 4096,
            validate: (input: number) => input > 0 || 'Must be greater than 0',
          },
        ] as any); // Type assertion to work around inquirer v10 typing issues

        const profile: LLMProfile = {
          name: answers.name,
          provider: answers.provider,
          model: answers.model,
          apiKey: answers.apiKey,
          temperature: answers.temperature,
          maxTokens: answers.maxTokens,
        };

        await configManager.addProfile(profile);
        logger.success(`Profile '${answers.name}' added successfully`);
        
        const config = await configManager.load();
        if (config.profiles.length === 1) {
          logger.info(`Set as default profile`);
        }
      } catch (error: any) {
        if (error.message) {
          logger.error(`Failed to add profile: ${error.message}`);
        } else {
          logger.error('Failed to add profile');
        }
        process.exit(1);
      }
    });

  // List profiles subcommand
  command
    .command('list')
    .description('List all profiles')
    .action(async () => {
      try {
        const profiles = await configManager.listProfiles();
        const config = await configManager.load();

        if (profiles.length === 0) {
          logger.warning('No profiles configured');
          console.log('\nRun: report-cli config add\n');
          return;
        }

        logger.section('Configured Profiles:');
        profiles.forEach((profile) => {
          const isDefault = profile.name === config.defaultProfile;
          const marker = isDefault ? '* ' : '  ';
          console.log(
            `${marker}${profile.name} (${profile.provider}/${profile.model})`
          );
        });
        console.log('');
      } catch (error: any) {
        logger.error('Failed to list profiles');
        console.error(error);
        process.exit(1);
      }
    });

  // Show profile details
  command
    .command('show [name]')
    .description('Show profile details (default if not specified)')
    .action(async (name?: string) => {
      try {
        const profile = await configManager.getProfile(name);
        
        if (!profile) {
          if (name) {
            logger.error(`Profile '${name}' not found`);
          } else {
            logger.warning('No default profile set');
            console.log('\nRun: report-cli config add\n');
          }
          process.exit(1);
        }

        logger.section(`Profile: ${profile.name}`);
        console.log(`  Provider:    ${profile.provider}`);
        console.log(`  Model:       ${profile.model}`);
        console.log(`  API Key:     ${profile.apiKey.slice(0, 10)}...`);
        console.log(`  Temperature: ${profile.temperature ?? 0.7}`);
        console.log(`  Max Tokens:  ${profile.maxTokens ?? 4096}`);
        console.log('');
      } catch (error: any) {
        logger.error('Failed to show profile');
        console.error(error);
        process.exit(1);
      }
    });

  // Remove profile subcommand
  command
    .command('remove <name>')
    .description('Remove a profile')
    .action(async (name: string) => {
      try {
        await configManager.removeProfile(name);
        logger.success(`Profile '${name}' removed`);
      } catch (error: any) {
        logger.error(`Failed to remove profile '${name}': ${error.message}`);
        process.exit(1);
      }
    });

  // Set default profile subcommand
  command
    .command('default <name>')
    .description('Set default profile')
    .action(async (name: string) => {
      try {
        await configManager.setDefaultProfile(name);
        logger.success(`Default profile set to '${name}'`);
      } catch (error: any) {
        logger.error(`Failed to set default profile: ${error.message}`);
        process.exit(1);
      }
    });

  // Show config path
  command
    .command('path')
    .description('Show configuration file path')
    .action(() => {
      const configPath = configManager.getConfigPath();
      logger.info(`Configuration file: ${configPath}`);
    });

  // Edit directories
  command
    .command('set-plugins-dir <dir>')
    .description('Set plugins directory')
    .action(async (dir: string) => {
      try {
        await configManager.setPluginsDir(dir);
        logger.success(`Plugins directory set to: ${dir}`);
      } catch (error: any) {
        logger.error('Failed to set plugins directory');
        process.exit(1);
      }
    });

  command
    .command('set-output-dir <dir>')
    .description('Set output directory')
    .action(async (dir: string) => {
      try {
        await configManager.setOutputDir(dir);
        logger.success(`Output directory set to: ${dir}`);
      } catch (error: any) {
        logger.error('Failed to set output directory');
        process.exit(1);
      }
    });

  return command;
}
