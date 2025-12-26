import fs from 'fs';
import path from 'path';
import { Bundle, BundleValidationResult } from './types.js';

export class BundleLoader {
  static loadFromFile(filePath: string): Bundle {
    const content = fs.readFileSync(filePath, 'utf-8');
    const bundle = JSON.parse(content) as Bundle;
    
    const validation = this.validate(bundle);
    if (!validation.valid) {
      throw new Error(`Invalid bundle: ${validation.errors?.join(', ')}`);
    }
    
    return bundle;
  }

  static validate(bundle: any): BundleValidationResult {
    const errors: string[] = [];

    if (!bundle.datasetName) errors.push('Missing datasetName');
    if (!bundle.samples?.main) errors.push('Missing samples.main');
    if (!bundle.stats) errors.push('Missing stats');
    if (!bundle.metadata) errors.push('Missing metadata');

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  static saveToFile(bundle: Bundle, filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2));
  }
}
