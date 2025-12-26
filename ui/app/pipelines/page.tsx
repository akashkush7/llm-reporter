import Link from "next/link";
import { Package } from "lucide-react";
import { getPipelines } from "@/lib/plugin-manager";

// ✅ Force dynamic rendering and disable all caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PipelinesPage() {
  // ✅ Call plugin-manager directly to reload plugins
  const pipelines = await getPipelines();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Pipelines</h1>
          </div>
          <p className="text-blue-100 text-lg">
            {pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""}{" "}
            available to generate reports
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!pipelines || pipelines.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No pipelines available
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              Add pipeline files to your configured plugins directory to get
              started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pipelines.map((pipeline: any, idx: number) => (
              <Link
                key={pipeline.id}
                href={`/pipelines/${pipeline.id}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden h-full">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {pipeline.name}
                        </h3>
                        <span className="inline-block text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          v{pipeline.version}
                        </span>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>

                    <p className="text-gray-600 text-base leading-relaxed mb-6">
                      {pipeline.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-4">
                      {pipeline.inputs && pipeline.inputs.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Inputs ({pipeline.inputs.length})
                          </p>
                          <p className="text-sm text-gray-700 font-medium">
                            {pipeline.inputs
                              .map((i: any) => i.label || i.name)
                              .join(" • ")}
                          </p>
                        </div>
                      )}

                      {pipeline.outputFormats &&
                        pipeline.outputFormats.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Output Formats
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {pipeline.outputFormats.map((format: string) => (
                                <span
                                  key={format}
                                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                                >
                                  {format.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* CTA */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <span className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 group-hover:translate-x-1 transition-all">
                        Run Pipeline
                        <svg
                          className="w-5 h-5 ml-2"
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
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
