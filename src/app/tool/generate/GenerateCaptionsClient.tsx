"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const API_BASE = "https://api.almostcrackd.ai";

interface Flavor {
  id: string;
  slug: string;
  description: string | null;
}

interface Caption {
  id: string;
  content: string;
  [key: string]: unknown;
}

type Step =
  | { name: "idle" }
  | { name: "generating-url" }
  | { name: "uploading" }
  | { name: "registering" }
  | { name: "generating" }
  | { name: "done" };

export function GenerateCaptionsClient({ flavors }: { flavors: Flavor[] }) {
  const [selectedFlavorId, setSelectedFlavorId] = useState(flavors[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ name: "idle" });
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setCaptions([]);
    setError(null);
  }

  async function handleGenerate() {
    if (!file || !selectedFlavorId) return;
    setError(null);
    setCaptions([]);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError("Not authenticated. Please sign in again.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      // Step 1: Get presigned URL
      setStep({ name: "generating-url" });
      const presignRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers,
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.text();
        throw new Error(`Presign failed (${presignRes.status}): ${body}`);
      }
      const { presignedUrl, cdnUrl } = await presignRes.json();

      // Step 2: Upload image bytes
      setStep({ name: "uploading" });
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

      // Step 3: Register image
      setStep({ name: "registering" });
      const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
        method: "POST",
        headers,
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });
      if (!registerRes.ok) {
        const body = await registerRes.text();
        throw new Error(`Register failed (${registerRes.status}): ${body}`);
      }
      const { imageId } = await registerRes.json();

      // Step 4: Generate captions with specific flavor
      setStep({ name: "generating" });
      const captionRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ imageId, humorFlavorId: selectedFlavorId }),
      });
      if (!captionRes.ok) {
        const body = await captionRes.text();
        throw new Error(`Caption generation failed (${captionRes.status}): ${body}`);
      }
      const result = await captionRes.json();
      const captionArray = Array.isArray(result) ? result : result.captions ?? [];
      setCaptions(captionArray);
      setStep({ name: "done" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
      setStep({ name: "idle" });
    }
  }

  const isLoading = step.name !== "idle" && step.name !== "done";

  const stepLabels: Record<string, string> = {
    "generating-url": "Getting upload URL…",
    uploading: "Uploading image…",
    registering: "Registering image…",
    generating: "Generating captions…",
  };

  const stepProgress: Record<string, number> = {
    "generating-url": 1,
    uploading: 2,
    registering: 3,
    generating: 4,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Input panel */}
      <div className="space-y-5">
        {/* Flavor selector */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Humor Flavor
          </label>
          {flavors.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No flavors found. Create one first.</p>
          ) : (
            <div className="space-y-2">
              {flavors.map((flavor) => (
                <label
                  key={flavor.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                    selectedFlavorId === flavor.id
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="flavorId"
                    value={flavor.id}
                    checked={selectedFlavorId === flavor.id}
                    onChange={() => setSelectedFlavorId(flavor.id)}
                    className="mt-0.5 h-4 w-4 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">{flavor.slug}</p>
                    {flavor.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{flavor.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Image upload */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Image
          </label>

          {preview ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setCaptions([]);
                  setStep({ name: "idle" });
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Remove image
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
            >
              <svg className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload image</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPEG, PNG, WebP, GIF, HEIC</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!file || !selectedFlavorId || isLoading || flavors.length === 0}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {stepLabels[step.name] ?? "Processing…"}
            </span>
          ) : (
            "Generate Captions"
          )}
        </button>

        {/* Progress indicator */}
        {isLoading && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  n <= (stepProgress[step.name] ?? 0)
                    ? "bg-violet-500"
                    : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Right: Results panel */}
      <div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 min-h-[200px]">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Generated Captions
            {captions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                ({captions.length})
              </span>
            )}
          </h2>

          {step.name === "idle" && captions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Captions will appear here after generation.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg className="h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stepLabels[step.name]}</p>
            </div>
          )}

          {step.name === "done" && captions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
              No captions returned. The flavor may have no steps or the pipeline returned an empty result.
            </p>
          )}

          {captions.length > 0 && (
            <div className="space-y-3">
              {captions.map((caption, idx) => (
                <div
                  key={caption.id ?? idx}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
                >
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">
                    Caption {idx + 1}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {caption.content ?? JSON.stringify(caption)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
