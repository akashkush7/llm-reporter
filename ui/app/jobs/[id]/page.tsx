"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Play,
  AlertTriangle,
  Download,
  FileText,
  BarChart3,
  Calendar,
  Package,
  RefreshCw,
  StopCircle,
  Eye,
} from "lucide-react";

interface JobDetail {
  id: string;
  name: string;
  data: {
    pipelineId: string;
    reportType: string;
    outputFormat: string;
    inputs: Record<string, any>;
    profileName?: string;
  };
  progress: {
    percentage: number;
    step?: string;
    message?: string;
  };
  status: string;
  result?: {
    outputPath: string;
    fileName: string;
    fileSize: number;
    duration: number;
    generatedAt: string;
  };
  failedReason?: string;
  createdAt: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade: number;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!params.id) return;

    loadJob();

    const interval = setInterval(() => {
      if (job?.status === "active" || job?.status === "waiting") {
        loadJob();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [params.id, job?.status]);

  const loadJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Job not found");
        } else {
          throw new Error("Failed to load job");
        }
        return;
      }

      const data = await response.json();
      setJob(data);
      setError("");
    } catch (err: any) {
      console.error("Error loading job:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this job?")) return;

    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Job cancelled successfully");
        router.push("/jobs");
      } else {
        alert("Failed to cancel job");
      }
    } catch (err) {
      console.error("Error cancelling job:", err);
      alert("Failed to cancel job");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "from-green-500 to-emerald-500",
          icon: CheckCircle,
          text: "Completed",
          badge: "bg-green-100 text-green-800 border-green-200",
        };
      case "active":
        return {
          bg: "from-blue-500 to-cyan-500",
          icon: Loader2,
          text: "In Progress",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "waiting":
        return {
          bg: "from-yellow-500 to-orange-500",
          icon: Clock,
          text: "Waiting",
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "failed":
        return {
          bg: "from-red-500 to-pink-500",
          icon: XCircle,
          text: "Failed",
          badge: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          bg: "from-gray-500 to-slate-500",
          icon: AlertTriangle,
          text: status,
          badge: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-red-200">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {error || "Job not found"}
            </h2>
            <p className="text-gray-600 mb-8">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(job.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${statusConfig.bg} text-white py-8 px-4`}
      >
        <div className="max-w-7xl mx-auto">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <StatusIcon
                  className={`w-8 h-8 ${
                    job.status === "active" ? "animate-spin" : ""
                  }`}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Job Details</h1>
                <p className="text-white/90 font-mono text-sm">ID: {job.id}</p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-xl border-2 font-bold ${statusConfig.badge}`}
            >
              {statusConfig.text}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Progress</h2>
            <span className="text-2xl font-bold text-blue-600">
              {job.progress?.percentage || 0}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-6 rounded-full transition-all duration-500 flex items-center justify-center text-sm text-white font-bold shadow-lg"
              style={{ width: `${job.progress?.percentage || 0}%` }}
            >
              {job.progress?.percentage > 15 && `${job.progress?.percentage}%`}
            </div>
          </div>

          {job.progress?.message && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              {job.progress?.percentage !== 100 ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-blue-900 font-medium">
                {job.progress.message}
              </p>
            </div>
          )}

          {job.progress?.step && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                Current Step:
              </span>
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-200">
                {job.progress.step}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Job Information Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Job Information
            </h2>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Pipeline
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {job.data.pipelineId}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Report Type
                </p>
                <p className="text-base text-gray-700">{job.data.reportType}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Output Format
                </p>
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg font-bold text-sm border border-green-200">
                  {job.data.outputFormat.toUpperCase()}
                </span>
              </div>

              {job.data.profileName && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    LLM Profile
                  </p>
                  <p className="text-base text-gray-700">
                    {job.data.profileName}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Attempts
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((attempt) => (
                      <div
                        key={attempt}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          attempt <= job.attemptsMade
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {attempt}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {job.attemptsMade} of 3
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Timeline
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Created At
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(job.createdAt)}
                  </p>
                </div>
              </div>

              {job.processedOn && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Started At
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(job.processedOn)}
                    </p>
                  </div>
                </div>
              )}

              {job.finishedOn && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 ${
                      job.status === "completed" ? "bg-green-100" : "bg-red-100"
                    } rounded-lg`}
                  >
                    {job.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Finished At
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(job.finishedOn)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Parameters Card */}
        {Object.keys(job.data.inputs).length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Input Parameters
            </h2>
            <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 max-h-96 overflow-y-auto">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(job.data.inputs, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Success Result Card */}
        {job.status === "completed" && job.result && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">
                  Report Generated Successfully!
                </h2>
                <p className="text-green-700">
                  Your report is ready to download
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-600">
                    File Name
                  </p>
                </div>
                <p className="font-bold text-gray-900 break-all text-sm">
                  {job.result.fileName}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Download className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-600">
                    File Size
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-lg">
                  {formatFileSize(job.result.fileSize)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-600">
                    Duration
                  </p>
                </div>
                <p className="font-bold text-gray-900 text-lg">
                  {formatDuration(job.result.duration)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/api/reports/${encodeURIComponent(job.result.fileName)}`}
                target="_blank"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <Eye className="w-5 h-5" />
                View Report
              </Link>
              <Link
                href={`/api/reports/${encodeURIComponent(
                  job.result.fileName
                )}?download=true`}
                className="inline-flex items-center gap-2 bg-white text-green-700 border-2 border-green-300 px-6 py-3 rounded-xl hover:bg-green-50 font-semibold transition-all"
              >
                <Download className="w-5 h-5" />
                Download
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all shadow-lg"
              >
                <FileText className="w-5 h-5" />
                All Reports
              </Link>
            </div>
          </div>
        )}

        {/* Error Card */}
        {job.status === "failed" && job.failedReason && (
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-xl p-8 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500 rounded-xl">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-900">Job Failed</h2>
                <p className="text-red-700">
                  An error occurred during execution
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-red-200 p-6 mb-6 max-h-64 overflow-y-auto">
              <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                {job.failedReason}
              </pre>
            </div>

            <button
              onClick={() => router.push(`/pipelines/${job.data.pipelineId}`)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold transition-all shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}

        {/* Action Buttons for Active/Waiting Jobs */}
        {(job.status === "waiting" || job.status === "active") && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold transition-all shadow-lg"
            >
              <StopCircle className="w-5 h-5" />
              Cancel Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
