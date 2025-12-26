import fs from "fs/promises";
import path from "path";
import os from "os";
import { LLMConfig } from "@aganitha/report-framework";

export interface LLMProfile {
  name: string;
  provider: "openai" | "gemini" | "deepseek";
  model: string;
  apiKey: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AppConfig {
  defaultProfile: string;
  profiles: LLMProfile[];
  pluginsDir: string;
  outputDir: string;
}

const DEFAULT_CONFIG: AppConfig = {
  defaultProfile: "",
  profiles: [],
  pluginsDir: "/shared/report-framework/plugins",
  outputDir: "/shared/report-framework/reports",
};

class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), ".aganitha");
    this.configPath = path.join(this.configDir, "config.json");
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getConfigDir(): string {
    return this.configDir;
  }

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async load(): Promise<AppConfig> {
    await this.ensureConfigDir();

    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      const loaded = JSON.parse(content);
      return { ...DEFAULT_CONFIG, ...loaded };
    } catch (error) {
      // Config file doesn't exist yet
      return DEFAULT_CONFIG;
    }
  }

  async save(config: AppConfig): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(
      this.configPath,
      JSON.stringify(config, null, 2),
      "utf-8"
    );
  }

  async addProfile(profile: LLMProfile): Promise<void> {
    const config = await this.load();

    // Check if profile already exists
    const existingIndex = config.profiles.findIndex(
      (p) => p.name === profile.name
    );

    if (existingIndex >= 0) {
      // Update existing profile
      config.profiles[existingIndex] = profile;
    } else {
      // Add new profile
      config.profiles.push(profile);
    }

    // Set as default if it's the first profile
    if (config.profiles.length === 1) {
      config.defaultProfile = profile.name;
    }

    await this.save(config);
  }

  async removeProfile(name: string): Promise<void> {
    const config = await this.load();

    const index = config.profiles.findIndex((p) => p.name === name);
    if (index === -1) {
      throw new Error(`Profile '${name}' not found`);
    }

    config.profiles.splice(index, 1);

    // Update default if removed
    if (config.defaultProfile === name) {
      config.defaultProfile =
        config.profiles.length > 0 ? config.profiles[0].name : "";
    }

    await this.save(config);
  }

  async listProfiles(): Promise<LLMProfile[]> {
    const config = await this.load();
    return config.profiles;
  }

  async getProfile(name?: string): Promise<LLMProfile | null> {
    const config = await this.load();

    const profileName = name || config.defaultProfile;
    if (!profileName) {
      return null;
    }

    const profile = config.profiles.find((p) => p.name === profileName);
    return profile || null;
  }

  async getDefaultProfile(): Promise<LLMProfile | null> {
    const config = await this.load();
    if (!config.defaultProfile) {
      return null;
    }
    return this.getProfile(config.defaultProfile);
  }

  async setDefaultProfile(name: string): Promise<void> {
    const config = await this.load();

    const profile = config.profiles.find((p) => p.name === name);
    if (!profile) {
      throw new Error(`Profile '${name}' not found`);
    }

    config.defaultProfile = name;
    await this.save(config);
  }

  async getLLMConfig(profileName?: string): Promise<LLMConfig | null> {
    const profile = await this.getProfile(profileName);
    if (!profile) {
      return null;
    }

    return {
      provider: profile.provider,
      model: profile.model,
      apiKey: profile.apiKey,
      baseURL: profile.baseURL,
      temperature: profile.temperature ?? 0.7,
      maxTokens: profile.maxTokens ?? 4096,
      topP: profile.topP ?? 1,
    };
  }

  async getPluginsDir(): Promise<string> {
    const config = await this.load();
    return config.pluginsDir;
  }

  async getOutputDir(): Promise<string> {
    const config = await this.load();
    return config.outputDir;
  }

  async setPluginsDir(dir: string): Promise<void> {
    const config = await this.load();
    config.pluginsDir = dir;
    await this.save(config);
  }

  async setOutputDir(dir: string): Promise<void> {
    const config = await this.load();
    config.outputDir = dir;
    await this.save(config);
  }

  async getDefaultProfileName(): Promise<string | null> {
    const config = await this.load();
    return config.defaultProfile || null;
  }
}

export const configManager = new ConfigManager();
