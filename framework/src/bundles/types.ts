/**
 * Core Bundle structure for data exchange
 */
export interface Bundle {
  datasetName: string;
  samples: {
    main: Record<string, any>[];
  };
  stats: Record<string, any>;
  metadata: {
    totalRecords: number;
    ingestedAt: string;
    source: string;
    pluginId?: string;
    [key: string]: any;
  };
}

export interface BundleValidationResult {
  valid: boolean;
  errors?: string[];
}
