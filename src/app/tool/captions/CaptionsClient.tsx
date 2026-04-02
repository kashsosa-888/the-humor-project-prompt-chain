"use client";

import { useState } from "react";
import { CaptionChainModal } from "./CaptionChainModal";

interface Caption {
  id: string;
  content: string;
  created_datetime_utc: string | null;
  image_id: string | null;
  caption_requests: {
    id: string;
    llm_prompt_chains: { id: string } | null;
  } | null;
  images: { url: string } | null;
}

interface Flavor {
  id: number;
  slug: string;
}

interface Props {
  captions: Caption[];
  flavors: Flavor[];
  total: number;
  page: number;
  perPage: number;
  flavorId: string;
}

export function CaptionsClient({ captions, flavors, total, page, perPage, flavorId }: Props) {
  const [selected, setSelected] = useState<Caption | null>(null);

  const totalPages = Math.ceil(total / perPage);

  function buildUrl(p: number, fId: string) {
    const params = new URLSearchParams();
    if (fId) params.set("flavor_id", fId);
    if (p > 1) params.set("page", String(p));
    return `/tool/captions?${params.toString()}`;
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by flavor:</label>
        <select
          value={flavorId}
          onChange={(e) => {
            window.location.href = buildUrl(1, e.target.value);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All flavors</option>
          {flavors.map((f) => (
            <option key={f.id} value={f.id}>{f.slug}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {total} caption{total !== 1 ? "s" : ""}
        </span>
      </div>

      {captions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No captions found. Generate some using a flavor.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Caption</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">IDs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {captions.map((caption) => {
                const chainId = caption.caption_requests?.llm_prompt_chains?.id ?? null;
                const requestId = caption.caption_requests?.id ?? null;
                return (
                  <tr key={caption.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      {caption.images?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={caption.images.url}
                          alt=""
                          className="h-12 w-16 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <span className="text-xs text-gray-400">—</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-900 dark:text-gray-100 line-clamp-2">{caption.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500" title={caption.id}>
                          cap: {caption.id.slice(0, 8)}…
                        </p>
                        {requestId && (
                          <p className="text-xs font-mono text-gray-400 dark:text-gray-500" title={requestId}>
                            req: {requestId.slice(0, 8)}…
                          </p>
                        )}
                        {chainId && (
                          <p className="text-xs font-mono text-gray-400 dark:text-gray-500" title={chainId}>
                            chn: {chainId.slice(0, 8)}…
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                      {caption.created_datetime_utc
                        ? new Date(caption.created_datetime_utc).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(caption)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <a
            href={page > 1 ? buildUrl(page - 1, flavorId) : "#"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              page <= 1
                ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Previous
          </a>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <a
            href={page < totalPages ? buildUrl(page + 1, flavorId) : "#"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              page >= totalPages
                ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Next
          </a>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <CaptionChainModal
          captionId={selected.id}
          captionContent={selected.content}
          captionRequestId={selected.caption_requests?.id ?? null}
          llmPromptChainId={selected.caption_requests?.llm_prompt_chains?.id ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
