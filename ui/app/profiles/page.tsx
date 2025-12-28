"use client";

import { useState, useEffect } from "react";
import { LLMProfile } from "@/lib/config-manager";
import {
  UserCircle,
  Plus,
  Trash2,
  CheckCircle,
  Star,
  Settings,
  Zap,
  Loader2,
  X,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<LLMProfile[]>([]);
  const [defaultProfile, setDefaultProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch("/api/profiles");
      const data = await response.json();
      setProfiles(data.profiles || []);
      setDefaultProfile(data.defaultProfile);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete profile '${name}'?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${name}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadProfiles();
      } else {
        const error = await response.json();
        alert(`Failed to delete profile: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      alert("Failed to delete profile");
    }
  };

  const handleSetDefault = async (name: string) => {
    try {
      const response = await fetch("/api/profiles/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        await loadProfiles();
      } else {
        const error = await response.json();
        alert(`Failed to set default: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to set default profile:", error);
      alert("Failed to set default profile");
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return "from-green-100 to-emerald-100 text-green-700 border-green-200";
      case "gemini":
        return "from-blue-100 to-cyan-100 text-blue-700 border-blue-200";
      case "deepseek":
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
          <p className="text-gray-600 text-lg">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <UserCircle className="w-8 h-8" />
                <h1 className="text-4xl font-bold">LLM Profiles</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Manage your AI model configurations and API keys
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Profiles
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {profiles.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Default Profile
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {defaultProfile || "None"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Providers</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Set(profiles.map((p) => p.provider)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {profiles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No profiles configured
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              Create your first LLM profile to start generating reports
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Your First Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {profiles.map((profile, idx) => (
              <div
                key={profile.name}
                className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Default Badge */}
                {profile.name === defaultProfile && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 px-3 py-1 bg-linear-to-r from-yellow-100 to-orange-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                      <Star className="w-3 h-3 fill-yellow-500" />
                      Default
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-linear-to-br from-blue-100 to-indigo-100 rounded-xl">
                      <UserCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {profile.name}
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-bold bg-linear-to-r ${getProviderColor(
                          profile.provider
                        )} border`}
                      >
                        {profile.provider.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Model
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {profile.model}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Temperature
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {profile.temperature ?? 0.7}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Max Tokens
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {profile.maxTokens ?? 4096}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Top P
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {profile.topP ?? 1.0}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    {profile.name !== defaultProfile && (
                      <button
                        onClick={() => handleSetDefault(profile.name)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold text-sm shadow-lg"
                      >
                        <Star className="w-4 h-4" />
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(profile.name)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold text-sm shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <AddProfileModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadProfiles();
          }}
        />
      )}
    </div>
  );
}

function AddProfileModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    provider: "openai" as "openai" | "gemini" | "deepseek",
    model: "gpt-4o-mini",
    apiKey: "",
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const providerModels = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    gemini: ["gemini-2.5-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"],
    deepseek: ["deepseek-chat", "deepseek-coder"],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Failed to save profile: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-linear-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Add LLM Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="my-openai-profile"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Provider *
              </label>
              <select
                value={formData.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    provider: e.target.value as any,
                    model:
                      providerModels[
                        e.target.value as keyof typeof providerModels
                      ][0],
                  })
                }
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Model *
              </label>
              <select
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                {providerModels[formData.provider].map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                required
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.maxTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxTokens: parseInt(e.target.value),
                  })
                }
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Top P
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.topP}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    topP: parseFloat(e.target.value),
                  })
                }
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Save Profile
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
