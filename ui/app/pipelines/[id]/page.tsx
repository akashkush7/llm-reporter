"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  FileText,
  Loader2,
  ChevronLeft,
  Sparkles,
  Upload,
  Settings,
  Zap,
  CheckCircle2,
  File,
  X,
} from "lucide-react";

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const [pipeline, setPipeline] = useState<any>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [reportName, setReportName] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/pipelines/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPipeline(data);
        setOutputFormat(data.outputFormats[0] || "html");
      })
      .catch((err) => setError(err.message));
  }, [params.id]);

  const handleFileChange = (inputName: string, file: File | null) => {
    setFiles({ ...files, [inputName]: file });
  };

  const removeFile = (inputName: string) => {
    setFiles({ ...files, [inputName]: null });
  };

  if (!pipeline)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading pipeline...</p>
        </div>
      </div>
    );

  async function runPipeline(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare form data for file uploads
      const formData = new FormData();

      // Add pipeline metadata
      formData.append("pipelineId", params.id as string);
      formData.append("reportType", "regular");
      formData.append("outputFormat", outputFormat);
      formData.append("priority", "5");

      // Add text inputs
      const textInputs: Record<string, any> = {};
      Object.entries(inputs).forEach(([key, value]) => {
        textInputs[key] = value;
      });

      // Upload files first if any
      const fileInputs: Record<string, string> = {};
      for (const [inputName, file] of Object.entries(files)) {
        if (file) {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: fileFormData,
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const uploadData = await uploadRes.json();
          fileInputs[inputName] = uploadData.path || uploadData.url;
        }
      }

      // Merge text inputs and file paths
      const allInputs = { ...textInputs, ...fileInputs };

      // Submit job
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: params.id,
          inputs: allInputs,
          reportType: "regular",
          outputFormat,
          priority: 5,
          reportName: reportName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit job");
      }

      router.push(`/jobs/${data.jobId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/pipelines"
            className="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-6 group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Pipelines
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {pipeline.name}
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Version {pipeline.version}
                  </p>
                </div>
              </div>
              <p className="text-blue-50 text-lg max-w-2xl">
                {pipeline.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-lg animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error submitting job
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={runPipeline} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                Report Name
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Optional: Give your report a custom name
              </p>
            </div>

            <div className="p-6">
              <input
                type="text"
                placeholder={`Default: ${pipeline.name}`}
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave blank to use pipeline name. Timestamp will be added
                automatically.
              </p>
            </div>
          </div>
          {/* Inputs Section */}
          {pipeline.inputs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                  Data Inputs
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure the input parameters for your report
                </p>
              </div>

              <div className="p-6 space-y-6">
                {pipeline.inputs.map((input: any, idx: number) => (
                  <div
                    key={input.name}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <label className="block mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {input.label || input.name}
                        {input.required && (
                          <span className="text-red-600 ml-1">*</span>
                        )}
                        {!input.required && (
                          <span className="text-gray-500 text-xs font-normal ml-2">
                            (optional)
                          </span>
                        )}
                      </span>
                      {input.description && (
                        <span className="block text-xs text-gray-600 mt-1">
                          {input.description}
                        </span>
                      )}
                    </label>

                    {input.type === "file" ? (
                      // File Upload Input
                      <div>
                        {!files[input.name] ? (
                          <div className="relative">
                            <input
                              type="file"
                              id={`file-${input.name}`}
                              onChange={(e) =>
                                handleFileChange(
                                  input.name,
                                  e.target.files?.[0] || null
                                )
                              }
                              required={input.required}
                              accept={input.accept || "*"}
                              className="hidden"
                            />
                            <label
                              htmlFor={`file-${input.name}`}
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 font-medium">
                                Click to upload file
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {input.accept || "Any file type"}
                              </p>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <File className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {files[input.name]?.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatFileSize(files[input.name]?.size || 0)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(input.name)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove file"
                            >
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : input.type === "enum" || input.choices ? (
                      <select
                        value={inputs[input.name] || ""}
                        onChange={(e) =>
                          setInputs({ ...inputs, [input.name]: e.target.value })
                        }
                        required={input.required}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white"
                      >
                        <option value="">
                          {input.required
                            ? "Select an option..."
                            : "Select (optional)"}
                        </option>
                        {(input.choices || input.options || []).map(
                          (opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          )
                        )}
                      </select>
                    ) : input.type === "number" ? (
                      <input
                        type="number"
                        placeholder="Enter number"
                        value={inputs[input.name] || input.default || ""}
                        onChange={(e) =>
                          setInputs({ ...inputs, [input.name]: e.target.value })
                        }
                        required={input.required}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter text"
                        value={inputs[input.name] || ""}
                        onChange={(e) =>
                          setInputs({ ...inputs, [input.name]: e.target.value })
                        }
                        required={input.required}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      />
                    )}

                    {input.default !== undefined && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        Default: {input.default}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Format Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Output Format
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose how you want your report generated
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pipeline.outputFormats.map((format: string) => (
                  <label
                    key={format}
                    className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      outputFormat === format
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="outputFormat"
                      value={format}
                      checked={outputFormat === format}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      {outputFormat === format && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      )}
                      <span className="text-sm font-bold uppercase text-gray-900">
                        {format}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-bold text-white rounded-xl group bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Job...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Generate Report
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Your report will be queued and processed automatically
          </p>
        </form>
      </div>
    </div>
  );
}
