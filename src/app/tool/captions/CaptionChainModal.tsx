"use client";

import { useState } from "react";

interface ChainResponse {
  id: string;
  llm_model_response: string | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  llm_temperature: number | null;
  processing_time_seconds: number | null;
  humor_flavor_step_id: number | null;
  created_datetime_utc: string | null;
  llm_models: { name: string } | null;
  humor_flavor_steps: { description: string | null; order_by: number | null } | null;
}

interface Props {
  captionId: string;
  captionContent: string;
  captionRequestId: string | null;
  llmPromptChainId: string | null;
  onClose: () => void;
}

export function CaptionChainModal({ captionId, captionContent, captionRequestId, llmPromptChainId, onClose }: Props) {
  const [responses, setResponses] = useState<ChainResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadChain() {
    if (!llmPromptChainId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chain/${llmPromptChainId}`);
      if (!res.ok) throw new Error(`Failed to load chain: ${res.status}`);
      const data = await res.json();
      setResponses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on mount
  if (responses === null && !loading && !error && llmPromptChainId) {
    loadChain();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="my-4 w-full max-w-3xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Prompt Chain</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
              caption: {captionId.slice(0, 8)}…
              {captionRequestId && ` · request: ${captionRequestId.slice(0, 8)}…`}
              {llmPromptChainId && ` · chain: ${llmPromptChainId.slice(0, 8)}…`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Final caption */}
          <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">Final Caption</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{captionContent}</p>
          </div>

          {/* Chain steps */}
          {!llmPromptChainId ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No prompt chain linked to this caption.</p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <svg className="h-5 w-5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">Loading chain…</span>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : responses && responses.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {responses.length} step{responses.length !== 1 ? "s" : ""} in chain
              </p>
              {responses.map((r, idx) => (
                <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  {/* Step header */}
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-bold text-violet-700 dark:text-violet-300">
                      {r.humor_flavor_steps?.order_by ?? idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {r.humor_flavor_steps?.description ?? `Step ${idx + 1}`}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {r.llm_models?.name && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{r.llm_models.name}</span>
                      )}
                      {r.llm_temperature != null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">temp: {r.llm_temperature}</span>
                      )}
                      {r.processing_time_seconds != null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{r.processing_time_seconds.toFixed(2)}s</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {r.llm_system_prompt && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide select-none hover:text-gray-700 dark:hover:text-gray-300">
                          System Prompt
                        </summary>
                        <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto">
                          {r.llm_system_prompt}
                        </pre>
                      </details>
                    )}
                    {r.llm_user_prompt && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide select-none hover:text-gray-700 dark:hover:text-gray-300">
                          User Prompt
                        </summary>
                        <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto">
                          {r.llm_user_prompt}
                        </pre>
                      </details>
                    )}
                    {r.llm_model_response && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">Response</p>
                        <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap break-words font-mono max-h-48 overflow-y-auto">
                          {r.llm_model_response}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No chain responses found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
