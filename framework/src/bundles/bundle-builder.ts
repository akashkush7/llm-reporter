import { Bundle } from "./types.js";

export class BundleBuilder {
  private bundle: Partial<Bundle> = {
    samples: { main: [] },
    stats: {},
    metadata: {
      totalRecords: 0,
      ingestedAt: new Date().toISOString(),
      source: "unknown",
    },
  };

  setDatasetName(name: string): this {
    this.bundle.datasetName = name;
    return this;
  }

  addSample(sample: Record<string, any>): this {
    this.bundle.samples!.main.push(sample);
    return this;
  }

  addSamples(samples: Record<string, any>[]): this {
    this.bundle.samples!.main.push(...samples);
    return this;
  }

  setStat(key: string, value: any): this {
    this.bundle.stats![key] = value;
    return this;
  }

  setStats(stats: Record<string, any>): this {
    this.bundle.stats = { ...this.bundle.stats, ...stats };
    return this;
  }

  setMetadata(metadata: Partial<Bundle["metadata"]>): this {
    this.bundle.metadata = { ...this.bundle.metadata!, ...metadata };
    return this;
  }

  build(): Bundle {
    if (!this.bundle.datasetName) {
      throw new Error("Bundle must have a datasetName");
    }
    
    this.bundle.metadata!.totalRecords = this.bundle.samples!.main.length;
    return this.bundle as Bundle;
  }
}
