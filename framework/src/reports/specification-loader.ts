import fs from "fs/promises";
import yaml from "js-yaml";
import path from "path";
import { SpecificationConfig } from "../plugins/plugin-interface.js";
import { validateSpecification } from "./specification.js";

export class SpecificationLoader {
  static async loadFromFile(filePath: string): Promise<SpecificationConfig> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const spec = yaml.load(content) as SpecificationConfig;

      const validation = validateSpecification(spec);
      if (!validation.valid) {
        throw new Error(
          `Invalid specification: ${validation.errors?.join(", ")}`
        );
      }

      return spec;
    } catch (error) {
      throw new Error(
        `Failed to load specification from ${filePath}: ${error}`
      );
    }
  }

  static async loadFromPlugin(
    specificationsDir: string,
    specType: string = "report"
  ): Promise<SpecificationConfig> {
    const specPath = path.join(specificationsDir, `${specType}.yaml`);
    return this.loadFromFile(specPath);
  }

  static async saveToFile(
    spec: SpecificationConfig,
    filePath: string
  ): Promise<void> {
    try {
      const validation = validateSpecification(spec);
      if (!validation.valid) {
        throw new Error(
          `Invalid specification: ${validation.errors?.join(", ")}`
        );
      }

      const yamlContent = yaml.dump(spec, {
        indent: 2,
        lineWidth: -1,
      });

      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, yamlContent, "utf-8");
    } catch (error) {
      throw new Error(`Failed to save specification to ${filePath}: ${error}`);
    }
  }
}
