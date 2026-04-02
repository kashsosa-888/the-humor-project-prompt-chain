"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const API_BASE = "https://api.almostcrackd.ai";

interface Flavor {
  id: number;
  slug: string;
  description: string | null;
}

interface Image {
  id: string;
  url: string;
}

type JobStatus = "pending" | "running" | "done" | "error";

interface Job {
  imageId: string;
  imageUrl: string;
  status: JobStatus;
  captions: string[];
  error?: string;
}

export function TestClient({ flavors, images }: { flavors: Flavor[]; images: Image[] }) {
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(flavors[0]?.id?.toString() ?? "");
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);

  function toggleImage(id: string) {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedImageIds(new Set(images.map((i) => i.id)));
  }

  function clearAll() {
    setSelectedImageIds(new Set());
  }

  async function runTest() {
    if (!selectedFlavorId || selectedImageIds.size === 0) return;
    setRunning(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      alert("Not authenticated. Please sign in again.");
      setRunning(false);
      return;
    }

    // Initialize jobs
    const initialJobs: Job[] = images
      .filter((img) => selectedImageIds.has(img.id))
      .map((img) => ({ imageId: img.id, imageUrl: img.url, status: "pending", captions: [] }));
    setJobs(initialJobs);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Process images in parallel
    await Promise.all(
      initialJobs.map(async (job) => {
        // Update status to running
        setJobs((prev) =>
          prev.map((j) => (j.imageId === job.imageId ? { ...j, status: "running" } : j))
        );

        try {
          const res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
            method: "POST",
            headers,
            body: JSON.stringify({ imageId: job.imageId, humorFlavorId: selectedFlavorId }),
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`${res.status}: ${body}`);
          }
          const result = await res.json();
          const captionArray: { content?: string }[] = Array.isArray(result) ? result : (result.captions ?? []);
          const contents = captionArray.map((c) => c.content ?? JSON.stringify(c));
          setJobs((prev) =>
            prev.map((j) =>
              j.imageId === job.imageId ? { ...j, status: "done", captions: contents } : j
            )
          );
        } catch (e) {
          setJobs((prev) =>
            prev.map((j) =>
              j.imageId === job.imageId
                ? { ...j, status: "error", error: e instanceof Error ? e.message : "Unknown error" }
                : j
            )
          );
        }
      })
    );

    setRunning(false);
  }

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Config */}
      <div className="space-y-5">
        {/* Flavor selector */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Humor Flavor
          </label>
          <select
            value={selectedFlavorId}
            onChange={(e) => setSelectedFlavorId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">— Select flavor —</option>
            {flavors.map((f) => (
              <option key={f.id} value={f.id}>{f.slug}</option>
            ))}
          </select>
        </div>

        {/* Image set selector */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Image Set <span className="font-normal text-gray-400">({selectedImageIds.size}/{images.length})</span>
            </label>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">All</button>
              <button onClick={clearAll} className="text-xs text-gray-400 hover:underline">None</button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {images.map((img) => (
              <label
                key={img.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all ${
                  selectedImageIds.has(img.id)
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedImageIds.has(img.id)}
                  onChange={() => toggleImage(img.id)}
                  className="h-3.5 w-3.5 rounded text-violet-600 focus:ring-violet-500"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-8 w-10 object-cover rounded flex-shrink-0"
                />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">{img.id.slice(0, 8)}…</span>
              </label>
            ))}
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={runTest}
          disabled={!selectedFlavorId || selectedImageIds.size === 0 || running}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing…
            </span>
          ) : (
            `Run Test (${selectedImageIds.size} image${selectedImageIds.size !== 1 ? "s" : ""})`
          )}
        </button>
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-2 space-y-4">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center min-h-[200px]">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Select a flavor and images, then click Run Test.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              All images process in parallel with real-time status.
            </p>
          </div>
        ) : (
          <>
            {/* Progress summary */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{jobs.length} total</span>
              <span className="text-green-600 dark:text-green-400">{doneCount} done</span>
              {errorCount > 0 && <span className="text-red-500">{errorCount} errors</span>}
              {running && (
                <span className="text-violet-500">
                  {jobs.filter((j) => j.status === "running").length} running…
                </span>
              )}
            </div>

            {jobs.map((job) => (
              <div key={job.imageId} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Image + status header */}
                <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={job.imageUrl} alt="" className="h-10 w-14 object-cover rounded flex-shrink-0" />
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 flex-1 truncate">{job.imageId.slice(0, 8)}…</span>
                  <StatusBadge status={job.status} />
                </div>

                {/* Captions or error */}
                <div className="p-3">
                  {job.status === "pending" && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">Waiting…</p>
                  )}
                  {job.status === "running" && (
                    <div className="flex items-center gap-2">
                      <svg className="h-3 w-3 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs text-gray-500">Generating…</span>
                    </div>
                  )}
                  {job.status === "error" && (
                    <p className="text-xs text-red-600 dark:text-red-400">{job.error}</p>
                  )}
                  {job.status === "done" && (
                    <ul className="space-y-1">
                      {job.captions.map((c, i) => (
                        <li key={i} className="text-xs text-gray-800 dark:text-gray-200 pl-3 border-l-2 border-violet-300 dark:border-violet-700">
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    pending: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
    running: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    done: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    error: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
