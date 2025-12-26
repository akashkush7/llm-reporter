"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  Loader2,
  Trash2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface Job {
  id: string;
  data: {
    pipelineId: string;
    reportType: string;
    outputFormat: string;
  };
  status: string;
  progress: {
    percentage: number;
    message?: string;
  };
  createdAt: number;
  finishedOn?: number;
}

interface JobCounts {
  completed: number;
  failed: number;
  active: number;
  delayed: number;
  waiting: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<JobCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<any>(null);

  useEffect(() => {
    loadJobs();
    loadCounts();

    const interval = setInterval(() => {
      loadJobs();
      loadCounts();
    }, 5000);

    return () => clearInterval(interval);
  }, [filter]);

  const loadJobs = async () => {
    try {
      const url = filter === "all" ? "/api/jobs" : `/api/jobs?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const response = await fetch("/api/jobs/clean");
      const data = await response.json();
      setCounts(data.counts);
    } catch (error) {
      console.error("Failed to load counts:", error);
    }
  };

  const cleanJobs = async (action: string, params: any = {}) => {
    const confirmMessages: Record<string, string> = {
      "clean-completed": `Clean all completed jobs older than ${
        params.hoursOld || 24
      } hours?`,
      "clean-failed": `Clean all failed jobs older than ${
        params.daysOld || 7
      } days?`,
      obliterate: "⚠️ DELETE ALL JOBS? This cannot be undone!",
    };

    if (!confirm(confirmMessages[action])) return;

    setCleaning(true);
    setCleanResult(null);

    try {
      const response = await fetch("/api/jobs/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });

      const result = await response.json();

      if (response.ok) {
        setCleanResult(result);
        await loadJobs();
        await loadCounts();
        setTimeout(() => setCleanResult(null), 5000);
      } else {
        alert(`❌ Failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-gradient-to-r from-green-100 to-emerald-100",
          text: "text-green-700",
          border: "border-green-200",
          icon: CheckCircle,
        };
      case "active":
        return {
          bg: "bg-gradient-to-r from-blue-100 to-cyan-100",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: Hourglass,
        };
      case "waiting":
        return {
          bg: "bg-gradient-to-r from-yellow-100 to-orange-100",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: Clock,
        };
      case "failed":
        return {
          bg: "bg-gradient-to-r from-red-100 to-pink-100",
          text: "text-red-700",
          border: "border-red-200",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: AlertCircle,
        };
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Report Jobs</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Monitor and manage your report generation jobs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {counts && (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-yellow-100">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <span className="text-3xl font-bold text-gray-900">
                    {counts.waiting}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600">Waiting</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <Hourglass className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold text-gray-900">
                    {counts.active}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600">Active</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold text-gray-900">
                    {counts.completed}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <span className="text-3xl font-bold text-gray-900">
                    {counts.failed}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-8 h-8 text-purple-500" />
                  <span className="text-3xl font-bold text-gray-900">
                    {counts.delayed}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600">Delayed</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {["all", "waiting", "active", "completed", "failed"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      filter === status
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Cleanup Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => cleanJobs("clean-completed", { hoursOld: 24 })}
                disabled={cleaning || !counts || counts.completed === 0}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
                title="Clean completed jobs older than 24 hours"
              >
                <Sparkles className="w-4 h-4" />
                Clean Completed
                {counts && counts.completed > 0 && (
                  <span className="bg-green-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.completed}
                  </span>
                )}
              </button>

              <button
                onClick={() => cleanJobs("clean-failed", { daysOld: 7 })}
                disabled={cleaning || !counts || counts.failed === 0}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
                title="Clean failed jobs older than 7 days"
              >
                <Sparkles className="w-4 h-4" />
                Clean Failed
                {counts && counts.failed > 0 && (
                  <span className="bg-orange-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.failed}
                  </span>
                )}
              </button>

              <button
                onClick={() => cleanJobs("obliterate", { force: true })}
                disabled={cleaning}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
                title="⚠️ Delete ALL jobs"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Result Messages */}
        {cleanResult && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 flex items-start gap-4 shadow-lg animate-fade-in">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-green-900 text-lg">
                {cleanResult.action === "obliterate"
                  ? "All jobs deleted successfully!"
                  : `Cleaned ${
                      cleanResult.deletedCount
                    } ${cleanResult.action.replace("clean-", "")} jobs`}
              </p>
              {cleanResult.hoursOld && (
                <p className="text-sm text-green-700 mt-1">
                  Removed jobs older than {cleanResult.hoursOld} hours
                </p>
              )}
              {cleanResult.daysOld && (
                <p className="text-sm text-green-700 mt-1">
                  Removed jobs older than {cleanResult.daysOld} days
                </p>
              )}
            </div>
          </div>
        )}

        {cleaning && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-blue-900 font-semibold text-lg">
              Cleaning jobs...
            </p>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {filter === "all" ? "No jobs found" : `No ${filter} jobs`}
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              Start generating reports to see jobs here
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              Create a Report →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job, idx) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 ${statusConfig.bg} rounded-xl border ${statusConfig.border}`}
                        >
                          <StatusIcon
                            className={`w-6 h-6 ${statusConfig.text} ${
                              job.status === "active" ? "animate-spin" : ""
                            }`}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {job.data.pipelineId}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                            >
                              {job.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="font-mono">
                              ID: {job.id.substring(0, 12)}...
                            </span>
                            <span>•</span>
                            <span>
                              Format:{" "}
                              <span className="font-semibold">
                                {job.data.outputFormat.toUpperCase()}
                              </span>
                            </span>
                            <span>•</span>
                            <span>{formatDate(job.createdAt)}</span>
                          </div>

                          {/* Progress Bar */}
                          {job.status === "active" && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {job.progress?.message || "Processing..."}
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                  {job.progress?.percentage || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${job.progress?.percentage || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center px-4 py-2 rounded-xl font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200"
                      >
                        View Details
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
