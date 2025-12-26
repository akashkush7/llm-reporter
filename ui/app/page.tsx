import Link from "next/link";
import {
  FileText,
  Zap,
  TrendingUp,
  Package,
  Sparkles,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import { getPipelines as getPluginPipelines } from "@/lib/plugin-manager";

// ✅ Force dynamic rendering and disable all caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ✅ Call plugin-manager directly to reload plugins
async function getPipelines() {
  try {
    return await getPluginPipelines();
  } catch (err) {
    console.error("Error fetching pipelines:", err);
    return [];
  }
}

async function getReportsCount() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/reports`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("Failed to fetch reports");
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error("Error fetching reports:", err);
    return 0;
  }
}

async function getJobStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/jobs/clean`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("Failed to fetch job stats");
    const data = await res.json();

    const total = data.counts.completed + data.counts.failed;
    const successRate =
      total > 0 ? Math.round((data.counts.completed / total) * 100) : 100;

    return {
      completed: data.counts.completed,
      failed: data.counts.failed,
      successRate: successRate,
    };
  } catch (err) {
    console.error("Error fetching job stats:", err);
    return { completed: 0, failed: 0, successRate: 100 };
  }
}

export default async function HomePage() {
  const [pipelines, reportsCount, jobStats] = await Promise.all([
    getPipelines(),
    getReportsCount(),
    getJobStats(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Reports
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            LLM Reporter
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-medium">
            Transform your data into beautiful, AI-powered reports with
            automated pipelines
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/pipelines"
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
            >
              <Package className="w-5 h-5 mr-2" />
              View Pipelines
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-indigo-600 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FileText className="w-5 h-5 mr-2" />
              Browse Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Pipelines
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pipelines.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Reports Generated
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {reportsCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Success Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {jobStats.successRate}%
                </p>
                {jobStats.completed > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {jobStats.completed} completed, {jobStats.failed} failed
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to create professional reports powered by AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI-Powered Generation */}
          <div className="group animate-fade-in bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                AI-Powered Generation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Leverage advanced LLMs to generate insightful, contextual
                reports automatically from your data
              </p>
            </div>
          </div>

          {/* Multiple Formats */}
          <div
            className="group animate-fade-in bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
            style={{ animationDelay: "100ms" }}
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Multiple Formats
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Export reports in HTML, PDF, or Markdown formats to suit your
                workflow and distribution needs
              </p>
            </div>
          </div>

          {/* Automated Pipelines */}
          <div
            className="group animate-fade-in bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
            style={{ animationDelay: "200ms" }}
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Automated Pipelines
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Set up custom pipelines that automatically process data and
                generate reports on schedule
              </p>
            </div>
          </div>

          {/* Real-time Processing */}
          <div
            className="group animate-fade-in bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
            style={{ animationDelay: "300ms" }}
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Real-time Processing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track job status in real-time with detailed progress updates and
                instant notifications
              </p>
            </div>
          </div>

          {/* Secure & Reliable */}
          <div
            className="group animate-fade-in bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
            style={{ animationDelay: "400ms" }}
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Enterprise-grade security with reliable job processing and
                automatic error handling
              </p>
            </div>
          </div>

          {/* Customizable Templates */}
          <div
            className="group animate-fade-in bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
            style={{ animationDelay: "500ms" }}
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Custom Templates
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Create and manage custom report templates with flexible styling
                and branding options
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Explore our pipelines and start generating AI-powered reports in
              minutes
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pipelines"
                className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-indigo-600 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Package className="w-5 h-5 mr-2" />
                Browse Pipelines
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
