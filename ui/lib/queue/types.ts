export interface ReportJobData {
  pipelineId: string;
  reportType: string;
  outputFormat: "html" | "pdf";
  inputs: Record<string, any>;
  profileName?: string;
  reportName?: string;
  userId?: string; // For future multi-user support
  metadata?: {
    userAgent?: string;
    requestedAt?: string;
  };
}

export interface ReportJobResult {
  outputPath: string;
  fileName: string;
  fileSize: number;
  duration: number; // milliseconds
  generatedAt: string;
}

export type JobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed";

export interface JobProgress {
  percentage: number; // 0-100
  step?: string;
  message?: string;
}

export interface JobInfo {
  id: string;
  name: string;
  data: ReportJobData;
  progress: JobProgress;
  status: JobStatus;
  result?: ReportJobResult;
  failedReason?: string;
  createdAt: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade: number;
}
