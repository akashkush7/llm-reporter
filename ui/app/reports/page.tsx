"use client";

import { useState, useEffect } from "react";
import { reportAPI } from "@/lib/api/client";
import {
  FileText,
  Download,
  Calendar,
  HardDrive,
  Eye,
  Sparkles,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  format: string;
  size: number;
  createdAt: string;
  path: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [content, setContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportAPI.list();
      setReports(data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (report: Report) => {
    setSelectedReport(report);
    setLoadingContent(true);

    if (report.format === "pdf") {
      window.open(report.path, "_blank");
      setLoadingContent(false);
      return;
    }

    try {
      const text = await reportAPI.getContent(report.name);
      setContent(text);
    } catch (error) {
      console.error("Failed to load report content:", error);
    } finally {
      setLoadingContent(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case "html":
        return "from-blue-100 to-cyan-100 text-blue-700 border-blue-200";
      case "pdf":
        return "from-red-100 to-pink-100 text-red-700 border-red-200";
      case "md":
        return "from-purple-100 to-indigo-100 text-purple-700 border-purple-200";
      default:
        return "from-gray-100 to-slate-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Reports Library</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Browse and view your generated reports ({reports.length} total)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Available Reports
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {reports.length} reports
                </p>
              </div>

              <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
                {reports.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      No reports found
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Generate your first report to see it here
                    </p>
                  </div>
                ) : (
                  reports.map((report, idx) => (
                    <button
                      key={report.id}
                      onClick={() => viewReport(report)}
                      className={`w-full p-4 text-left hover:bg-blue-50 transition-all duration-200 group animate-fade-in ${
                        selectedReport?.id === report.id
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {report.name}
                          </p>
                        </div>
                        <span
                          className={`ml-2 shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-linear-to-r ${getFormatColor(
                            report.format
                          )} border`}
                        >
                          {report.format.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(report.size)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Report Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {selectedReport ? (
                <>
                  <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          {selectedReport.name}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(selectedReport.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-4 h-4" />
                            {formatFileSize(selectedReport.size)}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-linear-to-r ${getFormatColor(
                              selectedReport.format
                            )} border`}
                          >
                            {selectedReport.format.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="inline-flex items-center gap-2 p-2.5 hover:bg-blue-100 rounded-lg transition-colors border border-gray-300"
                          title={
                            isFullscreen ? "Exit fullscreen" : "Fullscreen"
                          }
                        >
                          {isFullscreen ? (
                            <Minimize2 className="w-5 h-5 text-gray-700" />
                          ) : (
                            <Maximize2 className="w-5 h-5 text-gray-700" />
                          )}
                        </button>
                        <a
                          href={selectedReport.path}
                          download={selectedReport.name}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>

                  {isFullscreen ? (
                    // Fullscreen Mode
                    <div className="fixed inset-0 z-50 bg-gray-900">
                      {/* Fullscreen Header */}
                      <div className="absolute top-0 left-0 right-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-xl z-10">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5" />
                            <h3 className="font-bold text-lg">
                              {selectedReport.name}
                            </h3>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 border border-white/30">
                              {selectedReport.format.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsFullscreen(false)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all border border-white/30"
                              title="Exit fullscreen"
                            >
                              <Minimize2 className="w-5 h-5" />
                              <span className="hidden sm:inline">
                                Exit Fullscreen
                              </span>
                            </button>
                            <a
                              href={selectedReport.path}
                              download={selectedReport.name}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all shadow-lg font-semibold"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">Download</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="w-full h-full overflow-auto pt-20 p-8">
                        {loadingContent ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                          </div>
                        ) : selectedReport.format === "html" ? (
                          <iframe
                            srcDoc={content}
                            className="w-full h-full border-0 bg-white rounded-lg shadow-2xl"
                            title={selectedReport.name}
                          />
                        ) : selectedReport.format === "md" ? (
                          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-5xl mx-auto">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                              {content}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    // Normal View
                    <div className="p-6">
                      {loadingContent ? (
                        <div className="flex items-center justify-center py-32">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      ) : selectedReport.format === "html" ? (
                        <iframe
                          srcDoc={content}
                          className="w-full h-[calc(100vh-400px)] border-2 border-gray-200 rounded-xl shadow-inner"
                          title={selectedReport.name}
                        />
                      ) : selectedReport.format === "md" ? (
                        <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 max-h-[calc(100vh-400px)] overflow-auto">
                          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                            {content}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-24">
                          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="w-10 h-10 text-blue-600" />
                          </div>
                          <p className="text-gray-700 text-lg font-medium mb-4">
                            PDF opened in new tab
                          </p>
                          <a
                            href={selectedReport.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            Open PDF again
                            <svg
                              className="w-5 h-5"
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
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-24 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Select a report to view
                  </h3>
                  <p className="text-gray-600">
                    Choose a report from the list to preview its contents
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
